import json
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, String, Text, DateTime,
    ForeignKey, Integer, inspect, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.pool import QueuePool, NullPool
from backend.config import settings

logger = logging.getLogger("lenny_growth.database")
Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    sessions = relationship("SessionModel", back_populates="owner", cascade="all, delete-orphan")
    artifacts = relationship("ArtifactModel", back_populates="owner",
                             primaryjoin="UserModel.id == foreign(ArtifactModel.user_id)",
                             cascade="all, delete-orphan")

class SessionModel(Base):
    __tablename__ = "sessions"
    
    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, default="New Research Session")
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    owner = relationship("UserModel", back_populates="sessions")
    messages = relationship("MessageModel", back_populates="session", cascade="all, delete-orphan")
    artifacts = relationship("ArtifactModel", back_populates="session",
                             foreign_keys="ArtifactModel.session_id",
                             cascade="all, delete-orphan")

class MessageModel(Base):
    __tablename__ = "messages"
    
    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=False)
    sources_json = Column(Text, nullable=True)
    model_provider = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    
    session = relationship("SessionModel", back_populates="messages")

class ArtifactModel(Base):
    __tablename__ = "artifacts"
    
    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    content_type = Column(String(64), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    
    session = relationship("SessionModel", back_populates="artifacts",
                           foreign_keys=[session_id])
    owner = relationship("UserModel", back_populates="artifacts",
                         foreign_keys=[user_id])

class TranscriptDocument(Base):
    __tablename__ = "transcript_documents"
    
    id = Column(String(128), primary_key=True)
    title = Column(String(255), nullable=False, index=True)
    doc_type = Column(String(64), nullable=False)
    guest = Column(String(128), nullable=True, index=True)
    date = Column(String(64), nullable=True)
    post_url = Column(String(512), nullable=True)
    file_path = Column(String(512), nullable=False)
    word_count = Column(Integer, default=0)
    indexed_at = Column(DateTime(timezone=True), default=get_utc_now)

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"
    
    id = Column(String(128), primary_key=True)
    document_id = Column(String(128), ForeignKey("transcript_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    speaker = Column(String(128), nullable=True, index=True)
    timestamp = Column(String(64), nullable=True)
    content = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True)

# Database Engine & Connection Pooling
def create_app_engine(db_url: str):
    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    # PostgreSQL configuration with connection pool
    return create_engine(
        db_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_pre_ping=True
    )

engine = create_app_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db(target_engine=None):
    """
    Creates all tables and applies migrations safely across both PostgreSQL and SQLite.
    Never silently swallows unexpected schema creation errors.
    """
    active_engine = target_engine or engine
    logger.info(f"Initializing database schema on: {active_engine.url.render_as_string(hide_password=True)}")
    
    # Create all defined tables
    Base.metadata.create_all(bind=active_engine)
    
    # Safe inspect & add missing columns if upgrading an older schema
    with active_engine.connect() as conn:
        inspector = inspect(active_engine)
        
        # Check sessions table
        session_cols = [c["name"] for c in inspector.get_columns("sessions")]
        if "user_id" not in session_cols:
            logger.info("Migrating schema: adding 'user_id' column to sessions table")
            conn.execute(text("ALTER TABLE sessions ADD COLUMN user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE"))
            conn.commit()

        # Check artifacts table
        artifact_cols = [c["name"] for c in inspector.get_columns("artifacts")]
        if "user_id" not in artifact_cols:
            logger.info("Migrating schema: adding 'user_id' column to artifacts table")
            conn.execute(text("ALTER TABLE artifacts ADD COLUMN user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE"))
            conn.commit()
            
        if "updated_at" not in artifact_cols:
            logger.info("Migrating schema: adding 'updated_at' column to artifacts table")
            conn.execute(text("ALTER TABLE artifacts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE"))
            conn.commit()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
