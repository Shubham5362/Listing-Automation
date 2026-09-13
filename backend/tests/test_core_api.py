from fastapi.testclient import TestClient

from app.main import app


def test_protected_core_apis() -> None:
    with TestClient(app) as client:
        register = client.post("/api/v1/auth/register", json={"email": "core@example.com", "password": "strong-pass-123"})
        assert register.status_code == 201
        token = register.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        seller = client.post("/api/v1/accounts/sellers", json={"name": "My Seller Account"}, headers=headers)
        assert seller.status_code == 201
        seller_id = seller.json()["id"]

        marketplace = client.post(
            "/api/v1/accounts/marketplaces",
            json={"seller_account_id": seller_id, "marketplace": "amazon", "display_name": "Amazon India"},
            headers=headers,
        )
        assert marketplace.status_code == 201
        assert marketplace.json()["marketplace"] == "amazon"

        job = client.post("/api/v1/jobs", json={"name": "sync_orders", "payload": {"marketplace": "amazon"}}, headers=headers)
        assert job.status_code == 202
        assert job.json()["status"] == "queued"

        jobs = client.get("/api/v1/jobs", headers=headers)
        assert jobs.status_code == 200
        assert jobs.json()[0]["name"] == "sync_orders"


def test_protected_endpoint_requires_auth() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/accounts/sellers")
        assert response.status_code == 401
