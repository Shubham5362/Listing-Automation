from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.core import SellerAccount, User
from sqlalchemy import select
from app.services.learning_engine import LearningEngine

router = APIRouter(prefix="/learning", tags=["self-learning"])

def seller_id(db: Session, user: User) -> int:
    seller = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return int(seller)

class FeedbackIn(BaseModel):
    source: str = Field(min_length=1, max_length=80)
    entity_type: str = Field(min_length=1, max_length=80)
    entity_id: str | None = None
    action: str = Field(min_length=1, max_length=80)
    feedback: str = Field(min_length=1, max_length=40)
    confidence: float = Field(default=.5, ge=0, le=1)
    correction: dict | None = None
    metadata: dict | None = None

class OutcomeIn(BaseModel):
    event_id: int
    outcome: str = Field(min_length=1, max_length=80)
    success: bool

def pref_json(p):
    return {"id":p.id,"key":p.key,"value":p.value,"scope":p.scope,"confidence":p.confidence,"evidence_count":p.evidence_count,"status":p.status,"enabled":p.enabled,"updated_at":p.updated_at.isoformat() if p.updated_at else None}

@router.get("/overview")
def overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return LearningEngine(db, seller_id(db, user)).overview()

@router.get("/preferences")
def preferences(status: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [pref_json(p) for p in LearningEngine(db, seller_id(db, user)).list_preferences(status)]

@router.post("/feedback")
def feedback(payload: FeedbackIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = LearningEngine(db, seller_id(db, user)).record_feedback(**payload.model_dump())
    db.commit(); return {"id": event.id, "status": "recorded"}

@router.post("/outcomes")
def outcome(payload: OutcomeIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = LearningEngine(db, seller_id(db, user)).record_outcome(**payload.model_dump())
    if not row: raise HTTPException(status_code=404, detail="learning event not found")
    db.commit(); return {"id": row.id, "status": "recorded"}

@router.get("/confidence")
def confidence(source: str, action: str, raw: float = 0.5, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"raw": raw, "calibrated": LearningEngine(db, seller_id(db, user)).calibrated_confidence(source, action, raw)}

@router.post("/preferences/{preference_id}/status")
def preference_status(preference_id: int, status: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if status not in {"candidate", "confirmed", "rejected", "disabled"}: raise HTTPException(status_code=400, detail="invalid status")
    pref = LearningEngine(db, seller_id(db, user)).set_preference_status(preference_id, status)
    if not pref: raise HTTPException(status_code=404, detail="preference not found")
    return {"id": pref.id, "status": pref.status, "enabled": pref.enabled}
