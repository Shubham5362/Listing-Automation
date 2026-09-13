from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _setup(client: TestClient) -> tuple[dict[str, str], int, int, int]:
    auth = client.post("/api/v1/auth/register", json={"email": f"returns-{uuid4().hex}@example.com", "password": "strong-pass-123"})
    assert auth.status_code == 201
    headers = {"Authorization": f"Bearer {auth.json()['token']}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Returns Seller"})
    assert seller.status_code == 201
    seller_id = seller.json()["id"]
    account = client.post("/api/v1/accounts/marketplaces", headers=headers, json={"seller_account_id": seller_id, "marketplace": "amazon", "display_name": "Amazon"})
    assert account.status_code == 201
    order = client.post("/api/v1/orders", headers=headers, json={"seller_account_id": seller_id, "marketplace_account_id": account.json()["id"], "external_order_id": f"R-{uuid4().hex[:10]}", "customer_name": "Buyer", "subtotal": 500, "total_amount": 500, "items": [{"sku": "SKU-R", "title": "Item", "quantity": 1, "unit_price": 500}]})
    assert order.status_code == 201
    return headers, seller_id, account.json()["id"], order.json()["id"]


def test_return_lifecycle_and_customer_issue() -> None:
    with TestClient(app) as client:
        headers, _, account_id, order_id = _setup(client)
        created = client.post("/api/v1/returns", headers=headers, json={"order_id": order_id, "reason": "damaged", "resolution": "refund", "refund_amount": 500})
        assert created.status_code == 201
        return_id = created.json()["id"]
        for status in ("approved", "pickup_scheduled", "received", "refunded"):
            response = client.patch(f"/api/v1/returns/{return_id}/status", headers=headers, json={"status": status})
            assert response.status_code == 200
        assert client.get("/api/v1/returns", headers=headers, params={"status": "refunded"}).status_code == 200

        issue = client.post("/api/v1/returns/customer-issues", headers=headers, json={"order_id": order_id, "marketplace_account_id": account_id, "customer_name": "Buyer", "subject": "Refund help", "message": "Please help with my refund", "priority": "high"})
        assert issue.status_code == 201
        issue_id = issue.json()["id"]
        reply = client.post(f"/api/v1/returns/customer-issues/{issue_id}/ai-reply", headers=headers, json={"tone": "friendly"})
        assert reply.status_code == 200
        assert reply.json()["ai_reply_suggestion"]
        updated = client.patch(f"/api/v1/returns/customer-issues/{issue_id}", headers=headers, json={"status": "escalated"})
        assert updated.status_code == 200
        assert updated.json()["status"] == "escalated"


def test_return_and_customer_access_is_seller_scoped() -> None:
    with TestClient(app) as client:
        owner_headers, _, _, order_id = _setup(client)
        created = client.post("/api/v1/returns", headers=owner_headers, json={"order_id": order_id, "reason": "wrong item"})
        assert created.status_code == 201
        other = client.post("/api/v1/auth/register", json={"email": f"other-{uuid4().hex}@example.com", "password": "strong-pass-123"})
        other_headers = {"Authorization": f"Bearer {other.json()['token']}"}
        assert client.get("/api/v1/returns", headers=other_headers).json() == []
        assert client.patch(f"/api/v1/returns/{created.json()['id']}/status", headers=other_headers, json={"status": "approved"}).status_code == 404
