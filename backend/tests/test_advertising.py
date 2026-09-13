from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _auth(client: TestClient, prefix: str) -> dict[str, str]:
    email = f"{prefix}-{uuid4().hex}@example.com"
    password = "StrongPassword123!"
    assert client.post("/api/v1/auth/register", json={"email": email, "password": password}).status_code == 201
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_advertising_metrics_analysis_and_optimization() -> None:
    with TestClient(app) as client:
        headers = _auth(client, "ads")
        seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Ads Seller"})
        assert seller.status_code == 201
        account = client.post("/api/v1/accounts/marketplaces", headers=headers, json={"seller_account_id": seller.json()["id"], "marketplace": "amazon", "display_name": "Amazon"})
        assert account.status_code == 201
        campaign = client.post("/api/v1/advertising/campaigns", headers=headers, json={"marketplace_account_id": account.json()["id"], "external_campaign_id": "camp-1", "name": "Core", "daily_budget": 100})
        assert campaign.status_code == 201
        campaign_id = campaign.json()["id"]
        perf = client.post(f"/api/v1/advertising/campaigns/{campaign_id}/performance", headers=headers, json={"report_date": datetime.utcnow().isoformat(), "impressions": 10000, "clicks": 100, "spend": 200, "sales": 1000, "conversions": 10, "orders": 10})
        assert perf.status_code == 201
        metrics = client.get(f"/api/v1/advertising/campaigns/{campaign_id}/metrics", headers=headers)
        assert metrics.status_code == 200
        assert metrics.json()["ctr"] == 1.0
        assert metrics.json()["acos"] == 20.0
        assert metrics.json()["roas"] == 5.0
        assert client.post(f"/api/v1/advertising/campaigns/{campaign_id}/analyze", headers=headers).status_code == 201
        optimization = client.get(f"/api/v1/advertising/campaigns/{campaign_id}/optimization", headers=headers)
        assert optimization.status_code == 200
        assert optimization.json()["action"] == "increase_budget"


def test_advertising_seller_isolation() -> None:
    with TestClient(app) as client:
        owner_a = _auth(client, "ads-a")
        owner_b = _auth(client, "ads-b")
        seller = client.post("/api/v1/accounts/sellers", headers=owner_a, json={"name": "A"}).json()
        account = client.post("/api/v1/accounts/marketplaces", headers=owner_a, json={"seller_account_id": seller["id"], "marketplace": "flipkart", "display_name": "Flipkart"}).json()
        campaign = client.post("/api/v1/advertising/campaigns", headers=owner_a, json={"marketplace_account_id": account["id"], "external_campaign_id": "isolated", "name": "Private"}).json()
        assert client.get("/api/v1/advertising/campaigns", headers=owner_b).json() == []
        assert client.get(f"/api/v1/advertising/campaigns/{campaign['id']}/metrics", headers=owner_b).status_code == 404
