from uuid import uuid4
from fastapi.testclient import TestClient

from app.main import app


def test_register_login_and_me() -> None:
    with TestClient(app) as client:
        email = f"phase1-{uuid4().hex[:8]}@example.com"
        register = client.post("/api/v1/auth/register", json={"email": email, "password": "strong-pass-123", "full_name": "Seller"})
        assert register.status_code == 201
        assert register.json()["user_id"] > 0

        duplicate = client.post("/api/v1/auth/register", json={"email": email, "password": "strong-pass-123"})
        assert duplicate.status_code == 409

        login = client.post("/api/v1/auth/login", json={"email": email, "password": "strong-pass-123"})
        assert login.status_code == 200
        token = login.json()["token"]

        me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == email


def test_auth_rejects_invalid_credentials() -> None:
    with TestClient(app) as client:
        response = client.post("/api/v1/auth/login", json={"email": "missing@example.com", "password": "wrong-pass"})
        assert response.status_code == 401
