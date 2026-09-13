from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decrypt_credentials
from app.integrations.base import MarketplaceAccountContext
from app.integrations.factory import build_marketplace_client
from app.models.catalog import Listing
from app.models.core import Job, Marketplace, MarketplaceAccount
from app.models.listing_update import ListingUpdate, ListingUpdateStatus
from app.services.jobs import enqueue_job

_ALLOWED_FIELDS = {"title", "description", "bullets", "images"}
_MAX_BULLETS = 10
_MAX_IMAGES = 10


def _owned_listing(db: Session, listing_id: int, seller_account_id: int) -> tuple[Listing, MarketplaceAccount]:
    row = db.execute(
        select(Listing, MarketplaceAccount)
        .join(MarketplaceAccount, MarketplaceAccount.id == Listing.marketplace_account_id)
        .where(Listing.id == listing_id, MarketplaceAccount.seller_account_id == seller_account_id)
    ).first()
    if row is None:
        raise ValueError("Listing not found for seller")
    return row


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str)


def snapshot_listing(listing: Listing) -> dict[str, Any]:
    return {
        "id": listing.id,
        "product_id": listing.product_id,
        "marketplace_account_id": listing.marketplace_account_id,
        "sku": listing.sku,
        "external_listing_id": listing.external_listing_id,
        "status": listing.status,
        "title": listing.title,
        "price": str(listing.price) if listing.price is not None else None,
        "inventory_quantity": listing.inventory_quantity,
        "attributes": json.loads(listing.attributes_json or "{}"),
        "marketplace_data": json.loads(listing.marketplace_data_json or "{}"),
        "validation_errors": json.loads(listing.validation_errors_json or "[]"),
    }


def validate_changes(changes: dict[str, Any]) -> dict[str, Any]:
    if not changes:
        raise ValueError("At least one listing field must be supplied")
    unknown = set(changes) - _ALLOWED_FIELDS - {key for key in changes if key.startswith("attribute:")}
    if unknown:
        raise ValueError(f"Unsupported listing fields: {', '.join(sorted(unknown))}")
    normalized: dict[str, Any] = {}
    for field, value in changes.items():
        if field == "title":
            if not isinstance(value, str) or not value.strip() or len(value) > 500:
                raise ValueError("title must be a non-empty string of at most 500 characters")
            normalized[field] = value.strip()
        elif field == "description":
            if not isinstance(value, str) or len(value) > 10000:
                raise ValueError("description must be a string of at most 10000 characters")
            normalized[field] = value
        elif field == "bullets":
            if not isinstance(value, list) or not value or len(value) > _MAX_BULLETS or not all(isinstance(item, str) and item.strip() for item in value):
                raise ValueError(f"bullets must contain 1-{_MAX_BULLETS} non-empty strings")
            normalized[field] = [item.strip() for item in value]
        elif field == "images":
            if not isinstance(value, list) or len(value) > _MAX_IMAGES or not all(isinstance(item, str) and item.strip() for item in value):
                raise ValueError(f"images must contain 0-{_MAX_IMAGES} non-empty URLs")
            normalized[field] = [item.strip() for item in value]
        elif field.startswith("attribute:"):
            name = field.split(":", 1)[1].strip()
            if not name or "/" in name or ".." in name:
                raise ValueError("attribute field name is invalid")
            normalized[field] = value
    return normalized


def create_listing_update(db: Session, *, seller_account_id: int, listing_id: int, changes: dict[str, Any], reason: str | None = None) -> ListingUpdate:
    listing, account = _owned_listing(db, listing_id, seller_account_id)
    normalized = validate_changes(changes)
    active = db.scalar(select(ListingUpdate).where(ListingUpdate.listing_id == listing.id, ListingUpdate.seller_account_id == seller_account_id, ListingUpdate.status.in_([ListingUpdateStatus.PENDING.value, ListingUpdateStatus.APPROVED.value, ListingUpdateStatus.QUEUED.value])))
    if active:
        raise ValueError("A listing update is already awaiting approval or execution")
    update = ListingUpdate(
        listing_id=listing.id,
        seller_account_id=seller_account_id,
        marketplace_account_id=account.id,
        status=ListingUpdateStatus.PENDING.value,
        reason=(reason or "").strip()[:500] or None,
        proposed_changes_json=_json(normalized),
        previous_state_json=_json(snapshot_listing(listing)),
    )
    db.add(update); db.commit(); db.refresh(update)
    return update


def approve_listing_update(db: Session, *, seller_account_id: int, update_id: int) -> ListingUpdate:
    update = db.scalar(select(ListingUpdate).where(ListingUpdate.id == update_id, ListingUpdate.seller_account_id == seller_account_id))
    if update is None:
        raise ValueError("Listing update not found")
    if update.status != ListingUpdateStatus.PENDING.value:
        raise ValueError("Only pending listing updates can be approved")
    _, account = _owned_listing(db, update.listing_id, seller_account_id)
    job = enqueue_job(db, "listing_update", {"listing_update_id": update.id, "listing_id": update.listing_id, "marketplace_account_id": account.id}, seller_account_id=seller_account_id)
    update.status = ListingUpdateStatus.QUEUED.value
    update.approved_at = datetime.utcnow()
    update.job_id = job.id
    db.commit(); db.refresh(update)
    return update


def reject_listing_update(db: Session, *, seller_account_id: int, update_id: int) -> ListingUpdate:
    update = db.scalar(select(ListingUpdate).where(ListingUpdate.id == update_id, ListingUpdate.seller_account_id == seller_account_id))
    if update is None: raise ValueError("Listing update not found")
    if update.status != ListingUpdateStatus.PENDING.value: raise ValueError("Only pending listing updates can be rejected")
    update.status = ListingUpdateStatus.REJECTED.value; db.commit(); db.refresh(update)
    return update


def execute_listing_update(db: Session, *, seller_account_id: int, update_id: int) -> dict[str, Any]:
    update = db.scalar(select(ListingUpdate).where(ListingUpdate.id == update_id, ListingUpdate.seller_account_id == seller_account_id))
    if update is None: raise ValueError("Listing update not found")
    if update.status not in {ListingUpdateStatus.QUEUED.value, ListingUpdateStatus.APPROVED.value}: raise ValueError("Listing update is not approved for execution")
    listing, account = _owned_listing(db, update.listing_id, seller_account_id)
    changes = validate_changes(json.loads(update.proposed_changes_json))
    credentials = decrypt_credentials(account.credentials_ref) if account.credentials_ref else None
    client = build_marketplace_client(Marketplace(account.marketplace), credentials=credentials)
    result = client.update_listing(MarketplaceAccountContext(account_id=account.id, marketplace=Marketplace(account.marketplace), external_account_id=account.external_account_id), sku=listing.sku, changes=changes)

    attrs = json.loads(listing.attributes_json or "{}")
    attrs.update(changes)
    if "title" in changes: listing.title = changes["title"]
    listing.attributes_json = _json(attrs)
    listing.marketplace_data_json = _json(result)
    listing.validation_errors_json = "[]"
    update.resulting_state_json = _json(snapshot_listing(listing))
    update.status = ListingUpdateStatus.COMPLETED.value
    update.completed_at = datetime.utcnow()
    update.error = None
    db.commit()
    return {"listing_update_id": update.id, "listing_id": listing.id, "sku": listing.sku, "marketplace": account.marketplace, "status": "completed", "changes": changes, "result": result}
