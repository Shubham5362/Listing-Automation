from __future__ import annotations

import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decrypt_credentials
from app.integrations.base import MarketplaceAccountContext
from app.integrations.factory import build_marketplace_client
from app.models.ai_listing import ListingDraft, ListingDraftStatus
from app.models.catalog import Listing, ListingStatus, Product
from app.models.core import Job, Marketplace, MarketplaceAccount
from app.services.jobs import enqueue_job


def _draft(db: Session, draft_id: int, seller_account_id: int) -> tuple[ListingDraft, Product, MarketplaceAccount]:
    row = db.execute(
        select(ListingDraft, Product, MarketplaceAccount)
        .join(Product, Product.id == ListingDraft.product_id)
        .join(MarketplaceAccount, MarketplaceAccount.id == ListingDraft.marketplace_account_id)
        .where(ListingDraft.id == draft_id, Product.seller_account_id == seller_account_id, MarketplaceAccount.seller_account_id == seller_account_id)
    ).first()
    if row is None:
        raise ValueError("Listing draft not found for seller")
    return row


def _client(account: MarketplaceAccount):
    credentials = decrypt_credentials(account.credentials_ref) if account.credentials_ref else None
    return build_marketplace_client(Marketplace(account.marketplace), credentials=credentials)


def enqueue_listing_publish(db: Session, *, seller_account_id: int, draft_id: int, product_type: str) -> int:
    draft, product, account = _draft(db, draft_id, seller_account_id)
    if ListingDraftStatus(draft.status) != ListingDraftStatus.APPROVED:
        raise ValueError("Only approved listing drafts can be published")
    if not product.sku:
        raise ValueError("Product SKU is required")
    if not product_type.strip():
        raise ValueError("product_type is required")

    duplicate = db.scalar(
        select(Job).where(
            Job.seller_account_id == seller_account_id,
            Job.name == "listing_publish",
            Job.status.in_(["queued", "running"]),
            Job.payload.like(f'%"listing_draft_id":{draft_id}%'),
        )
    )
    if duplicate:
        return duplicate.id
    job = enqueue_job(db, "listing_publish", {"listing_draft_id": draft.id, "marketplace_account_id": account.id, "product_type": product_type}, seller_account_id=seller_account_id)
    return job.id


def execute_listing_publish(db: Session, *, seller_account_id: int, draft_id: int, product_type: str) -> dict[str, Any]:
    draft, product, account = _draft(db, draft_id, seller_account_id)
    if ListingDraftStatus(draft.status) != ListingDraftStatus.APPROVED:
        raise ValueError("Only approved listing drafts can be published")

    attributes = json.loads(draft.attributes_json or "{}")
    if not isinstance(attributes, dict):
        raise ValueError("Listing attributes must be an object")
    attributes = dict(attributes)
    attributes.setdefault("title", draft.title)
    attributes.setdefault("description", draft.description)
    attributes.setdefault("bullets", json.loads(draft.bullets_json or "[]"))
    attributes.setdefault("keywords", json.loads(draft.keywords_json or "[]"))

    result = _client(account).publish_listing(
        MarketplaceAccountContext(account_id=account.id, marketplace=Marketplace(account.marketplace), external_account_id=account.external_account_id),
        sku=product.sku,
        product_type=product_type,
        attributes=attributes,
    )

    listing = db.scalar(select(Listing).where(Listing.marketplace_account_id == account.id, Listing.sku == product.sku))
    if listing is None:
        listing = Listing(product_id=product.id, marketplace_account_id=account.id, sku=product.sku)
        db.add(listing)
    listing.title = draft.title
    listing.status = ListingStatus.ACTIVE.value
    listing.attributes_json = json.dumps(attributes, ensure_ascii=False)
    listing.marketplace_data_json = json.dumps(result, ensure_ascii=False, default=str)
    listing.validation_errors_json = "[]"
    draft.status = ListingDraftStatus.PUBLISHED.value
    db.commit()
    return {"listing_draft_id": draft.id, "marketplace_account_id": account.id, "sku": product.sku, "status": "published", "marketplace": account.marketplace, "result": result}
