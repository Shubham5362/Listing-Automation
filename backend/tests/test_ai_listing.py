from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/register", json={"email": f"ai-{uuid4().hex}@example.com", "password": "strong-pass-123"})
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.json()['token']}"}


def _setup(client: TestClient) -> tuple[dict[str, str], int, int]:
    headers = _auth_headers(client)
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "AI Seller"})
    assert seller.status_code == 201
    seller_id = seller.json()["id"]
    product = client.post("/api/v1/catalog/products", headers=headers, json={
        "seller_account_id": seller_id,
        "sku": f"SKU-AI-{uuid4().hex[:8]}",
        "title": "Premium Cotton T Shirt",
        "brand": "Acme",
        "category": "T-Shirts",
        "description": "Soft cotton shirt for everyday wear.",
        "attributes": {"color": "Blue", "size": "L"},
    })
    assert product.status_code == 201
    marketplace = client.post("/api/v1/accounts/marketplaces", headers=headers, json={
        "seller_account_id": seller_id, "marketplace": "amazon", "display_name": "Amazon IN",
    })
    assert marketplace.status_code == 201
    return headers, product.json()["id"], marketplace.json()["id"]


def test_generation_and_status_workflow() -> None:
    with TestClient(app) as client:
        headers, product_id, marketplace_id = _setup(client)
        response = client.post("/api/v1/ai/listings/generate", headers=headers, json={"product_id": product_id, "marketplace_account_id": marketplace_id, "language": "en"})
        assert response.status_code == 201
        body = response.json()
        assert body["version"] == 1
        assert body["status"] == "draft"
        assert body["quality_score"] > 0
        draft_id = body["id"]
        for status in ("review", "approved"):
            response = client.patch(f"/api/v1/ai/listings/{draft_id}/status", headers=headers, json={"status": status})
            assert response.status_code == 200
            assert response.json()["status"] == status
        response = client.patch(f"/api/v1/ai/listings/{draft_id}/status", headers=headers, json={"status": "published"})
        assert response.status_code == 409


def test_invalid_status_transition_and_authentication() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/ai/listings").status_code == 401
        headers, product_id, marketplace_id = _setup(client)
        response = client.post("/api/v1/ai/listings/generate", headers=headers, json={"product_id": product_id, "marketplace_account_id": marketplace_id, "language": "en"})
        draft_id = response.json()["id"]
        invalid = client.patch(f"/api/v1/ai/listings/{draft_id}/status", headers=headers, json={"status": "published"})
        assert invalid.status_code == 409
