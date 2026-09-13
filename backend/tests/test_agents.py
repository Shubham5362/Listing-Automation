from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _seller(client: TestClient, prefix: str):
    password = "StrongPassword123!"
    email = f"{prefix}-{uuid4().hex}@example.com"
    assert client.post("/api/v1/auth/register", json={"email": email, "password": password}).status_code == 201
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": f"{prefix} Seller"}).json()
    return headers, seller["id"]


def test_agents_execute_rules_and_list_available() -> None:
    with TestClient(app) as client:
        headers, seller_id = _seller(client, "agent")
        agents = client.get("/api/v1/agents", headers=headers)
        assert agents.status_code == 200
        assert {"listing", "inventory", "pricing", "finance", "ads", "analytics"}.issubset(set(agents.json()["agents"]))
        response = client.post("/api/v1/agents/execute", headers=headers, params={"seller_account_id": seller_id}, json={"agent": "pricing", "task": "optimize", "input": {"price": 100, "competitor_price": 95, "min_price": 90, "max_price": 110}})
        assert response.status_code == 200
        assert response.json()["output"]["action"] == "reprice"
        assert response.json()["output"]["recommended_price"] == 94.99


def test_agents_isolate_sellers_and_reject_unknown_agent() -> None:
    with TestClient(app) as client:
        owner_a, seller_a = _seller(client, "agent-a")
        owner_b, seller_b = _seller(client, "agent-b")
        denied = client.post("/api/v1/agents/execute", headers=owner_b, params={"seller_account_id": seller_a}, json={"agent": "finance", "task": "profit", "input": {"revenue": 100, "expenses": 20}})
        assert denied.status_code == 404
        unknown = client.post("/api/v1/agents/execute", headers=owner_a, params={"seller_account_id": seller_a}, json={"agent": "missing", "task": "run", "input": {}})
        assert unknown.status_code == 404
        ok = client.post("/api/v1/agents/execute", headers=owner_b, params={"seller_account_id": seller_b}, json={"agent": "analytics", "task": "diagnose", "input": {"revenue": 100, "expenses": 95}})
        assert ok.status_code == 200
        assert "low_margin" in ok.json()["output"]["signals"]
