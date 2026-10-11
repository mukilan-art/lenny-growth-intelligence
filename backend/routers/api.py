import json
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.database import get_db, SessionModel, MessageModel, ArtifactModel, TranscriptDocument
from backend.services.retrieval import RetrievalService
from backend.services.models import ModelProviderService
from backend.services.essay import EssayService
from backend.services.artifacts import ArtifactService
from backend.services.ingestion import IngestionService

logger = logging.getLogger("lenny_growth")
router = APIRouter(prefix="/api")

# Schemas
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

class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    sources: Optional[List[dict]] = None
    model_provider: Optional[str] = None
    created_at: str

class EssayRequest(BaseModel):
    topic: str
    session_id: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

class ArtifactRequest(BaseModel):
    content: str
    format_type: str = "html" # 'html' or 'markdown'
    title: Optional[str] = "Strategy Artifact"
    session_id: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

# Routes
@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check DB
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

# Sessions
@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(SessionModel).order_by(SessionModel.updated_at.desc()).all()
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
def create_session(req: CreateSessionRequest, db: Session = Depends(get_db)):
    s = SessionModel(title=req.title)
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
def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    s = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
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
def delete_session(session_id: str, db: Session = Depends(get_db)):
    s = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(s)
    db.commit()
    return {"status": "deleted", "id": session_id}

@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, req: MessageRequest, db: Session = Depends(get_db)):
    s = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
        
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
        # Provide transparent and helpful fallback message
        assistant_content = (
            f"**Model Execution Notice**: Could not complete request via {provider_used}.\n\n"
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
    
    # Update session title if first exchange
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

@router.post("/essay/generate")
async def generate_essay(req: EssayRequest, db: Session = Depends(get_db)):
    retrieved_chunks = RetrievalService.search(db, req.topic, top_k=5)
    essay_content = await EssayService.generate_ship30_essay(
        topic=req.topic,
        retrieved_chunks=retrieved_chunks,
        provider=req.provider,
        model=req.model
    )
    word_count = len(essay_content.split())
    
    # Persist artifact if session_id provided
    artifact_id = None
    if req.session_id:
        art = ArtifactModel(
            session_id=req.session_id,
            title=f"Ship 30 Essay: {req.topic[:40]}",
            content_type="essay",
            content=essay_content
        )
        db.add(art)
        db.commit()
        artifact_id = art.id

    return {
        "topic": req.topic,
        "content": essay_content,
        "word_count": word_count,
        "sources": retrieved_chunks,
        "artifact_id": artifact_id
    }

@router.post("/artifacts/generate")
async def generate_artifact(req: ArtifactRequest, db: Session = Depends(get_db)):
    generated_content = await ArtifactService.generate_artifact(
        content=req.content,
        format_type=req.format_type,
        provider=req.provider,
        model=req.model
    )
    art = ArtifactModel(
        session_id=req.session_id,
        title=req.title,
        content_type=req.format_type,
        content=generated_content
    )
    db.add(art)
    db.commit()
    db.refresh(art)

    return {
        "id": art.id,
        "title": art.title,
        "content_type": art.content_type,
        "content": art.content,
        "created_at": art.created_at.isoformat()
    }

@router.get("/artifacts")
def list_artifacts(session_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ArtifactModel)
    if session_id:
        query = query.filter(ArtifactModel.session_id == session_id)
    artifacts = query.order_by(ArtifactModel.created_at.desc()).all()
    return [{
        "id": a.id,
        "session_id": a.session_id,
        "title": a.title,
        "content_type": a.content_type,
        "content": a.content,
        "created_at": a.created_at.isoformat()
    } for a in artifacts]
