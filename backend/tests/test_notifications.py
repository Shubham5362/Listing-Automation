from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def _seller(client: TestClient, prefix: str):
    password = "StrongPassword123!"
    email = f"{prefix}-{uuid4().hex}@example.com"
    assert client.post("/api/v1/auth/register", json={"email": email, "password": password}).status_code == 201
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": f"{prefix} Seller"}).json()
    return headers, seller["id"]


def test_notification_lifecycle_preferences_and_delivery() -> None:
    with TestClient(app) as client:
        headers, seller_id = _seller(client, "notification")
        created = client.post("/api/v1/notifications", headers=headers, params={"seller_account_id": seller_id}, json={
            "category": "inventory", "severity": "warning", "title": "Low stock", "message": "SKU ABC is low", "channels": ["in_app", "email"],
        })
        assert created.status_code == 201
        notification_id = created.json()["id"]
        listed = client.get("/api/v1/notifications", headers=headers, params={"seller_account_id": seller_id, "unread_only": True})
        assert listed.status_code == 200
        assert listed.json()[0]["id"] == notification_id
        deliveries = client.get(f"/api/v1/notifications/{notification_id}/deliveries", headers=headers, params={"seller_account_id": seller_id})
        assert deliveries.status_code == 200
        assert {item["channel"] for item in deliveries.json()} == {"in_app", "email"}
        assert next(item for item in deliveries.json() if item["channel"] == "in_app")["status"] == "sent"
        assert next(item for item in deliveries.json() if item["channel"] == "email")["status"] == "skipped"
        preference = client.put("/api/v1/notifications/preferences", headers=headers, params={"seller_account_id": seller_id}, json={
            "category": "inventory", "in_app_enabled": True, "email_enabled": True, "whatsapp_enabled": False,
        })
        assert preference.status_code == 200
        assert preference.json()["email_enabled"] is True
        marked = client.patch(f"/api/v1/notifications/{notification_id}/read", headers=headers, params={"seller_account_id": seller_id})
        assert marked.status_code == 200
        assert marked.json()["read_at"] is not None
        unread = client.get("/api/v1/notifications", headers=headers, params={"seller_account_id": seller_id, "unread_only": True})
        assert unread.status_code == 200
        assert unread.json() == []


def test_notification_seller_isolation_and_provider_failure_are_recorded() -> None:
    with TestClient(app) as client:
        owner_a, seller_a = _seller(client, "notification-a")
        owner_b, seller_b = _seller(client, "notification-b")
        created = client.post("/api/v1/notifications", headers=owner_a, params={"seller_account_id": seller_a}, json={
            "category": "critical", "title": "Critical", "message": "Action required", "channels": ["in_app"],
        })
        assert created.status_code == 201
        notification_id = created.json()["id"]
        denied = client.get(f"/api/v1/notifications/{notification_id}/deliveries", headers=owner_b, params={"seller_account_id": seller_b})
        assert denied.status_code == 404
        pref = client.put("/api/v1/notifications/preferences", headers=owner_a, params={"seller_account_id": seller_a}, json={
            "category": "critical", "in_app_enabled": False, "email_enabled": False, "whatsapp_enabled": True,
        })
        assert pref.status_code == 200
        failed = client.post("/api/v1/notifications", headers=owner_a, params={"seller_account_id": seller_a}, json={
            "category": "critical", "title": "WhatsApp", "message": "Provider unavailable", "channels": ["whatsapp"],
        })
        assert failed.status_code == 201
        deliveries = client.get(f"/api/v1/notifications/{failed.json()['id']}/deliveries", headers=owner_a, params={"seller_account_id": seller_a})
        assert deliveries.json()[0]["status"] == "failed"
