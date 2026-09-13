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
        created = client.post("/api/v1/automations", headers=headers, params={"seller_account_id": seller_id}, json={
            "name": "Low stock alert", "trigger_type": "event", "trigger_config": {"event_type": "inventory.low"},
            "conditions": [{"field": "available", "operator": "lte", "value": 5}],
            "actions": [{"type": "notification", "channel": "in_app", "message": "Reorder stock"}],
        })
        assert created.status_code == 201
        rule_id = created.json()["id"]
        dispatched = client.post("/api/v1/automations/events/inventory.low", headers=headers, params={"seller_account_id": seller_id}, json={"available": 3})
        assert dispatched.status_code == 200
        assert dispatched.json()[0]["status"] == "succeeded"
        assert dispatched.json()[0]["result"]["actions"][0]["type"] == "notification"
        assert dispatched.json()[0]["result"]["actions"][0]["notification_id"] > 0
        runs = client.get(f"/api/v1/automations/{rule_id}/runs", headers=headers, params={"seller_account_id": seller_id})
        assert runs.status_code == 200
        assert runs.json()[0]["status"] == "succeeded"


def test_manual_agent_automation_and_enable_disable_isolation() -> None:
    with TestClient(app) as client:
        owner_a, seller_a = _seller(client, "automation-a")
        owner_b, seller_b = _seller(client, "automation-b")
        created = client.post("/api/v1/automations", headers=owner_a, params={"seller_account_id": seller_a}, json={
            "name": "Pricing automation", "trigger_type": "manual",
            "actions": [{"type": "agent", "agent": "pricing", "task": "optimize", "input": {"price": 100, "competitor_price": 95, "min_price": 90, "max_price": 110}}],
        })
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


def test_schedule_runner_respects_interval() -> None:
    with TestClient(app) as client:
        headers, seller_id = _seller(client, "automation-schedule")
        created = client.post("/api/v1/automations", headers=headers, params={"seller_account_id": seller_id}, json={
            "name": "Scheduled notification", "trigger_type": "schedule", "trigger_config": {"interval_minutes": 60},
            "actions": [{"type": "notification", "channel": "in_app", "message": "Scheduled check"}],
        })
        assert created.status_code == 201
        first = client.post("/api/v1/automations/scheduled/due", headers=headers, params={"seller_account_id": seller_id})
        assert first.status_code == 200
        assert first.json()[0]["status"] == "queued"
        second = client.post("/api/v1/automations/scheduled/due", headers=headers, params={"seller_account_id": seller_id})
        assert second.status_code == 200
        assert second.json() == []


def test_approval_gate_and_idempotency() -> None:
    with TestClient(app) as client:
        headers, seller_id = _seller(client, "automation-approval")
        created = client.post("/api/v1/automations", headers=headers, params={"seller_account_id": seller_id}, json={
            "name": "Approved price workflow", "trigger_type": "manual",
            "actions": [{"type": "agent", "agent": "pricing", "task": "optimize", "input": {"price": 100, "competitor_price": 95, "min_price": 90, "max_price": 110}, "requires_approval": True}],
        })
        assert created.status_code == 201
        rule_id = created.json()["id"]
        payload = {"idempotency_key": "approval-key-1", "trigger_context": {"source": "command-center"}}
        pending = client.post(f"/api/v1/automations/{rule_id}/run", headers=headers, params={"seller_account_id": seller_id}, json=payload)
        assert pending.status_code == 201
        assert pending.json()["status"] == "awaiting_approval"
        run_id = pending.json()["id"]
        duplicate = client.post(f"/api/v1/automations/{rule_id}/run", headers=headers, params={"seller_account_id": seller_id}, json=payload)
        assert duplicate.status_code == 201
        assert duplicate.json()["id"] == run_id
        approved = client.post(f"/api/v1/automations/{rule_id}/approve", headers=headers, params={"seller_account_id": seller_id, "run_id": run_id})
        assert approved.status_code == 200
        assert approved.json()["status"] == "succeeded"


def test_invalid_schedule_and_action_are_rejected() -> None:
    with TestClient(app) as client:
        headers, seller_id = _seller(client, "automation-validation")
        bad_schedule = client.post("/api/v1/automations", headers=headers, params={"seller_account_id": seller_id}, json={
            "name": "Bad schedule", "trigger_type": "schedule", "trigger_config": {"interval_minutes": 0},
            "actions": [{"type": "notification", "message": "x"}],
        })
        assert bad_schedule.status_code == 422
        bad_action = client.post("/api/v1/automations", headers=headers, params={"seller_account_id": seller_id}, json={
            "name": "Bad action", "trigger_type": "manual", "actions": [{"type": "unknown"}],
        })
        assert bad_action.status_code == 422
