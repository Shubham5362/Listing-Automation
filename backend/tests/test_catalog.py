from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _auth_headers(client: TestClient) -> tuple[dict[str, str], int]:
    email = f"catalog-{uuid4().hex}@example.com"
    response = client.post("/api/v1/auth/register", json={"email": email, "password": "strong-pass-123"})
    assert response.status_code == 201
    data = response.json()
    return {"Authorization": f"Bearer {data['token']}"}, data["user_id"]


def test_product_and_listing_crud() -> None:
    with TestClient(app) as client:
        headers, _ = _auth_headers(client)
        seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Catalog Seller"})
        assert seller.status_code == 201
        seller_id = seller.json()["id"]

        product = client.post("/api/v1/catalog/products", headers=headers, json={
            "seller_account_id": seller_id, "sku": "SKU-001", "title": "Test Product",
            "brand": "Brand", "mrp": "999", "cost_price": "400", "attributes": {"color": "Black"},
        })
        assert product.status_code == 201
        product_id = product.json()["id"]
        assert product.json()["attributes"] == {"color": "Black"}

        marketplace = client.post("/api/v1/accounts/marketplaces", headers=headers, json={
            "seller_account_id": seller_id, "marketplace": "amazon", "display_name": "Amazon IN",
        })
        assert marketplace.status_code == 201
        marketplace_id = marketplace.json()["id"]

        listing = client.post("/api/v1/catalog/listings", headers=headers, json={
            "product_id": product_id, "marketplace_account_id": marketplace_id, "sku": "SKU-001",
            "title": "Marketplace Title", "price": "749", "inventory_quantity": 10,
        })
        assert listing.status_code == 201
        listing_id = listing.json()["id"]

        updated = client.patch(f"/api/v1/catalog/listings/{listing_id}", headers=headers, json={
            "price": "699", "inventory_quantity": 15, "status": "active",
        })
        assert updated.status_code == 200
        assert updated.json()["price"] == "699.00"
        assert updated.json()["inventory_quantity"] == 15
        assert updated.json()["status"] == "active"

        products = client.get("/api/v1/catalog/products", headers=headers, params={"sku": "SKU-001"})
        listings = client.get("/api/v1/catalog/listings", headers=headers, params={"sku": "SKU-001"})
        assert products.status_code == 200 and len(products.json()) == 1
        assert listings.status_code == 200 and len(listings.json()) == 1


def test_catalog_requires_authentication_and_rejects_duplicate_sku() -> None:
    with TestClient(app) as client:
        unauthenticated = client.get("/api/v1/catalog/products")
        assert unauthenticated.status_code == 401

        headers, _ = _auth_headers(client)
        seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Duplicate Seller"})
        seller_id = seller.json()["id"]
        body = {"seller_account_id": seller_id, "sku": "DUP-001", "title": "Duplicate Test"}
        assert client.post("/api/v1/catalog/products", headers=headers, json=body).status_code == 201
        assert client.post("/api/v1/catalog/products", headers=headers, json=body).status_code == 409
