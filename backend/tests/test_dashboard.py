from datetime import datetime
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
    account = client.post("/api/v1/accounts/marketplaces", headers=headers, json={"seller_account_id": seller["id"], "marketplace": "amazon", "display_name": "Amazon"}).json()
    return headers, account["id"]


def test_dashboard_command_center_kpis_and_trend() -> None:
    with TestClient(app) as client:
        headers, account_id = _account(client, "dashboard")
        occurred = datetime(2026, 2, 10, 10, 0).isoformat()
        for entry_type, amount in [("sale", 1500), ("marketplace_fee", 150), ("shipping", 50), ("product_cost", 500)]:
            response = client.post("/api/v1/finance/entries", headers=headers, json={"marketplace_account_id": account_id, "entry_type": entry_type, "amount": amount, "occurred_at": occurred})
            assert response.status_code == 201
        response = client.get("/api/v1/dashboard", headers=headers, params={"start": "2026-02-01T00:00:00", "end": "2026-02-28T23:59:59"})
        assert response.status_code == 200
        body = response.json()
        assert body["kpis"]["revenue"] == 1500
        assert body["kpis"]["expenses"] == 700
        assert body["kpis"]["net_profit"] == 800
        assert body["kpis"]["active_listings"] == 0
        assert body["trends"][0]["revenue"] == 1500
        assert body["marketplaces"][0]["marketplace"] == "amazon"


def test_dashboard_rejects_invalid_period_and_isolates_sellers() -> None:
    with TestClient(app) as client:
        owner_a, account_a = _account(client, "dashboard-a")
        owner_b, _ = _account(client, "dashboard-b")
        assert client.post("/api/v1/finance/entries", headers=owner_a, json={"marketplace_account_id": account_a, "entry_type": "sale", "amount": 900}).status_code == 201
        invalid = client.get("/api/v1/dashboard", headers=owner_a, params={"start": "2026-03-02T00:00:00", "end": "2026-03-01T00:00:00"})
        assert invalid.status_code == 400
        isolated = client.get("/api/v1/dashboard", headers=owner_b)
        assert isolated.status_code == 200
        assert isolated.json()["kpis"]["revenue"] == 0
        assert isolated.json()["kpis"]["orders"] == 0
