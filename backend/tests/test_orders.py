from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _setup(client: TestClient) -> tuple[dict[str, str], int, int]:
    email = f"orders-{uuid4().hex}@example.com"
    auth = client.post("/api/v1/auth/register", json={"email": email, "password": "strong-pass-123"})
    assert auth.status_code == 201
    headers = {"Authorization": f"Bearer {auth.json()['token']}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Orders Seller"})
    assert seller.status_code == 201
    seller_id = seller.json()["id"]
    marketplace = client.post("/api/v1/accounts/marketplaces", headers=headers, json={
        "seller_account_id": seller_id, "marketplace": "amazon", "display_name": "Amazon Store"
    })
    assert marketplace.status_code == 201
    return headers, seller_id, marketplace.json()["id"]


def _order_payload(seller_id: int, marketplace_id: int) -> dict:
    return {
        "seller_account_id": seller_id,
        "marketplace_account_id": marketplace_id,
        "external_order_id": f"ORDER-{uuid4().hex[:10]}",
        "customer_name": "Test Customer",
        "subtotal": 500,
        "shipping_fee": 40,
        "tax_amount": 90,
        "total_amount": 630,
        "items": [{"sku": "SKU-1", "title": "Product", "quantity": 2, "unit_price": 250, "tax_amount": 90}],
    }


def test_order_create_list_and_status_lifecycle() -> None:
    with TestClient(app) as client:
        headers, seller_id, marketplace_id = _setup(client)
        created = client.post("/api/v1/orders", headers=headers, json=_order_payload(seller_id, marketplace_id))
        assert created.status_code == 201
        order = created.json()
        assert order["status"] == "pending"
        assert order["items"][0]["total_amount"] == 590

        confirmed = client.patch(f"/api/v1/orders/{order['id']}/status", headers=headers, json={"status": "confirmed"})
        assert confirmed.status_code == 200
        packed = client.patch(f"/api/v1/orders/{order['id']}/status", headers=headers, json={"status": "packed"})
        assert packed.status_code == 200
        shipped = client.patch(f"/api/v1/orders/{order['id']}/status", headers=headers, json={"status": "shipped"})
        assert shipped.status_code == 200
        assert shipped.json()["shipped_at"] is not None
        delivered = client.patch(f"/api/v1/orders/{order['id']}/status", headers=headers, json={"status": "delivered"})
        assert delivered.status_code == 200
        assert delivered.json()["delivered_at"] is not None

        listed = client.get("/api/v1/orders", headers=headers, params={"status": "delivered", "q": order["external_order_id"]})
        assert listed.status_code == 200
        assert len(listed.json()) == 1


def test_order_rejects_invalid_transition_duplicate_and_unauthorized_access() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/orders").status_code == 401
        headers, seller_id, marketplace_id = _setup(client)
        payload = _order_payload(seller_id, marketplace_id)
        created = client.post("/api/v1/orders", headers=headers, json=payload)
        assert created.status_code == 201
        assert client.post("/api/v1/orders", headers=headers, json=payload).status_code == 409
        invalid = client.patch(f"/api/v1/orders/{created.json()['id']}/status", headers=headers, json={"status": "delivered"})
        assert invalid.status_code == 409


def test_orders_are_isolated_between_users() -> None:
    with TestClient(app) as client:
        owner_headers, seller_id, marketplace_id = _setup(client)
        created = client.post("/api/v1/orders", headers=owner_headers, json=_order_payload(seller_id, marketplace_id))
        assert created.status_code == 201
        order_id = created.json()["id"]

        other_auth = client.post("/api/v1/auth/register", json={"email": f"other-{uuid4().hex}@example.com", "password": "strong-pass-123"})
        other_headers = {"Authorization": f"Bearer {other_auth.json()['token']}"}
        assert client.get(f"/api/v1/orders/{order_id}", headers=other_headers).status_code == 404
        assert client.get("/api/v1/orders", headers=other_headers).json() == []
