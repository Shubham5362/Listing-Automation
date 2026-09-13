from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import Job, SellerAccount, User
from app.services.jobs import enqueue_job, list_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    payload: dict = Field(default_factory=dict)
    seller_account_id: int | None = None
    max_attempts: int | None = Field(default=None, ge=1, le=10)


def _seller_for_user(db: Session, user_id: int, seller_account_id: int | None) -> SellerAccount:
    query = select(SellerAccount).where(SellerAccount.user_id == user_id, SellerAccount.is_active.is_(True))
    if seller_account_id is not None:
        query = query.where(SellerAccount.id == seller_account_id)
    sellers = db.scalars(query).all()
    if not sellers:
        raise HTTPException(status_code=404, detail="Seller account not found")
    if seller_account_id is None and len(sellers) > 1:
        raise HTTPException(status_code=422, detail="seller_account_id is required when multiple seller accounts exist")
    return sellers[0]


@router.post("", status_code=202)
def create_job(payload: JobCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    seller = _seller_for_user(db, current_user.id, payload.seller_account_id)
    job = enqueue_job(db, payload.name.strip(), payload.payload, seller_account_id=seller.id, max_attempts=payload.max_attempts)
    return {"id": job.id, "name": job.name, "status": job.status, "seller_account_id": job.seller_account_id}


@router.get("")
def get_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict[str, object]]:
    seller_ids = select(SellerAccount.id).where(SellerAccount.user_id == current_user.id)
    jobs = db.scalars(select(Job).where(Job.seller_account_id.in_(seller_ids)).order_by(Job.created_at.desc()).limit(100)).all()
    return [
        {
            "id": j.id,
            "name": j.name,
            "status": j.status,
            "seller_account_id": j.seller_account_id,
            "attempts": j.attempts,
            "max_attempts": j.max_attempts,
            "run_after": j.run_after,
            "error": j.error,
            "result": j.result,
            "created_at": j.created_at.isoformat(),
            "started_at": j.started_at,
            "finished_at": j.finished_at,
        }
        for j in jobs
    ]
