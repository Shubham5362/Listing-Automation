from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _setup(client: TestClient) -> tuple[dict[str, str], int, int]:
    email = f"inventory-{uuid4().hex}@example.com"
    auth = client.post("/api/v1/auth/register", json={"email": email, "password": "strong-pass-123"})
    assert auth.status_code == 201
    headers = {"Authorization": f"Bearer {auth.json()['token']}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Inventory Seller"})
    assert seller.status_code == 201
    seller_id = seller.json()["id"]
    product = client.post("/api/v1/catalog/products", headers=headers, json={
        "seller_account_id": seller_id, "sku": f"INV-{uuid4().hex[:8]}", "title": "Inventory Product"
    })
    assert product.status_code == 201
    return headers, seller_id, product.json()["id"]


def test_inventory_upsert_adjustment_and_movements() -> None:
    with TestClient(app) as client:
        headers, seller_id, product_id = _setup(client)
        created = client.post("/api/v1/inventory", headers=headers, json={
            "seller_account_id": seller_id, "product_id": product_id, "quantity": 20,
            "reserved_quantity": 3, "reorder_level": 5,
        })
        assert created.status_code == 201
        item = created.json()
        assert item["available_quantity"] == 17
        assert item["low_stock"] is False

        adjusted = client.post(f"/api/v1/inventory/{item['id']}/adjust", headers=headers, json={
            "quantity_delta": -14, "reason": "Damaged stock"
        })
        assert adjusted.status_code == 200
        assert adjusted.json()["quantity"] == 6
        assert adjusted.json()["available_quantity"] == 3
        assert adjusted.json()["low_stock"] is True

        movements = client.get(f"/api/v1/inventory/{item['id']}/movements", headers=headers)
        assert movements.status_code == 200
        assert len(movements.json()) == 2
        assert movements.json()[0]["quantity_delta"] == -14


def test_inventory_rejects_invalid_reserved_and_unauthorized_access() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/inventory").status_code == 401
        headers, seller_id, product_id = _setup(client)
        invalid = client.post("/api/v1/inventory", headers=headers, json={
            "seller_account_id": seller_id, "product_id": product_id, "quantity": 2, "reserved_quantity": 3,
        })
        assert invalid.status_code == 400


def test_inventory_filters_low_stock() -> None:
    with TestClient(app) as client:
        headers, seller_id, product_id = _setup(client)
        created = client.post("/api/v1/inventory", headers=headers, json={
            "seller_account_id": seller_id, "product_id": product_id, "quantity": 4, "reorder_level": 5,
        })
        assert created.status_code == 201
        low = client.get("/api/v1/inventory", headers=headers, params={"low_stock": "true"})
        assert low.status_code == 200
        assert any(row["product_id"] == product_id for row in low.json())


def test_inventory_patch_matches_workspace_mutation() -> None:
    with TestClient(app) as client:
        headers, seller_id, product_id = _setup(client)
        created = client.post("/api/v1/inventory", headers=headers, json={"seller_account_id": seller_id, "product_id": product_id, "quantity": 20, "reorder_level": 5}).json()
        updated = client.patch(f"/api/v1/inventory/{created['id']}", headers=headers, json={"quantity": 7, "reorder_level": 8})
        assert updated.status_code == 200
        assert updated.json()["quantity"] == 7
        assert updated.json()["reorder_level"] == 8
