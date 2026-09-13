from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _account(client: TestClient, prefix: str, marketplace: str = "amazon") -> tuple[dict[str, str], int]:
    password = "StrongPassword123!"
    email = f"{prefix}-{uuid4().hex}@example.com"
    assert client.post("/api/v1/auth/register", json={"email": email, "password": password}).status_code == 201
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": f"{prefix} Seller"}).json()
    account = client.post("/api/v1/accounts/marketplaces", headers=headers, json={"seller_account_id": seller["id"], "marketplace": marketplace, "display_name": marketplace.title()}).json()
    return headers, account["id"]


def test_finance_reporting_summary_and_periods() -> None:
    with TestClient(app) as client:
        headers, account_id = _account(client, "report")
        occurred = datetime(2026, 1, 15, 10, 0).isoformat()
        for entry_type, amount in [("sale", 1000), ("marketplace_fee", 100), ("shipping", 50), ("product_cost", 300), ("gst", 50), ("refund", 25), ("advertising", 75)]:
            response = client.post("/api/v1/finance/entries", headers=headers, json={"marketplace_account_id": account_id, "entry_type": entry_type, "amount": amount, "occurred_at": occurred})
            assert response.status_code == 201
        summary = client.get("/api/v1/finance/reports/summary", headers=headers, params={"start": "2026-01-01T00:00:00", "end": "2026-01-31T23:59:59"})
        assert summary.status_code == 200
        body = summary.json()
        assert body["sales"] == 1000
        assert body["total_expenses"] == 600
        assert body["net_profit"] == 400
        assert body["entry_count"] == 7
        assert len(client.get("/api/v1/finance/reports/daily", headers=headers).json()) == 1
        assert len(client.get("/api/v1/finance/reports/weekly", headers=headers).json()) == 1
        assert len(client.get("/api/v1/finance/reports/monthly", headers=headers).json()) == 1


def test_finance_reporting_invalid_period_and_isolation() -> None:
    with TestClient(app) as client:
        owner_a, account_a = _account(client, "finance-a")
        owner_b, _ = _account(client, "finance-b", "flipkart")
        assert client.post("/api/v1/finance/entries", headers=owner_a, json={"marketplace_account_id": account_a, "entry_type": "sale", "amount": 500}).status_code == 201
        invalid = client.get("/api/v1/finance/reports/summary", headers=owner_a, params={"start": "2026-02-02T00:00:00", "end": "2026-02-01T00:00:00"})
        assert invalid.status_code == 400
        assert client.get("/api/v1/finance/reports/summary", headers=owner_b).json()["entry_count"] == 0
