from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.autonomous_command_center import AutonomousCommandCenter

router = APIRouter(prefix="/autonomous", tags=["autonomous-command-center"])

def seller_id() -> int:
    return 1

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
def dashboard(db: Session = Depends(get_db)):
    return AutonomousCommandCenter(db, seller_id()).dashboard()

@router.post("/incidents")
def incident(payload: IncidentIn, db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id()).create_incident(**payload.model_dump()); db.commit()
    return {"id": row.id, "status": row.status}

@router.post("/actions")
def action(payload: ActionIn, db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id()).propose(**payload.model_dump()); db.commit()
    return {"id": row.id, "status": row.status, "approval_required": row.approval_required, "risk": row.risk}

@router.post("/actions/{action_id}/approve")
def approve(action_id: int, db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id()).approve(action_id)
    if not row: raise HTTPException(404, "action not found")
    db.commit(); return {"id": row.id, "status": row.status}

@router.post("/actions/{action_id}/verify")
def verify(action_id: int, success: bool = True, db: Session = Depends(get_db)):
    row = AutonomousCommandCenter(db, seller_id()).verify(action_id, success)
    if not row: raise HTTPException(404, "action not found")
    db.commit(); return {"id": row.id, "status": row.status, "verification_status": row.verification_status}
