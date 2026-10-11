import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db.database import SessionLocal, SessionModel, MessageModel
from backend.services.retrieval import RetrievalService

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_models_config():
    response = client.get("/api/config/models")
    assert response.status_code == 200
    data = response.json()
    assert "ollama" in data
    assert "anthropic" in data
    assert "openai" in data

def test_knowledge_status():
    response = client.get("/api/knowledge/status")
    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] >= 50
    assert data["total_chunks"] > 1000

def test_search_knowledge():
    response = client.get("/api/knowledge/search?q=retention&top_k=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    assert "title" in data["results"][0]
    assert "excerpt" in data["results"][0]

def test_session_lifecycle_and_isolation():
    # Create session 1
    res1 = client.post("/api/sessions", json={"title": "Session Alpha"})
    assert res1.status_code == 200
    s1_id = res1.json()["id"]

    # Create session 2
    res2 = client.post("/api/sessions", json={"title": "Session Beta"})
    assert res2.status_code == 200
    s2_id = res2.json()["id"]

    # Send message to session 1
    res_msg1 = client.post(f"/api/sessions/{s1_id}/messages", json={"content": "What did Adam Mosseri say about AI?", "provider": "ollama"})
    assert res_msg1.status_code == 200

    # Verify session 1 has 2 messages (user + assistant)
    m1_list = client.get(f"/api/sessions/{s1_id}/messages").json()
    assert len(m1_list) == 2

    # Verify session 2 has 0 messages (strict session isolation)
    m2_list = client.get(f"/api/sessions/{s2_id}/messages").json()
    assert len(m2_list) == 0

    # Cleanup
    client.delete(f"/api/sessions/{s1_id}")
    client.delete(f"/api/sessions/{s2_id}")

def test_artifact_generation():
    res = client.post("/api/artifacts/generate", json={
        "content": "Test framework for PLG growth loops",
        "format_type": "html",
        "title": "PLG Framework"
    })
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert "content" in data
    assert "<!DOCTYPE html>" in data["content"] or "<html" in data["content"]
