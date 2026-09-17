from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.services.action_executor import ActionExecutor

router = APIRouter(prefix="/actions", tags=["actions"])


class ActionRequest(BaseModel):
    action: str = Field(min_length=1, max_length=80)
    seller_account_id: int | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


@router.post("/queue", status_code=202)
def queue_action(
    request: ActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    query = select(SellerAccount).where(
        SellerAccount.user_id == current_user.id,
        SellerAccount.is_active.is_(True),
    )
    if request.seller_account_id is not None:
        query = query.where(SellerAccount.id == request.seller_account_id)
    sellers = db.scalars(query).all()
    if not sellers:
        raise HTTPException(status_code=404, detail="Seller account not found")
    if request.seller_account_id is None and len(sellers) > 1:
        raise HTTPException(status_code=422, detail="seller_account_id is required when multiple seller accounts exist")

    try:
        result = ActionExecutor(db).enqueue(
            seller_account_id=sellers[0].id,
            action=request.action,
            payload=request.payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "action": result.action,
        "status": result.status,
        "job_id": result.job_id,
        "seller_account_id": sellers[0].id,
        "message": result.message,
    }
