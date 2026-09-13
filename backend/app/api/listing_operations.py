from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.ai_listing import ListingDraft, ListingDraftStatus
from app.models.catalog import Product
from app.models.core import Job, SellerAccount, User
from app.services.listing_operations import enqueue_listing_publish

router = APIRouter(prefix="/listing-operations", tags=["listing-operations"])


class ListingPublishRequest(BaseModel):
    seller_account_id: int
    listing_draft_id: int
    product_type: str = Field(min_length=1, max_length=100)


def _owned_draft(db: Session, user: User, seller_account_id: int, draft_id: int) -> ListingDraft:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    draft = db.scalar(select(ListingDraft).join(Product, Product.id == ListingDraft.product_id).where(ListingDraft.id == draft_id, Product.seller_account_id == seller_account_id))
    if draft is None:
        raise HTTPException(status_code=404, detail="Listing draft not found")
    return draft


@router.post("/publish", status_code=202)
def publish_listing(payload: ListingPublishRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    draft = _owned_draft(db, user, payload.seller_account_id, payload.listing_draft_id)
    if ListingDraftStatus(draft.status) != ListingDraftStatus.APPROVED:
        raise HTTPException(status_code=409, detail="Only approved listing drafts can be published")
    try:
        job_id = enqueue_listing_publish(db, seller_account_id=payload.seller_account_id, draft_id=draft.id, product_type=payload.product_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"job_id": job_id, "status": "queued", "listing_draft_id": draft.id}


@router.get("/jobs")
def listing_operation_jobs(seller_account_id: int, limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    rows = db.scalars(select(Job).where(Job.seller_account_id == seller_account_id, Job.name == "listing_publish").order_by(Job.id.desc()).limit(max(1, min(limit, 100)))).all()
    return [{"id": job.id, "status": job.status, "attempts": job.attempts, "max_attempts": job.max_attempts, "payload": job.payload, "result": job.result, "error": job.error, "created_at": job.created_at, "finished_at": job.finished_at} for job in rows]
