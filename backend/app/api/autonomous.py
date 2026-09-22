from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.core import SellerAccount, User
from sqlalchemy import select
from app.services.autonomous_command_center import AutonomousCommandCenter

router = APIRouter(prefix="/autonomous", tags=["autonomous-command-center"])

def seller_id(db: Session, user: User) -> int:
    seller = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return int(seller)

class ActionIn(BaseModel):
    action: str = Field(min_length=1, max_length=120)
    confidence: float = Field(ge=0, le=1)
    risk: str = "low"
    reason: str | None = None
    incident_id: int | None = None

class IncidentIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    source: str = Field(min_length=1, max_length=80)
    severity: str = "info"
    root_cause: str | None = None
    impact: dict | None = None

@router.get("/dashboard")
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return AutonomousCommandCenter(db, seller_id(db, user)).dashboard()

@router.post("/incidents")
def incident(payload: IncidentIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id(db, user)).create_incident(**payload.model_dump()); db.commit()
    return {"id": row.id, "status": row.status}

@router.post("/actions")
def action(payload: ActionIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id(db, user)).propose(**payload.model_dump()); db.commit()
    return {"id": row.id, "status": row.status, "approval_required": row.approval_required, "risk": row.risk}

@router.post("/actions/{action_id}/approve")
def approve(action_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id(db, user)).approve(action_id)
    if not row: raise HTTPException(404, "action not found")
    db.commit(); return {"id": row.id, "status": row.status}

@router.post("/actions/{action_id}/verify")
def verify(action_id: int, success: bool = True, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id(db, user)).verify(action_id, success)
    if not row: raise HTTPException(404, "action not found")
    db.commit(); return {"id": row.id, "status": row.status, "verification_status": row.verification_status}
