import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from backend.db.database import get_db, SessionModel, MessageModel, ArtifactModel, UserModel, TranscriptDocument
from backend.services.retrieval import RetrievalService
from backend.services.models import ModelProviderService
from backend.services.essay import EssayService
from backend.services.artifacts import ArtifactService
from backend.services.ingestion import IngestionService
from backend.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user
)

logger = logging.getLogger("lenny_growth")
router = APIRouter(prefix="/api")

# --- AUTH SCHEMAS ---
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    display_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str]
    created_at: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- EXISTING & EXTENDED SCHEMAS ---
class CreateSessionRequest(BaseModel):
    title: Optional[str] = "New Research Session"

class SessionResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

class MessageRequest(BaseModel):
    content: str
    provider: Optional[str] = None
    model: Optional[str] = None

class EssayRequest(BaseModel):
    topic: str
    session_id: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    speaker_preference: Optional[str] = None
    custom_instructions: Optional[str] = None

class ArtifactCreateRequest(BaseModel):
    content: str
    format_type: str = "html" # 'html', 'markdown', or 'essay'
    title: Optional[str] = "Strategy Artifact"
    session_id: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

class ArtifactUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    content_type: Optional[str] = None

class ArtifactResponse(BaseModel):
    id: str
    session_id: Optional[str]
    title: str
    content_type: str
    content: str
    created_at: str
    updated_at: Optional[str] = None

# ==============================================================================
# AUTHENTICATION ENDPOINTS
# ==============================================================================
@router.post("/auth/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    existing = db.query(UserModel).filter(UserModel.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    hashed = hash_password(req.password)
    user = UserModel(
        email=clean_email,
        hashed_password=hashed,
        display_name=req.display_name or clean_email.split('@')[0]
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthTokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            created_at=user.created_at.isoformat() if user.created_at else ""
        )
    )

@router.post("/auth/login", response_model=AuthTokenResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(UserModel).filter(UserModel.email == clean_email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    token = create_access_token({"sub": user.id, "email": user.email})
    return AuthTokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            created_at=user.created_at.isoformat() if user.created_at else ""
        )
    )

@router.get("/auth/me", response_model=UserResponse)
def get_current_user_profile(user: UserModel = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        created_at=user.created_at.isoformat() if user.created_at else ""
    )

# ==============================================================================
# SYSTEM & KNOWLEDGE RETRIEVAL (PUBLIC / OPERATIONAL)
# ==============================================================================
@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(SessionModel.__table__.select().limit(1))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {"status": "ok", "database": db_status}

@router.get("/config/models")
async def get_models_config():
    return await ModelProviderService.get_provider_status()

@router.get("/knowledge/status")
def get_knowledge_status(db: Session = Depends(get_db)):
    return IngestionService.get_stats(db)

@router.post("/knowledge/ingest")
def trigger_ingestion(db: Session = Depends(get_db)):
    return IngestionService.ingest_repository(db)

@router.get("/knowledge/search")
def search_knowledge(q: str = Query(..., min_length=1), top_k: int = 5, db: Session = Depends(get_db)):
    results = RetrievalService.search(db, q, top_k=top_k)
    return {"query": q, "results": results}

# ==============================================================================
# SESSIONS & CHAT (AUTHENTICATED WITH GUEST COMPATIBILITY)
# ==============================================================================
@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(user: Optional[UserModel] = Depends(get_optional_user), db: Session = Depends(get_db)):
    query = db.query(SessionModel)
    if user:
        # User sees their own sessions + legacy/unassigned sessions
        query = query.filter((SessionModel.user_id == user.id) | (SessionModel.user_id == None))
    else:
        # Unauthenticated / guest mode: see unassigned sessions
        query = query.filter(SessionModel.user_id == None)
        
    sessions = query.order_by(SessionModel.updated_at.desc()).all()
    res = []
    for s in sessions:
        res.append(SessionResponse(
            id=s.id,
            title=s.title,
            created_at=s.created_at.isoformat() if s.created_at else "",
            updated_at=s.updated_at.isoformat() if s.updated_at else "",
            message_count=len(s.messages)
        ))
    return res

@router.post("/sessions", response_model=SessionResponse)
def create_session(
    req: CreateSessionRequest,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    s = SessionModel(
        title=req.title,
        user_id=user.id if user else None
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return SessionResponse(
        id=s.id,
        title=s.title,
        created_at=s.created_at.isoformat() if s.created_at else "",
        updated_at=s.updated_at.isoformat() if s.updated_at else "",
        message_count=0
    )

@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: str,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    s = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Enforce ownership: If session belongs to a user, another user cannot read it
    if s.user_id and (not user or s.user_id != user.id):
        raise HTTPException(status_code=403, detail="You do not have access to this conversation.")

    messages = db.query(MessageModel).filter(MessageModel.session_id == session_id).order_by(MessageModel.created_at.asc()).all()
    results = []
    for m in messages:
        sources = json.loads(m.sources_json) if m.sources_json else []
        results.append({
            "id": m.id,
            "session_id": m.session_id,
            "role": m.role,
            "content": m.content,
            "sources": sources,
            "model_provider": m.model_provider,
            "created_at": m.created_at.isoformat() if m.created_at else ""
        })
    return results

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    s = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if s.user_id and (not user or s.user_id != user.id):
        raise HTTPException(status_code=403, detail="You do not have permission to delete this conversation.")

    db.delete(s)
    db.commit()
    return {"status": "deleted", "id": session_id}

@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    req: MessageRequest,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    s = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if s.user_id and (not user or s.user_id != user.id):
        raise HTTPException(status_code=403, detail="You do not have permission to post to this conversation.")
        
    # Save user message
    user_msg = MessageModel(
        session_id=session_id,
        role="user",
        content=req.content,
        model_provider=req.provider
    )
    db.add(user_msg)
    db.commit()

    # Retrieve relevant knowledge
    retrieved_chunks = RetrievalService.search(db, req.content, top_k=4)
    
    # Formulate prompt with evidence
    evidence_text = ""
    if retrieved_chunks:
        evidence_lines = []
        for i, c in enumerate(retrieved_chunks):
            evidence_lines.append(
                f"[{i+1}] Episode: \"{c['title']}\" | Speaker: {c['speaker']} ({c['timestamp']})\n"
                f"Excerpt: {c['excerpt']}\n"
            )
        evidence_text = "\n".join(evidence_lines)
    else:
        evidence_text = "No direct transcript matches were found in the knowledge base."

    system_prompt = (
        "You are Lenny Growth Intelligence, an evidence-first AI product strategy advisor. "
        "Ground your advice strictly on the provided Lenny's Podcast and Newsletter transcript evidence. "
        "Cite episode titles and speakers by name. If the evidence does not contain sufficient details to answer, "
        "honestly acknowledge this limitation rather than fabricating facts."
    )
    
    prompt = f"""
USER QUESTION:
{req.content}

RETRIEVED TRANSCRIPT EVIDENCE:
{evidence_text}

INSTRUCTIONS:
Provide a comprehensive, high-signal, practical answer. Ground each recommendation in the provided quotes and insights.
Distinguish clearly between direct guest lessons and strategic synthesis.
"""

    provider_used = req.provider or "ollama"
    try:
        assistant_content = await ModelProviderService.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            provider=req.provider,
            model=req.model
        )
    except Exception as e:
        logger.error(f"Inference error: {e}")
        assistant_content = (
            f"**Model Execution Notice**: Could not complete request via `{provider_used}`.\n\n"
            f"**Error Details**: {str(e)}\n\n"
            "**Retrieved Grounded Evidence from Archive**:\n" +
            (evidence_text if retrieved_chunks else "No relevant transcript chunks found.")
        )

    assistant_msg = MessageModel(
        session_id=session_id,
        role="assistant",
        content=assistant_content,
        sources_json=json.dumps(retrieved_chunks),
        model_provider=provider_used
    )
    db.add(assistant_msg)
    
    if s.title == "New Research Session":
        s.title = req.content[:40] + ("..." if len(req.content) > 40 else "")
        
    db.commit()
    db.refresh(assistant_msg)

    return {
        "id": assistant_msg.id,
        "session_id": assistant_msg.session_id,
        "role": assistant_msg.role,
        "content": assistant_msg.content,
        "sources": retrieved_chunks,
        "model_provider": provider_used,
        "created_at": assistant_msg.created_at.isoformat()
    }

# ==============================================================================
# WRITING STUDIO / ESSAY GENERATION
# ==============================================================================
@router.post("/essay/generate")
async def generate_essay(
    req: EssayRequest,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    search_query = req.topic
    if req.speaker_preference:
        search_query += f" {req.speaker_preference}"
        
    retrieved_chunks = RetrievalService.search(db, search_query, top_k=6)
    
    # Custom instructions support
    effective_topic = req.topic
    if req.custom_instructions:
        effective_topic += f"\n\nAdditional Guidance: {req.custom_instructions}"
        
    essay_content = await EssayService.generate_ship30_essay(
        topic=effective_topic,
        retrieved_chunks=retrieved_chunks,
        provider=req.provider,
        model=req.model
    )
    word_count = len(essay_content.split())
    
    # Save as artifact automatically
    art = ArtifactModel(
        session_id=req.session_id,
        user_id=user.id if user else None,
        title=f"Ship 30 Essay: {req.topic[:35]}",
        content_type="essay",
        content=essay_content
    )
    db.add(art)
    db.commit()
    db.refresh(art)

    return {
        "id": art.id,
        "topic": req.topic,
        "content": essay_content,
        "word_count": word_count,
        "sources": retrieved_chunks,
        "artifact_id": art.id
    }

# ==============================================================================
# ARTIFACT WORKSPACE CRUD & SECURITY
# ==============================================================================
@router.post("/artifacts/generate", response_model=ArtifactResponse)
async def generate_artifact(
    req: ArtifactCreateRequest,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    generated_content = await ArtifactService.generate_artifact(
        content=req.content,
        format_type=req.format_type,
        provider=req.provider,
        model=req.model
    )
    art = ArtifactModel(
        session_id=req.session_id,
        user_id=user.id if user else None,
        title=req.title,
        content_type=req.format_type,
        content=generated_content
    )
    db.add(art)
    db.commit()
    db.refresh(art)

    return ArtifactResponse(
        id=art.id,
        session_id=art.session_id,
        title=art.title,
        content_type=art.content_type,
        content=art.content,
        created_at=art.created_at.isoformat() if art.created_at else "",
        updated_at=art.updated_at.isoformat() if art.updated_at else None
    )

@router.get("/artifacts", response_model=List[ArtifactResponse])
def list_artifacts(
    session_id: Optional[str] = None,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(ArtifactModel)
    if user:
        query = query.filter((ArtifactModel.user_id == user.id) | (ArtifactModel.user_id == None))
    else:
        query = query.filter(ArtifactModel.user_id == None)
        
    if session_id:
        query = query.filter(ArtifactModel.session_id == session_id)
        
    artifacts = query.order_by(ArtifactModel.created_at.desc()).all()
    return [
        ArtifactResponse(
            id=a.id,
            session_id=a.session_id,
            title=a.title,
            content_type=a.content_type,
            content=a.content,
            created_at=a.created_at.isoformat() if a.created_at else "",
            updated_at=a.updated_at.isoformat() if a.updated_at else None
        )
        for a in artifacts
    ]

@router.get("/artifacts/{artifact_id}", response_model=ArtifactResponse)
def get_artifact(
    artifact_id: str,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    art = db.query(ArtifactModel).filter(ArtifactModel.id == artifact_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")
        
    if art.user_id and (not user or art.user_id != user.id):
        raise HTTPException(status_code=403, detail="You do not have permission to view this artifact.")
        
    return ArtifactResponse(
        id=art.id,
        session_id=art.session_id,
        title=art.title,
        content_type=art.content_type,
        content=art.content,
        created_at=art.created_at.isoformat() if art.created_at else "",
        updated_at=art.updated_at.isoformat() if art.updated_at else None
    )

@router.put("/artifacts/{artifact_id}", response_model=ArtifactResponse)
def update_artifact(
    artifact_id: str,
    req: ArtifactUpdateRequest,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    art = db.query(ArtifactModel).filter(ArtifactModel.id == artifact_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")
        
    if art.user_id and (not user or art.user_id != user.id):
        raise HTTPException(status_code=403, detail="You do not have permission to modify this artifact.")
        
    if req.title is not None:
        art.title = req.title
    if req.content is not None:
        art.content = req.content
    if req.content_type is not None:
        art.content_type = req.content_type
        
    db.commit()
    db.refresh(art)
    
    return ArtifactResponse(
        id=art.id,
        session_id=art.session_id,
        title=art.title,
        content_type=art.content_type,
        content=art.content,
        created_at=art.created_at.isoformat() if art.created_at else "",
        updated_at=art.updated_at.isoformat() if art.updated_at else None
    )

@router.delete("/artifacts/{artifact_id}")
def delete_artifact(
    artifact_id: str,
    user: Optional[UserModel] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    art = db.query(ArtifactModel).filter(ArtifactModel.id == artifact_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")
        
    if art.user_id and (not user or art.user_id != user.id):
        raise HTTPException(status_code=403, detail="You do not have permission to delete this artifact.")
        
    db.delete(art)
    db.commit()
    return {"status": "deleted", "id": artifact_id}
