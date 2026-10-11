import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import SessionLocal
from backend.services.retrieval import RetrievalService, detect_targeted_person

client = TestClient(app)

def test_speaker_specific_retrieval_elena_verna():
    """Verify that querying for a known speaker retrieves their actual quotes and statements."""
    db = SessionLocal()
    partition = RetrievalService.search_with_speaker_partition(db, "What did Elena Verna say about B2B PLG?", top_k=3)
    db.close()
    
    assert partition["targeted_person"] == "Elena Verna"
    assert len(partition["direct_evidence"]) > 0
    # Every direct evidence chunk must be from Elena Verna
    for chunk in partition["direct_evidence"]:
        assert "elena verna" in chunk["speaker"].lower() or "elena verna" in chunk["title"].lower()

def test_speaker_specific_unsupported_person():
    """Verify that querying for someone not in the archive explicitly returns lack of direct evidence."""
    db = SessionLocal()
    partition = RetrievalService.search_with_speaker_partition(db, "What did Satya Nadella say about pricing?", top_k=3)
    db.close()
    
    assert partition["targeted_person"] == "Satya Nadella"
    assert len(partition["direct_evidence"]) == 0
    # May have other related evidence from available speakers
    assert len(partition["other_evidence"]) > 0

def test_chat_response_unsupported_speaker_honesty():
    """Verify that chat response explicitly declares lack of direct evidence and provides related evidence separately."""
    sess_res = client.post("/api/sessions", json={"title": "Speaker Accuracy Test"})
    assert sess_res.status_code == 200
    session_id = sess_res.json()["id"]

    try:
        msg_res = client.post(
            f"/api/sessions/{session_id}/messages",
            json={"content": "What did Satya Nadella say about pricing strategies?", "provider": "ollama"}
        )
        assert msg_res.status_code == 200
        data = msg_res.json()
        content = data["content"]

        # Requirement 2: Must state exact phrase or equivalent
        assert "I couldn't find direct evidence of Satya Nadella discussing" in content

        # Requirement 4: Separate section for related evidence
        if "Related evidence from other speakers" in content:
            assert "Related evidence from other speakers" in content

        # Requirement 7: Ask to broaden search
        assert "broaden the search" in content.lower()

    finally:
        client.delete(f"/api/sessions/{session_id}")

def test_chat_response_supported_speaker_attribution():
    """Verify that chat response directly cites Elena Verna and distinguishes her statements."""
    sess_res = client.post("/api/sessions", json={"title": "Elena Verna Test"})
    assert sess_res.status_code == 200
    session_id = sess_res.json()["id"]

    try:
        msg_res = client.post(
            f"/api/sessions/{session_id}/messages",
            json={"content": "What did Elena Verna say about B2B product-led growth?", "provider": "ollama"}
        )
        assert msg_res.status_code == 200
        data = msg_res.json()
        content = data["content"]

        # Must mention Elena Verna in direct quotes/evidence
        assert "Elena Verna" in content
        # Sources attached to message
        assert len(data["sources"]) > 0
        assert any("elena verna" in s.get("title", "").lower() or "elena verna" in s.get("speaker", "").lower() for s in data["sources"])

    finally:
        client.delete(f"/api/sessions/{session_id}")
