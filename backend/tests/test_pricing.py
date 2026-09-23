from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _setup(client: TestClient) -> tuple[dict[str, str], int]:
    auth = client.post("/api/v1/auth/register", json={"email": f"pricing-{uuid4().hex}@example.com", "password": "strong-pass-123"})
    assert auth.status_code == 201, auth.text
    headers = {"Authorization": f"Bearer {auth.json()['token']}"}

    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Pricing Seller"})
    assert seller.status_code == 201, seller.text

    marketplace = client.post("/api/v1/accounts/marketplaces", headers=headers, json={
        "seller_account_id": seller.json()["id"],
        "marketplace": "amazon",
        "display_name": "Amazon Store",
    })
    assert marketplace.status_code == 201, marketplace.text

    product = client.post("/api/v1/catalog/products", headers=headers, json={
        "seller_account_id": seller.json()["id"],
        "sku": f"SKU-{uuid4().hex[:8]}",
        "title": "Pricing Product",
        "cost_price": 300,
        "mrp": 700,
    })
    assert product.status_code == 201, product.text

    listing = client.post("/api/v1/catalog/listings", headers=headers, json={
        "product_id": product.json()["id"],
        "marketplace_account_id": marketplace.json()["id"],
        "sku": product.json()["sku"],
        "price": 599,
    })
    assert listing.status_code == 201, listing.text
    return headers, listing.json()["id"]


def test_price_history_rules_competitor_buybox_and_recommendation() -> None:
    with TestClient(app) as client:
        headers, listing_id = _setup(client)
        updated = client.post("/api/v1/pricing/price", headers=headers, json={"listing_id": listing_id, "price": 579, "reason": "manual test"})
        assert updated.status_code == 201
        assert updated.json()["old_price"] == 599

        rule = client.post("/api/v1/pricing/rules", headers=headers, json={"listing_id": listing_id, "min_price": 500, "max_price": 650})
        assert rule.status_code == 201
        assert client.post("/api/v1/pricing/price", headers=headers, json={"listing_id": listing_id, "price": 450}).status_code == 409

        competitor = client.post("/api/v1/pricing/competitors", headers=headers, json={"listing_id": listing_id, "competitor_name": "Competitor A", "price": 550})
        assert competitor.status_code == 201
        recommendation = client.get(f"/api/v1/pricing/recommendation/{listing_id}", headers=headers)
        assert recommendation.status_code == 200
        assert recommendation.json()["competitor_price"] == 550

        buy_box = client.post("/api/v1/pricing/buy-box", headers=headers, json={"listing_id": listing_id, "won": False, "seller_name": "Competitor A", "winning_price": 550})
        assert buy_box.status_code == 201
        assert client.get(f"/api/v1/pricing/buy-box/{listing_id}", headers=headers).json()[0]["won"] is False
        assert len(client.get(f"/api/v1/pricing/history/{listing_id}", headers=headers).json()) == 1


def test_pricing_isolation_and_rule_validation() -> None:
    with TestClient(app) as client:
        owner_headers, listing_id = _setup(client)
        other = client.post("/api/v1/auth/register", json={"email": f"other-{uuid4().hex}@example.com", "password": "strong-pass-123"})
        assert other.status_code == 201, other.text
        other_headers = {"Authorization": f"Bearer {other.json()['token']}"}
        assert client.get(f"/api/v1/pricing/history/{listing_id}", headers=other_headers).status_code == 404
        assert client.post("/api/v1/pricing/rules", headers=owner_headers, json={"listing_id": listing_id, "min_price": 700, "max_price": 600}).status_code == 422


def test_pricing_workspace_list_and_patch() -> None:
    with TestClient(app) as client:
        headers, listing_id = _setup(client)
        rows = client.get("/api/v1/pricing", headers=headers)
        assert rows.status_code == 200
        assert any(row["id"] == listing_id for row in rows.json())
        updated = client.patch(f"/api/v1/pricing/{listing_id}", headers=headers, json={"price": 610})
        assert updated.status_code == 200
        assert updated.json()["currentPrice"] == 610
