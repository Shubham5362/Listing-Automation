import json

import pytest

from app.models.ai_listing import ListingDraft, ListingDraftStatus
from app.models.catalog import Listing, ListingStatus, Product
from app.models.core import Job, MarketplaceAccount, SellerAccount
from app.services.listing_operations import enqueue_listing_publish, execute_listing_publish
from app.worker import BackgroundWorker


class FakeListingClient:
    def __init__(self):
        self.calls = []

    def publish_listing(self, account, *, sku, product_type, attributes):
        self.calls.append((account.account_id, sku, product_type, attributes))
        return {"status": "ACCEPTED", "sku": sku}


def _fixture(db_session, status=ListingDraftStatus.APPROVED):
    seller = SellerAccount(name="Seller")
    other = SellerAccount(name="Other")
    db_session.add_all([seller, other])
    db_session.flush()
    product = Product(seller_account_id=seller.id, sku="SKU-1", title="Test Product")
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon", external_account_id="SELLER")
    other_product = Product(seller_account_id=other.id, sku="OTHER-1", title="Other Product")
    db_session.add_all([product, account, other_product])
    db_session.flush()
    draft = ListingDraft(product_id=product.id, marketplace_account_id=account.id, version=1, title="Generated title", bullets_json=json.dumps(["One"]), description="Description", keywords_json=json.dumps(["keyword"]), attributes_json=json.dumps({"brand": "Demo"}), quality_score=90, validation_errors_json="[]", status=status.value)
    db_session.add(draft)
    db_session.commit()
    return seller, other, product, account, draft


def test_publish_requires_approval(db_session):
    seller, _, _, _, draft = _fixture(db_session, ListingDraftStatus.REVIEW)
    with pytest.raises(ValueError, match="Only approved"):
        enqueue_listing_publish(db_session, seller_account_id=seller.id, draft_id=draft.id, product_type="PRODUCT")


def test_publish_executes_and_creates_listing(db_session, monkeypatch):
    seller, _, product, account, draft = _fixture(db_session)
    fake = FakeListingClient()
    monkeypatch.setattr("app.services.listing_operations._client", lambda _: fake)
    result = execute_listing_publish(db_session, seller_account_id=seller.id, draft_id=draft.id, product_type="PRODUCT")
    assert result["status"] == "published"
    assert fake.calls[0][0:3] == (account.id, product.sku, "PRODUCT")
    saved = db_session.query(Listing).filter_by(marketplace_account_id=account.id, sku=product.sku).one()
    assert saved.status == ListingStatus.ACTIVE.value
    assert db_session.get(ListingDraft, draft.id).status == ListingDraftStatus.PUBLISHED.value


def test_worker_listing_publish_is_seller_scoped(db_session, monkeypatch):
    seller, other, _, account, draft = _fixture(db_session)
    fake = FakeListingClient()
    monkeypatch.setattr("app.services.listing_operations._client", lambda _: fake)
    job = Job(name="listing_publish", seller_account_id=other.id, status="running", payload=json.dumps({"listing_draft_id": draft.id, "marketplace_account_id": account.id, "product_type": "PRODUCT"}), attempts=1, max_attempts=3)
    db_session.add(job)
    db_session.commit()
    with pytest.raises(ValueError, match="not found for seller"):
        BackgroundWorker(worker_id="test-worker").execute_job(db_session, job)
    assert fake.calls == []
