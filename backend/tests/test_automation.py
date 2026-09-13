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


def test_event_automation_conditions_actions_and_history() -> None:
    with TestClient(app) as client:
        headers, seller_id = _seller(client, "automation")
        created = client.post(
            "/api/v1/automations",
            headers=headers,
            params={"seller_account_id": seller_id},
            json={
                "name": "Low stock alert",
                "trigger_type": "event",
                "trigger_config": {"event_type": "inventory.low"},
                "conditions": [{"field": "available", "operator": "lte", "value": 5}],
                "actions": [{"type": "notification", "channel": "in_app", "message": "Reorder stock"}],
            },
        )
        assert created.status_code == 201
        rule_id = created.json()["id"]

        dispatched = client.post(
            "/api/v1/automations/events/inventory.low",
            headers=headers,
            params={"seller_account_id": seller_id},
            json={"available": 3},
        )
        assert dispatched.status_code == 200
        assert dispatched.json()[0]["status"] == "succeeded"
        assert dispatched.json()[0]["result"]["actions"][0]["channel"] == "in_app"

        runs = client.get(f"/api/v1/automations/{rule_id}/runs", headers=headers, params={"seller_account_id": seller_id})
        assert runs.status_code == 200
        assert runs.json()[0]["status"] == "succeeded"


def test_manual_agent_automation_and_enable_disable_isolation() -> None:
    with TestClient(app) as client:
        owner_a, seller_a = _seller(client, "automation-a")
        owner_b, seller_b = _seller(client, "automation-b")
        created = client.post(
            "/api/v1/automations",
            headers=owner_a,
            params={"seller_account_id": seller_a},
            json={
                "name": "Pricing automation",
                "trigger_type": "manual",
                "actions": [{"type": "agent", "agent": "pricing", "task": "optimize", "input": {"price": 100, "competitor_price": 95, "min_price": 90, "max_price": 110}}],
            },
        )
        assert created.status_code == 201
        rule_id = created.json()["id"]

        denied = client.post(f"/api/v1/automations/{rule_id}/run", headers=owner_b, params={"seller_account_id": seller_a}, json={})
        assert denied.status_code == 404

        run = client.post(f"/api/v1/automations/{rule_id}/run", headers=owner_a, params={"seller_account_id": seller_a}, json={})
        assert run.status_code == 201
        assert run.json()["status"] == "succeeded"
        assert run.json()["result"]["actions"][0]["output"]["action"] == "reprice"

        paused = client.patch(f"/api/v1/automations/{rule_id}/enabled", headers=owner_a, params={"seller_account_id": seller_a, "enabled": False})
        assert paused.status_code == 200
        skipped = client.post(f"/api/v1/automations/{rule_id}/run", headers=owner_a, params={"seller_account_id": seller_a}, json={})
        assert skipped.status_code == 201
        assert skipped.json()["status"] == "skipped"

        other = client.get("/api/v1/automations", headers=owner_b, params={"seller_account_id": seller_b})
        assert other.status_code == 200
        assert other.json() == []
