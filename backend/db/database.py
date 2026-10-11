import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.config import settings

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

class SessionModel(Base):
    __tablename__ = "sessions"
    
    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, default="New Research Session")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    messages = relationship("MessageModel", back_populates="session", cascade="all, delete-orphan")
    artifacts = relationship("ArtifactModel", back_populates="session", cascade="all, delete-orphan")

class MessageModel(Base):
    __tablename__ = "messages"
    
    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(32), nullable=False) # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    sources_json = Column(Text, nullable=True) # JSON list of cited chunks
    model_provider = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    session = relationship("SessionModel", back_populates="messages")

class ArtifactModel(Base):
    __tablename__ = "artifacts"
    
    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    content_type = Column(String(64), nullable=False) # 'markdown', 'html', 'essay'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    session = relationship("SessionModel", back_populates="artifacts")

class TranscriptDocument(Base):
    __tablename__ = "transcript_documents"
    
    id = Column(String(128), primary_key=True)
    title = Column(String(255), nullable=False)
    doc_type = Column(String(64), nullable=False) # 'podcast' or 'newsletter'
    guest = Column(String(128), nullable=True)
    date = Column(String(64), nullable=True)
    post_url = Column(String(512), nullable=True)
    file_path = Column(String(512), nullable=False)
    word_count = Column(Integer, default=0)
    indexed_at = Column(DateTime(timezone=True), default=get_utc_now)

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"
    
    id = Column(String(128), primary_key=True)
    document_id = Column(String(128), ForeignKey("transcript_documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    speaker = Column(String(128), nullable=True)
    timestamp = Column(String(64), nullable=True)
    content = Column(Text, nullable=False)
    # embedding serialized as JSON float array or null
    embedding_json = Column(Text, nullable=True)

# Database connection setup
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
