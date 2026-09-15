from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.services.final_ai_seller_os import action_intent, final_overview

router = APIRouter(prefix="/seller-os", tags=["seller-os"])


@router.get("/overview")
def overview(seller_account_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return final_overview(db, seller_account_id)


@router.post("/action-intent")
def intent(risk: str, confidence: float, requires_approval: bool = False, current_user=Depends(get_current_user)):
    return action_intent(risk=risk, confidence=confidence, requires_approval=requires_approval)
