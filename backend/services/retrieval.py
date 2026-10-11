import re
import math
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from backend.db.database import TranscriptChunk, TranscriptDocument

def tokenize(text: str) -> List[str]:
    return [w.lower() for w in re.findall(r'\b[A-Za-z0-9_]{3,}\b', text)]

def clean_person_name(raw_name: str) -> str:
    # Clean version numbers like "Elena Verna 4.0" -> "Elena Verna"
    cleaned = re.sub(r'\s+\d+(\.\d+)*\b', '', raw_name).strip()
    return cleaned

def detect_targeted_person(query: str, db: Session) -> Optional[Tuple[str, str]]:
    """
    Detects if the query is asking about a specific person.
    Checks:
    1. Known guests/speakers in the archive.
    2. Common phrasing like "What did [Name] say/think", "According to [Name]".
    Returns (person_name, topic) or None.
    """
    query_lower = query.lower()
    
    # 1. Fetch all distinct guests and speakers from database
    doc_guests = db.query(TranscriptDocument.guest).filter(TranscriptDocument.guest != None).distinct().all()
    chunk_speakers = db.query(TranscriptChunk.speaker).filter(TranscriptChunk.speaker != None).distinct().all()
    
    known_names = set()
    for (g,) in doc_guests:
        if g:
            cleaned = clean_person_name(g)
            if len(cleaned.split()) >= 2:
                known_names.add(cleaned)
    for (s,) in chunk_speakers:
        if s and s != "Lenny Rachitsky":
            cleaned = clean_person_name(s)
            if len(cleaned.split()) >= 2:
                known_names.add(cleaned)
                
    for person in known_names:
        person_lower = person.lower()
        if person_lower in query_lower:
            topic = re.sub(re.escape(person), '', query, flags=re.IGNORECASE)
            topic = re.sub(r'\b(what did|what does|what says|think about|say about|discuss|regarding|on|about)\b', '', topic, flags=re.IGNORECASE).strip()
            return person, topic
            
    # 2. General pattern matching for arbitrary person queries like "What did [First Last] say about [topic]"
    person_patterns = [
        r'\bwhat did ([A-Z][a-z]+ [A-Z][a-z]+) (?:say|think|state|mention|recommend)\b',
        r'\bhow does ([A-Z][a-z]+ [A-Z][a-z]+) (?:recommend|scale|approach|view)\b',
        r'\baccording to ([A-Z][a-z]+ [A-Z][a-z]+)\b',
        r'\bwhat is ([A-Z][a-z]+ [A-Z][a-z]+)(?:\'s|s) (?:take|view|framework)\b'
    ]
    for pattern in person_patterns:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            candidate_person = match.group(1).strip()
            topic = re.sub(pattern, '', query, flags=re.IGNORECASE).strip()
            return candidate_person, topic
            
    return None

class RetrievalService:
    @staticmethod
    def search(db: Session, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        tokens = tokenize(query)
        if not tokens:
            return []
            
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
            
            chunk_token_set = set(chunk_tokens)
            matched_terms = [t for t in tokens if t in chunk_token_set]
            if not matched_terms:
                continue
                
            for term in matched_terms:
                term_count = chunk_tokens.count(term)
                tf = (term_count * 2.2) / (term_count + 1.2 * (0.25 + 0.75 * (chunk_len / 200.0)))
                bonus = 1.0
                if guest and term in guest.lower():
                    bonus += 2.0
                if doc_title and term in doc_title.lower():
                    bonus += 1.5
                if chunk.speaker and term in chunk.speaker.lower():
                    bonus += 2.0
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

    @staticmethod
    def search_with_speaker_partition(
        db: Session, query: str, top_k: int = 6
    ) -> Dict[str, Any]:
        detected = detect_targeted_person(query, db)
        
        # When querying for a specific person, search broadly for query terms
        raw_results = RetrievalService.search(db, query, top_k=top_k * 3)
        
        if not detected:
            return {
                "targeted_person": None,
                "topic": query,
                "direct_evidence": raw_results[:top_k],
                "other_evidence": []
            }
            
        person_name, topic = detected
        direct_evidence = []
        other_evidence = []
        
        person_lower = person_name.lower()
        parts = person_lower.split()
        
        for r in raw_results:
            spk = (r.get("speaker") or "").lower()
            guest = (r.get("guest") or "").lower()
            doc_title = (r.get("title") or "").lower()
            
            # Check if this chunk is spoken by the target person or from their featured interview
            is_speaker_match = person_lower in spk or all(p in spk for p in parts)
            is_guest_interview = (person_lower in guest or all(p in guest for p in parts)) and (spk != "lenny rachitsky")
            
            if is_speaker_match or is_guest_interview:
                direct_evidence.append(r)
            else:
                other_evidence.append(r)
                
        return {
            "targeted_person": person_name,
            "topic": topic if topic else query,
            "direct_evidence": direct_evidence[:top_k],
            "other_evidence": other_evidence[:top_k]
        }
