from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.ai_listing import ListingDraft, ListingDraftStatus
from app.models.catalog import Listing, Product
from app.models.core import Job, SellerAccount, User
from app.models.listing_update import ListingUpdate
from app.services.listing_operations import enqueue_listing_publish
from app.services.listing_updates import approve_listing_update, create_listing_update, reject_listing_update, rollback_listing_update

router = APIRouter(prefix="/listing-operations", tags=["listing-operations"])


class ListingPublishRequest(BaseModel):
    seller_account_id: int
    listing_draft_id: int
    product_type: str = Field(min_length=1, max_length=100)


class ListingUpdateRequest(BaseModel):
    seller_account_id: int
    listing_id: int
    changes: dict
    reason: str | None = Field(default=None, max_length=500)


def _owned_draft(db: Session, user: User, seller_account_id: int, draft_id: int) -> ListingDraft:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None: raise HTTPException(status_code=404, detail="Seller account not found")
    draft = db.scalar(select(ListingDraft).join(Product, Product.id == ListingDraft.product_id).where(ListingDraft.id == draft_id, Product.seller_account_id == seller_account_id))
    if draft is None: raise HTTPException(status_code=404, detail="Listing draft not found")
    return draft


def _owned_listing(db: Session, user: User, seller_account_id: int, listing_id: int) -> Listing:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None: raise HTTPException(status_code=404, detail="Seller account not found")
    listing = db.scalar(select(Listing).join(Product, Product.id == Listing.product_id).where(Listing.id == listing_id, Product.seller_account_id == seller_account_id))
    if listing is None: raise HTTPException(status_code=404, detail="Listing not found")
    return listing


def _owned_listing_update(db: Session, user: User, seller_account_id: int, update_id: int) -> ListingUpdate:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None: raise HTTPException(status_code=404, detail="Seller account not found")
    update = db.scalar(select(ListingUpdate).where(ListingUpdate.id == update_id, ListingUpdate.seller_account_id == seller_account_id))
    if update is None: raise HTTPException(status_code=404, detail="Listing update not found")
    return update


@router.post("/publish", status_code=202)
def publish_listing(payload: ListingPublishRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    draft = _owned_draft(db, user, payload.seller_account_id, payload.listing_draft_id)
    if ListingDraftStatus(draft.status) != ListingDraftStatus.APPROVED: raise HTTPException(status_code=409, detail="Only approved listing drafts can be published")
    try: job_id = enqueue_listing_publish(db, seller_account_id=payload.seller_account_id, draft_id=draft.id, product_type=payload.product_type)
    except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"job_id": job_id, "status": "queued", "listing_draft_id": draft.id}


@router.post("/update", status_code=202)
def request_listing_update(payload: ListingUpdateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_listing(db, user, payload.seller_account_id, payload.listing_id)
    try: update = create_listing_update(db, seller_account_id=payload.seller_account_id, listing_id=payload.listing_id, changes=payload.changes, reason=payload.reason)
    except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"listing_update_id": update.id, "listing_id": update.listing_id, "status": update.status, "proposed_changes": update.proposed_changes_json, "previous_state": update.previous_state_json}


@router.post("/update/{update_id}/approve", status_code=202)
def approve_update(update_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_listing_update(db, user, seller_account_id, update_id)
    try: update = approve_listing_update(db, seller_account_id=seller_account_id, update_id=update_id)
    except ValueError as exc: raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"listing_update_id": update.id, "status": update.status, "job_id": update.job_id}


@router.post("/update/{update_id}/reject")
def reject_update(update_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_listing_update(db, user, seller_account_id, update_id)
    try: update = reject_listing_update(db, seller_account_id=seller_account_id, update_id=update_id)
    except ValueError as exc: raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"listing_update_id": update.id, "status": update.status}


@router.post("/update/{update_id}/rollback", status_code=202)
def rollback_update(update_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_listing_update(db, user, seller_account_id, update_id)
    try: update = rollback_listing_update(db, seller_account_id=seller_account_id, update_id=update_id)
    except ValueError as exc: raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"listing_update_id": update.id, "status": update.status, "reason": update.reason}


@router.get("/updates")
def listing_updates(seller_account_id: int, listing_id: int | None = None, limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None: raise HTTPException(status_code=404, detail="Seller account not found")
    query = select(ListingUpdate).where(ListingUpdate.seller_account_id == seller_account_id)
    if listing_id is not None: query = query.where(ListingUpdate.listing_id == listing_id)
    rows = db.scalars(query.order_by(ListingUpdate.id.desc()).limit(max(1, min(limit, 100)))).all()
    return [{"id": row.id, "listing_id": row.listing_id, "status": row.status, "reason": row.reason, "proposed_changes": row.proposed_changes_json, "previous_state": row.previous_state_json, "resulting_state": row.resulting_state_json, "job_id": row.job_id, "created_at": row.created_at, "approved_at": row.approved_at, "completed_at": row.completed_at, "error": row.error} for row in rows]


@router.get("/jobs")
def listing_operation_jobs(seller_account_id: int, limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None: raise HTTPException(status_code=404, detail="Seller account not found")
    rows = db.scalars(select(Job).where(Job.seller_account_id == seller_account_id, Job.name.in_(["listing_publish", "listing_update"])).order_by(Job.id.desc()).limit(max(1, min(limit, 100)))).all()
    return [{"id": job.id, "name": job.name, "status": job.status, "attempts": job.attempts, "max_attempts": job.max_attempts, "payload": job.payload, "result": job.result, "error": job.error, "created_at": job.created_at, "finished_at": job.finished_at} for job in rows]
