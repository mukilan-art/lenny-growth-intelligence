import os
import glob
import re
import json
import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.db.database import TranscriptDocument, TranscriptChunk, SessionLocal
from backend.config import settings

def parse_frontmatter_and_body(content: str) -> Tuple[Dict[str, Any], str]:
    meta = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_meta = parts[1].strip()
            body = parts[2].strip()
            for line in raw_meta.splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    val = val.strip().strip('"').strip("'")
                    meta[key.strip()] = val
    return meta, body

def chunk_transcript(body: str, doc_id: str, chunk_size: int = 250, overlap: int = 50) -> List[Dict[str, Any]]:
    # Find speaker sections like **Speaker** (00:00:00):
    speaker_pattern = re.compile(r'\*\*([^*]+)\*\*\s*(?:\((\d{2}:\d{2}:\d{2})\))?:')
    
    chunks = []
    lines = body.split("\n")
    
    current_speaker = "Lenny Rachitsky"
    current_timestamp = "00:00:00"
    buffer_words = []
    chunk_index = 0
    
    for line in lines:
        match = speaker_pattern.match(line.strip())
        if match:
            current_speaker = match.group(1).strip()
            if match.group(2):
                current_timestamp = match.group(2).strip()
            content_part = line.strip()[match.end():].strip()
        else:
            content_part = line.strip()
            
        if not content_part:
            continue
            
        words = content_part.split()
        buffer_words.extend([(w, current_speaker, current_timestamp) for w in words])
        
        while len(buffer_words) >= chunk_size:
            chunk_slice = buffer_words[:chunk_size]
            chunk_text = " ".join([w[0] for w in chunk_slice])
            spk = chunk_slice[0][1]
            ts = chunk_slice[0][2]
            
            chunk_obj = {
                "id": f"{doc_id}_chunk_{chunk_index}",
                "chunk_index": chunk_index,
                "speaker": spk,
                "timestamp": ts,
                "content": chunk_text
            }
            chunks.append(chunk_obj)
            chunk_index += 1
            buffer_words = buffer_words[chunk_size - overlap:]
            
    if buffer_words:
        chunk_text = " ".join([w[0] for w in buffer_words])
        chunk_obj = {
            "id": f"{doc_id}_chunk_{chunk_index}",
            "chunk_index": chunk_index,
            "speaker": buffer_words[0][1],
            "timestamp": buffer_words[0][2],
            "content": chunk_text
        }
        chunks.append(chunk_obj)
        
    return chunks

# Lightweight TF-IDF / BM25 style vectorizer for fast, reliable semantic search
class IngestionService:
    @staticmethod
    def ingest_repository(db: Session, base_path: str = None) -> Dict[str, Any]:
        if not base_path:
            base_path = settings.TRANSCRIPTS_PATH
            
        files_indexed = 0
        chunks_indexed = 0
        
        # Search podcasts and newsletters
        md_files = glob.glob(os.path.join(base_path, "podcasts", "*.md")) + \
                   glob.glob(os.path.join(base_path, "newsletters", "*.md"))
        
        for file_path in md_files:
            file_name = os.path.basename(file_path)
            doc_id = os.path.splitext(file_name)[0]
            doc_type = "podcast" if "podcasts" in file_path else "newsletter"
            
            # Check if document already exists
            existing_doc = db.query(TranscriptDocument).filter(TranscriptDocument.id == doc_id).first()
            if existing_doc:
                continue
                
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                continue
                
            meta, body = parse_frontmatter_and_body(content)
            title = meta.get("title", doc_id.replace("-", " ").title())
            guest = meta.get("guest", None)
            date = meta.get("date", None)
            post_url = meta.get("post_url", None)
            word_count = int(meta.get("word_count", len(body.split())))
            
            doc = TranscriptDocument(
                id=doc_id,
                title=title,
                doc_type=doc_type,
                guest=guest,
                date=date,
                post_url=post_url,
                file_path=file_path,
                word_count=word_count
            )
            db.add(doc)
            
            chunks = chunk_transcript(body, doc_id)
            for ch in chunks:
                chunk_record = TranscriptChunk(
                    id=ch["id"],
                    document_id=doc_id,
                    chunk_index=ch["chunk_index"],
                    speaker=ch["speaker"],
                    timestamp=ch["timestamp"],
                    content=ch["content"]
                )
                db.add(chunk_record)
                chunks_indexed += 1
                
            files_indexed += 1
            if files_indexed % 10 == 0:
                db.commit()
                
        db.commit()
        return {
            "status": "success",
            "files_indexed": files_indexed,
            "chunks_indexed": chunks_indexed
        }

    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        doc_count = db.query(TranscriptDocument).count()
        chunk_count = db.query(TranscriptChunk).count()
        return {
            "total_documents": doc_count,
            "total_chunks": chunk_count
        }
