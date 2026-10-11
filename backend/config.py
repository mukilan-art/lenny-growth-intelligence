import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lenny Growth Intelligence"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/lenny_growth.db")
    
    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "lenny-growth-dev-secret-key-change-in-production-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days
    
    # Model configuration
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "ollama")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    TRANSCRIPTS_PATH: str = os.getenv("TRANSCRIPTS_PATH", "./transcripts_repo")
    AGENT_TYPE: str = os.getenv("AGENT_TYPE", "claude_agent")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
