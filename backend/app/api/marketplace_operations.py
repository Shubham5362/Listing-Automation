from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import Job, MarketplaceAccount, SellerAccount, User
from app.services.marketplace_operations import enqueue_marketplace_operation

router = APIRouter(prefix="/marketplace-operations", tags=["marketplace-operations"])


class OperationRequest(BaseModel):
    marketplace_account_id: int
    operation: str
    sku: str = Field(min_length=1, max_length=200)
    quantity: int | None = Field(default=None, ge=0)
    price: Decimal | None = Field(default=None, gt=0)


def _owned(db: Session, user: User, account_id: int) -> MarketplaceAccount:
    account = db.scalar(select(MarketplaceAccount).join(SellerAccount).where(MarketplaceAccount.id == account_id, SellerAccount.user_id == user.id))
    if account is None:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    return account


@router.post("", status_code=202)
def queue_operation(payload: OperationRequest, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    account = _owned(db, user, payload.marketplace_account_id)
    if account.seller_account_id != seller_account_id:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    if payload.operation == "inventory_push":
        if payload.quantity is None:
            raise HTTPException(status_code=422, detail="quantity is required for inventory_push")
        operation_payload = {"sku": payload.sku, "quantity": payload.quantity}
    elif payload.operation == "price_push":
        if payload.price is None:
            raise HTTPException(status_code=422, detail="price is required for price_push")
        operation_payload = {"sku": payload.sku, "price": str(payload.price)}
    else:
        raise HTTPException(status_code=422, detail="Unsupported marketplace operation")
    try:
        job_id = enqueue_marketplace_operation(db, seller_account_id=seller_account_id, marketplace_account_id=account.id, operation=payload.operation, payload=operation_payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"job_id": job_id, "status": "queued", "marketplace_account_id": account.id, "operation": payload.operation, "sku": payload.sku}


@router.get("/jobs")
def operation_jobs(seller_account_id: int, limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned_seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if _owned_seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    rows = db.scalars(select(Job).where(Job.seller_account_id == seller_account_id, Job.name == "marketplace_operation").order_by(Job.id.desc()).limit(max(1, min(limit, 100)))).all()
    return [{"id": job.id, "status": job.status, "attempts": job.attempts, "max_attempts": job.max_attempts, "payload": job.payload, "result": job.result, "error": job.error, "created_at": job.created_at, "finished_at": job.finished_at} for job in rows]
