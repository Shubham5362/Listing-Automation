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
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": prefix}).json()
    account = client.post("/api/v1/accounts/marketplaces", headers=headers, json={"seller_account_id": seller["id"], "marketplace": "amazon", "display_name": "Amazon"}).json()
    return headers, account["id"]


def test_advanced_analytics_returns_profit_ads_and_forecast() -> None:
    with TestClient(app) as client:
        headers, account_id = _account(client, "analytics")
        occurred = datetime(2026, 2, 10, 10, 0).isoformat()
        for entry_type, amount in [("sale", 2000), ("marketplace_fee", 200), ("product_cost", 600)]:
            assert client.post("/api/v1/finance/entries", headers=headers, json={"marketplace_account_id": account_id, "entry_type": entry_type, "amount": amount, "occurred_at": occurred}).status_code == 201
        response = client.get("/api/v1/analytics/advanced", headers=headers, params={"start": "2026-02-01T00:00:00", "end": "2026-02-28T23:59:59"})
        assert response.status_code == 200
        body = response.json()
        assert body["kpis"]["revenue"] == 2000
        assert body["kpis"]["net_profit"] == 1200
        assert body["kpis"]["margin_percent"] == 60
        assert body["advertising"]["spend"] == 0
        assert body["forecasts"]["next_7_day_revenue"] > 0


def test_advanced_analytics_rejects_invalid_period() -> None:
    with TestClient(app) as client:
        headers, _ = _account(client, "analytics-invalid")
        response = client.get("/api/v1/analytics/advanced", headers=headers, params={"start": "2026-03-02T00:00:00", "end": "2026-03-01T00:00:00"})
        assert response.status_code == 400
