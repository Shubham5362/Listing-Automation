from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app


def _seller(client: TestClient, email: str) -> tuple[dict[str, str], int]:
    response = client.post("/api/v1/auth/register", json={"email": f"{email}@example.com", "password": "StrongPassword123!", "full_name": "Test Seller"})
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Seller"})
    return headers, seller.json()["id"]


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
