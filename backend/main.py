import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.db.database import init_db, SessionLocal
from backend.routers.api import router
from backend.services.ingestion import IngestionService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("lenny_growth")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Database...")
    init_db()
    
    # Auto-ingest starter transcripts if database empty
    db = SessionLocal()
    try:
        stats = IngestionService.get_stats(db)
        if stats["total_documents"] == 0:
            logger.info("Knowledge base is empty. Automatically indexing starter transcripts...")
            res = IngestionService.ingest_repository(db)
            logger.info(f"Ingested {res['files_indexed']} documents with {res['chunks_indexed']} chunks.")
    except Exception as e:
        logger.error(f"Error during startup ingestion: {e}")
    finally:
        db.close()
        
    yield
    logger.info("Shutting down Lenny Growth Intelligence...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Evidence-first product strategy workspace grounded in Lenny's Podcast transcripts",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "product": "Lenny Growth Intelligence",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }
