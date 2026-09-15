from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.autonomous_execution import BusinessOpportunity
from app.services.autonomous_execution import AutonomousExecutionService

router = APIRouter(prefix="/autonomous-execution", tags=["autonomous-execution"])

class PlanItem(BaseModel):
    sku: str = Field(min_length=1, max_length=200)
    operation: str
    marketplace_account_id: int | None = None
    payload: dict = Field(default_factory=dict)

class PlanIn(BaseModel):
    seller_account_id: int
    intent: str = Field(min_length=1, max_length=120)
    items: list[PlanItem] = Field(min_length=1, max_length=100)
    confidence: float = Field(default=0.8, ge=0, le=1)
    risk: str = "medium"

def _seller(db: Session, user: User, seller_account_id: int):
    row = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if row is None:
        raise HTTPException(404, "Seller account not found")
    return row

@router.get("/dashboard")
def dashboard(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    return AutonomousExecutionService(db, seller_account_id).dashboard()

@router.post("/plans")
def create_plan(payload: PlanIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, payload.seller_account_id)
    try:
        plan = AutonomousExecutionService(db, payload.seller_account_id).create_plan(payload.intent, [i.model_dump() for i in payload.items], payload.confidence, payload.risk)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    db.commit()
    return {"id": plan.id, "status": plan.status, "approval_required": plan.approval_required, "risk": plan.risk, "confidence": plan.confidence}

@router.post("/plans/{plan_id}/approve")
def approve_plan(plan_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    try:
        plan = AutonomousExecutionService(db, seller_account_id).approve_and_queue(plan_id)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    if plan is None:
        raise HTTPException(404, "plan not found or not awaiting approval")
    db.commit()
    return {"id": plan.id, "status": plan.status}

@router.post("/opportunities/generate")
def generate_opportunities(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    rows = AutonomousExecutionService(db, seller_account_id).generate_opportunities(user)
    db.commit()
    return [{"id": row.id, "area": row.area, "title": row.title, "priority": row.priority, "score": row.score, "reason": row.reason} for row in rows]

@router.get("/opportunities")
def opportunities(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    rows = db.scalars(select(BusinessOpportunity).where(BusinessOpportunity.seller_account_id == seller_account_id).order_by(BusinessOpportunity.score.desc(), BusinessOpportunity.id.desc()).limit(100)).all()
    return [{"id": r.id, "area": r.area, "title": r.title, "priority": r.priority, "score": r.score, "reason": r.reason, "status": r.status} for r in rows]
