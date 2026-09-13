from datetime import datetime, timedelta


def test_finance_entry_and_settlement_reconciliation(client):
    email = "finance@example.com"
    password = "StrongPassword123!"
    register = client.post("/api/v1/auth/register", json={"email": email, "password": password, "full_name": "Finance User"})
    assert register.status_code == 201
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": "Finance Seller"})
    assert seller.status_code == 201
    seller_id = seller.json()["id"]
    account = client.post("/api/v1/accounts/marketplaces", headers=headers, json={"seller_account_id": seller_id, "marketplace": "amazon", "display_name": "Amazon"})
    assert account.status_code == 201
    account_id = account.json()["id"]

    entry = client.post("/api/v1/finance/entries", headers=headers, json={"marketplace_account_id": account_id, "entry_type": "sale", "amount": 1200, "tax_amount": 216})
    assert entry.status_code == 201
    assert entry.json()["currency"] == "INR"

    start = datetime.utcnow().isoformat()
    end = (datetime.utcnow() + timedelta(days=1)).isoformat()
    settlement = client.post("/api/v1/finance/settlements", headers=headers, json={"marketplace_account_id": account_id, "external_settlement_id": "SET-1", "period_start": start, "period_end": end, "gross_amount": 1200, "fees_amount": 100, "refunds_amount": 50, "net_amount": 1050})
    assert settlement.status_code == 201
    result = client.post(f"/api/v1/finance/settlements/{settlement.json()['id']}/reconcile", headers=headers)
    assert result.status_code == 200
    assert result.json()["status"] == "reconciled"
    assert result.json()["variance"] == 0


def test_finance_isolation(client):
    def create(email, seller_name):
        password = "StrongPassword123!"
        assert client.post("/api/v1/auth/register", json={"email": email, "password": password}).status_code == 201
        token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        seller = client.post("/api/v1/accounts/sellers", headers=headers, json={"name": seller_name}).json()
        account = client.post("/api/v1/accounts/marketplaces", headers=headers, json={"seller_account_id": seller["id"], "marketplace": "flipkart", "display_name": "Flipkart"}).json()
        return headers, account["id"]

    owner_a, account_a = create("finance-a@example.com", "Seller A")
    owner_b, _ = create("finance-b@example.com", "Seller B")
    assert client.post("/api/v1/finance/entries", headers=owner_a, json={"marketplace_account_id": account_a, "entry_type": "sale", "amount": 500}).status_code == 201
    assert client.get("/api/v1/finance/entries", headers=owner_b).json() == []
    assert client.get(f"/api/v1/accounts/marketplaces/{account_a}", headers=owner_b).status_code == 404
