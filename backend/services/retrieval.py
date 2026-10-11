import re
import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.db.database import TranscriptChunk, TranscriptDocument

def tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r'\b[A-Za-z0-9_]{3,}\b', text)]

class RetrievalService:
    @staticmethod
    def search(db: Session, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        tokens = tokenize(query)
        if not tokens:
            return []
            
        # BM25-like scoring over chunks
        # Fetch candidate chunks that match query terms
        results = []
        
        # Build filter using terms
        chunks = db.query(
            TranscriptChunk, TranscriptDocument.title, TranscriptDocument.guest, 
            TranscriptDocument.post_url, TranscriptDocument.doc_type
        ).join(
            TranscriptDocument, TranscriptChunk.document_id == TranscriptDocument.id
        ).all()
        
        scored_chunks = []
        for chunk, doc_title, guest, post_url, doc_type in chunks:
            chunk_tokens = tokenize(chunk.content)
            if not chunk_tokens:
                continue
                
            chunk_len = len(chunk_tokens)
            score = 0.0
            
            # Count matches
            chunk_token_set = set(chunk_tokens)
            matched_terms = [t for t in tokens if t in chunk_token_set]
            if not matched_terms:
                continue
                
            for term in matched_terms:
                term_count = chunk_tokens.count(term)
                # Term frequency saturation
                tf = (term_count * 2.2) / (term_count + 1.2 * (0.25 + 0.75 * (chunk_len / 200.0)))
                # Guest or title match bonus
                bonus = 1.0
                if guest and term in guest.lower():
                    bonus += 1.5
                if doc_title and term in doc_title.lower():
                    bonus += 1.0
                score += tf * bonus
                
            if score > 0:
                scored_chunks.append({
                    "score": score,
                    "chunk_id": chunk.id,
                    "document_id": chunk.document_id,
                    "title": doc_title,
                    "guest": guest,
                    "post_url": post_url,
                    "doc_type": doc_type,
                    "speaker": chunk.speaker,
                    "timestamp": chunk.timestamp,
                    "excerpt": chunk.content[:400] + ("..." if len(chunk.content) > 400 else ""),
                    "full_content": chunk.content
                })
                
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
