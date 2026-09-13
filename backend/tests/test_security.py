from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import decrypt_credentials, encrypt_credentials
from app.main import app


def test_security_headers_are_present() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"


def test_session_can_be_revoked() -> None:
    with TestClient(app) as client:
        email = "security-revoke@example.com"
        client.post("/api/v1/auth/register", json={"email": email, "password": "strong-pass-123"})
        login = client.post("/api/v1/auth/login", json={"email": email, "password": "strong-pass-123"})
        token = login.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        assert client.get("/api/v1/auth/me", headers=headers).status_code == 200
        assert client.post("/api/v1/auth/logout", headers=headers).status_code == 200
        assert client.get("/api/v1/auth/me", headers=headers).status_code == 401


def test_credentials_are_encrypted_and_round_trip(monkeypatch) -> None:
    key = Fernet.generate_key().decode("utf-8")
    monkeypatch.setenv("CREDENTIALS_ENCRYPTION_KEY", key)
    get_settings.cache_clear()
    encrypted = encrypt_credentials({"client_secret": "do-not-store-plain", "account_id": 123})
    assert "do-not-store-plain" not in encrypted
    assert decrypt_credentials(encrypted) == {"client_secret": "do-not-store-plain", "account_id": 123}
    get_settings.cache_clear()
