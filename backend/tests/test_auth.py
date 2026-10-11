import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_auth_registration_and_login():
    unique_suffix = str(uuid.uuid4())[:8]
    email = f"testuser_{unique_suffix}@example.com"
    password = "SecurePassword123!"

    # 1. Register new user
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "display_name": "Product Lead"
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email.lower()
    user_token = reg_data["access_token"]

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/auth/register", json={
        "email": email,
        "password": password
    })
    assert dup_res.status_code == 400

    # 3. Login with wrong password should fail
    bad_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401

    # 4. Login with correct password
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 5. Access /auth/me with bearer token
    headers = {"Authorization": f"Bearer {user_token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email.lower()

def test_user_session_and_artifact_isolation():
    u_id = str(uuid.uuid4())[:8]
    user_a_email = f"user_a_{u_id}@example.com"
    reg_a = client.post("/api/auth/register", json={"email": user_a_email, "password": "PasswordA123!"})
    assert reg_a.status_code == 201
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    user_b_email = f"user_b_{u_id}@example.com"
    reg_b = client.post("/api/auth/register", json={"email": user_b_email, "password": "PasswordB123!"})
    assert reg_b.status_code == 201
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a session
    sess_a_res = client.post("/api/sessions", json={"title": "Private Strategy A"}, headers=headers_a)
    assert sess_a_res.status_code == 200
    sess_a_id = sess_a_res.json()["id"]

    # User B should NOT be able to view messages of Session A
    b_access = client.get(f"/api/sessions/{sess_a_id}/messages", headers=headers_b)
    assert b_access.status_code == 403

    # User B should NOT be able to delete Session A
    b_delete = client.delete(f"/api/sessions/{sess_a_id}", headers=headers_b)
    assert b_delete.status_code == 403

    # User A creates an artifact
    art_a_res = client.post("/api/artifacts/generate", json={
        "content": "Secret Growth Loop",
        "format_type": "markdown",
        "title": "Private Artifact A",
        "session_id": sess_a_id
    }, headers=headers_a)
    assert art_a_res.status_code == 200
    art_a_id = art_a_res.json()["id"]

    # User B should NOT be able to view Artifact A
    b_art_view = client.get(f"/api/artifacts/{art_a_id}", headers=headers_b)
    assert b_art_view.status_code == 403

    # User B should NOT be able to update or delete Artifact A
    b_art_update = client.put(f"/api/artifacts/{art_a_id}", json={"title": "Hacked Title"}, headers=headers_b)
    assert b_art_update.status_code == 403

    b_art_delete = client.delete(f"/api/artifacts/{art_a_id}", headers=headers_b)
    assert b_art_delete.status_code == 403

    # User A can successfully update and delete Artifact A
    a_art_update = client.put(f"/api/artifacts/{art_a_id}", json={"title": "Updated Title A"}, headers=headers_a)
    assert a_art_update.status_code == 200
    assert a_art_update.json()["title"] == "Updated Title A"

    a_art_del = client.delete(f"/api/artifacts/{art_a_id}", headers=headers_a)
    assert a_art_del.status_code == 200

    # User A can delete Session A
    client.delete(f"/api/sessions/{sess_a_id}", headers=headers_a)
