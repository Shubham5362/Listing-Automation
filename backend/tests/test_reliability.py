from types import SimpleNamespace
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core import middleware as security_middleware
from app.main import app


def test_protected_api_rejects_missing_and_invalid_credentials() -> None:
    with TestClient(app) as client:
        missing = client.get("/api/v1/accounts/sellers")
        invalid = client.get(
            "/api/v1/accounts/sellers",
            headers={"Authorization": "Bearer definitely-invalid-token"},
        )

    assert missing.status_code == 401
    assert invalid.status_code == 401


def test_auth_validation_rejects_malformed_registration_payload() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "not-an-email", "password": "short"},
        )

    assert response.status_code == 422
    assert response.json()["detail"]


def test_security_middleware_enforces_bounded_rate_limit(monkeypatch) -> None:
    isolated_app = FastAPI()
    isolated_app.add_middleware(security_middleware.SecurityMiddleware)

    @isolated_app.get("/probe")
    def probe() -> dict[str, str]:
        return {"status": "ok"}

    settings = SimpleNamespace(rate_limit_per_minute=2)
    monkeypatch.setattr(security_middleware, "get_settings", lambda: settings)

    with TestClient(isolated_app) as client:
        first = client.get("/probe")
        second = client.get("/probe")
        limited = client.get("/probe")

    assert first.status_code == 200
    assert second.status_code == 200
    assert limited.status_code == 429
    retry_after = int(limited.headers["Retry-After"])
    assert 1 <= retry_after <= 60
    payload = limited.json()
    assert payload["detail"] == "Rate limit exceeded"
    assert payload["request_id"] == limited.headers["X-Request-ID"]


def test_auth_login_rejects_wrong_password() -> None:
    email = f"reliability-{uuid4().hex}@example.com"
    with TestClient(app) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "strong-pass-123"},
        )
        login = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrong-password"},
        )

    assert registered.status_code == 201
    assert login.status_code == 401


def test_unknown_agent_is_reported_as_a_client_error() -> None:
    email = f"agent-{uuid4().hex}@example.com"
    with TestClient(app) as client:
        registered = client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "strong-pass-123"},
        )
        headers = {"Authorization": f"Bearer {registered.json()['token']}"}
        seller = client.post(
            "/api/v1/accounts/sellers",
            headers=headers,
            json={"name": "Reliability Seller"},
        )
        response = client.post(
            "/api/v1/agents/execute",
            params={"seller_account_id": seller.json()["id"]},
            headers=headers,
            json={
                "agent": "does-not-exist",
                "task": "run",
                "input": {},
                "requires_approval": False,
            },
        )

    assert registered.status_code == 201
    assert seller.status_code == 201
    assert response.status_code == 404


def test_health_contract_remains_stable_under_security_stack() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
