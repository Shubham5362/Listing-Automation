from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.services.seller_os_v2 import action_proposal, seller_os_overview

router = APIRouter(prefix="/seller-os/v2", tags=["seller-os-v2"])


class ActionProposalRequest(BaseModel):
    risk: str = Field(default="medium")
    confidence: float = Field(default=0.9, ge=0, le=1)
    financial_impact: float = Field(default=0, ge=0)
    requires_approval: bool = True


@router.get("/overview")
def overview(
    seller_account_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return seller_os_overview(db, current_user, seller_account_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/action-proposal")
def proposal(payload: ActionProposalRequest, current_user=Depends(get_current_user)):
    return action_proposal(**payload.model_dump())
