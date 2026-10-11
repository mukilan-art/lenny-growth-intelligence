import os
import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Explicitly test against dedicated PostgreSQL test database: lenny_growth_test
PG_TEST_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/lenny_growth_test"
os.environ["DATABASE_URL"] = PG_TEST_URL

from backend.main import app
from backend.db.database import (
    Base, init_db, UserModel, SessionModel, MessageModel, ArtifactModel,
    TranscriptDocument, TranscriptChunk, get_db
)

test_engine = create_engine(PG_TEST_URL)
TestingSessionLocal = sessionmaker(bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_postgres_test_db():
    app.dependency_overrides[get_db] = override_get_db
    # Initialize fresh schema in PostgreSQL test database
    init_db(test_engine)
    
    # Seed sample transcript data for knowledge retrieval testing
    db = TestingSessionLocal()
    try:
        sample_doc = TranscriptDocument(
            id="test-doc-elena",
            title="Elena Verna 4.0",
            doc_type="podcast",
            guest="Elena Verna",
            date="2024-01-01",
            post_url="https://lennysnewsletter.com/p/elena-verna",
            file_path="transcripts_repo/sample.md",
            word_count=500
        )
        db.add(sample_doc)
        db.commit()
        db.refresh(sample_doc)
        
        sample_chunk = TranscriptChunk(
            id="test-chunk-1",
            document_id=sample_doc.id,
            chunk_index=0,
            speaker="Elena Verna",
            timestamp="00:05:30",
            content="B2B product-led growth requires removing friction at sign-up and aligning monetization triggers."
        )
        db.add(sample_chunk)
        db.commit()
    finally:
        db.close()
        
    yield
    # Cleanup after test module
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

def test_postgres_table_creation_and_indexes():
    """Verify that PostgreSQL creates all 6 tables and handles schema properly."""
    from sqlalchemy import inspect
    inspector = inspect(test_engine)
    tables = inspector.get_table_names()
    for required in ["users", "sessions", "messages", "artifacts", "transcript_documents", "transcript_chunks"]:
        assert required in tables

def test_postgres_end_to_end_auth_and_isolation():
    """Test registration, login, session creation, and cross-user isolation on real PostgreSQL."""
    client = TestClient(app)
    uid = str(uuid.uuid4())[:8]

    # 1. Register User A on PostgreSQL
    email_a = f"pg_user_a_{uid}@example.com"
    reg_a = client.post("/api/auth/register", json={"email": email_a, "password": "SecurePasswordA123!"})
    assert reg_a.status_code == 201
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Login User A
    login_a = client.post("/api/auth/login", json={"email": email_a, "password": "SecurePasswordA123!"})
    assert login_a.status_code == 200

    # 3. Check /auth/me
    me_a = client.get("/api/auth/me", headers=headers_a)
    assert me_a.status_code == 200
    assert me_a.json()["email"] == email_a

    # 4. Register User B on PostgreSQL
    email_b = f"pg_user_b_{uid}@example.com"
    reg_b = client.post("/api/auth/register", json={"email": email_b, "password": "SecurePasswordB123!"})
    assert reg_b.status_code == 201
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 5. User A creates session and artifact in PostgreSQL
    sess_a = client.post("/api/sessions", json={"title": "PG Private Session A"}, headers=headers_a).json()
    sess_a_id = sess_a["id"]

    art_a = client.post("/api/artifacts/generate", json={
        "content": "PostgreSQL Strategy Spec",
        "format_type": "markdown",
        "title": "PG Artifact A",
        "session_id": sess_a_id
    }, headers=headers_a).json()
    art_a_id = art_a["id"]

    # 6. Verify User B CANNOT see User A's session or artifact in PostgreSQL listings
    b_sessions = client.get("/api/sessions", headers=headers_b).json()
    assert not any(s["id"] == sess_a_id for s in b_sessions)

    b_artifacts = client.get("/api/artifacts", headers=headers_b).json()
    assert not any(a["id"] == art_a_id for a in b_artifacts)

    # 7. Verify User B gets 403 Forbidden attempting direct access by ID on PostgreSQL
    assert client.get(f"/api/sessions/{sess_a_id}/messages", headers=headers_b).status_code == 403
    assert client.get(f"/api/artifacts/{art_a_id}", headers=headers_b).status_code == 403
    assert client.put(f"/api/artifacts/{art_a_id}", json={"title": "Hacked"}, headers=headers_b).status_code == 403
    assert client.delete(f"/api/artifacts/{art_a_id}", headers=headers_b).status_code == 403
    assert client.delete(f"/api/sessions/{sess_a_id}", headers=headers_b).status_code == 403

    # 8. Verify User A can update and delete their own artifact on PostgreSQL
    up_res = client.put(f"/api/artifacts/{art_a_id}", json={"title": "PG Artifact Updated A"}, headers=headers_a)
    assert up_res.status_code == 200
    assert up_res.json()["title"] == "PG Artifact Updated A"

    del_res = client.delete(f"/api/artifacts/{art_a_id}", headers=headers_a)
    assert del_res.status_code == 200

def test_postgres_knowledge_retrieval():
    """Verify BM25 knowledge search directly querying PostgreSQL tables."""
    client = TestClient(app)
    search_res = client.get("/api/knowledge/search?q=product-led+growth&top_k=2")
    assert search_res.status_code == 200
    results = search_res.json()["results"]
    assert len(results) > 0
    assert "Elena Verna" in results[0]["speaker"]
