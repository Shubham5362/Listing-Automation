import json

from fastapi.testclient import TestClient

from app.main import app
from app.models.ai_listing import ListingDraft
from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount


def test_generation_and_status_workflow(authenticated_client: TestClient, db_session) -> None:
    seller = SellerAccount(name="Seller")
    db_session.add(seller)
    db_session.commit()
    db_session.refresh(seller)
    product = Product(seller_account_id=seller.id, sku="SKU-AI-1", title="Premium Cotton T Shirt", brand="Acme", category="T-Shirts", description="Soft cotton shirt for everyday wear.", attributes_json=json.dumps({"color": "Blue", "size": "L"}))
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon India")
    db_session.add_all([product, account])
    db_session.commit()
    db_session.refresh(product)
    db_session.refresh(account)

    response = authenticated_client.post("/api/v1/ai/listings/generate", json={"product_id": product.id, "marketplace_account_id": account.id, "language": "en"})
    assert response.status_code == 201
    body = response.json()
    assert body["version"] == 1
    assert body["status"] == "draft"
    assert body["quality_score"] > 0
    assert len(body["bullets"]) >= 1
    draft_id = body["id"]

    assert authenticated_client.patch(f"/api/v1/ai/listings/{draft_id}/status", json={"status": "review"}).status_code == 200
    assert authenticated_client.patch(f"/api/v1/ai/listings/{draft_id}/status", json={"status": "approved"}).status_code == 200
    assert authenticated_client.patch(f"/api/v1/ai/listings/{draft_id}/status", json={"status": "published"}).status_code == 200


def test_invalid_status_transition_is_rejected(authenticated_client: TestClient, db_session) -> None:
    draft = ListingDraft(
        product_id=1,
        marketplace_account_id=1,
        version=1,
        title="Title",
        bullets_json="[]",
        description="Description",
        keywords_json="[]",
        attributes_json="{}",
        quality_score=50,
        validation_errors_json="[]",
        status="draft",
    )
    db_session.add(draft)
    db_session.commit()
    db_session.refresh(draft)
    response = authenticated_client.patch(f"/api/v1/ai/listings/{draft.id}/status", json={"status": "published"})
    assert response.status_code == 409
