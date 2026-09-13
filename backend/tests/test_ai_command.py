from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _account(client: TestClient, prefix: str) -> tuple[dict[str, str], int]:
    password = "StrongPassword123!"
    email = f"{prefix}-{uuid4().hex}@example.com"
    assert client.post("/api/v1/auth/register", json={"email": email, "password": password}).status_code == 201
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": f"{prefix} Seller"}).json()
    return headers, seller["id"]


def test_ai_command_analyzes_and_keeps_actions_explainable() -> None:
    with TestClient(app) as client:
        headers, seller_id = _account(client, "command")
        response = client.post("/api/v1/ai/commands", headers=headers, params={"seller_account_id": seller_id}, json={"query": "Why did my sales go down?"})
        assert response.status_code == 200
        body = response.json()
        assert body["intent"] == "sales_decline"
        assert body["answer"]
        assert len(body["evidence"]) == 3
        assert body["actions"][0]["agent"] == "analytics"
        assert body["actions"][1]["requires_approval"] is True
        assert body["status"] == "completed"


def test_ai_command_requires_approval_and_preserves_seller_isolation() -> None:
    with TestClient(app) as client:
        owner, seller_id = _account(client, "command-owner")
        other, other_seller_id = _account(client, "command-other")
        pending = client.post("/api/v1/ai/commands", headers=owner, params={"seller_account_id": seller_id}, json={"query": "review my pricing", "execute_actions": True})
        assert pending.status_code == 200
        assert pending.json()["status"] == "needs_approval"
        assert all(action["status"] == "proposed" for action in pending.json()["actions"])
        forbidden = client.get("/api/v1/ai/commands/history", headers=other, params={"seller_account_id": seller_id})
        assert forbidden.status_code == 404
        own = client.get("/api/v1/ai/commands/history", headers=other, params={"seller_account_id": other_seller_id})
        assert own.status_code == 200
        assert own.json()["commands"] == []


def test_ai_command_approved_execution_routes_to_agent() -> None:
    with TestClient(app) as client:
        headers, seller_id = _account(client, "command-execute")
        response = client.post("/api/v1/ai/commands", headers=headers, params={"seller_account_id": seller_id}, json={"query": "check inventory", "approved": True, "execute_actions": True})
        assert response.status_code == 200
        body = response.json()
        assert body["intent"] == "inventory"
        assert body["status"] == "completed"
        assert body["actions"][0]["status"] == "completed"
        assert body["actions"][0]["output"]["action"] == "reorder"
