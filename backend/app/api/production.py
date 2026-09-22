from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.core import SellerAccount, User
from app.models.reliability import AutonomousKillSwitch
from app.services.production_autonomy import health, policy_for, should_auto_execute, start_workflow, complete_workflow

router = APIRouter(prefix="/production", tags=["production"])

def seller_id(db: Session, user: User) -> int:
    seller = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if seller is None:
        raise HTTPException(404, "Seller account not found")
    return int(seller)

class PolicyIn(BaseModel):
    mode: str = Field(default="approval")
    max_financial_impact: float = Field(default=5000, ge=0)
    max_auto_actions_per_day: int = Field(default=50, ge=0)
    enabled: bool = True

class DecisionIn(BaseModel):
    risk: str = "low"
    confidence: float = Field(ge=0, le=1)
    financial_impact: float = Field(default=0, ge=0)
    daily_actions: int = Field(default=0, ge=0)

class WorkflowIn(BaseModel):
    workflow_key: str
    idempotency_key: str

class CompleteIn(BaseModel):
    success: bool
    error: str | None = None

@router.get("/health")
def get_health(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return health(db, seller_id(db, user))

@router.get("/policy")
def get_policy(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = policy_for(db, seller_id(db, user))
    return {"mode": p.mode, "max_financial_impact": p.max_financial_impact, "max_auto_actions_per_day": p.max_auto_actions_per_day, "enabled": p.enabled}

@router.post("/policy")
def set_policy(payload: PolicyIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.mode not in {"observe", "recommend", "approval", "auto", "strict"}:
        raise HTTPException(400, "invalid autopilot mode")
    p = policy_for(db, seller_id(db, user))
    p.mode, p.max_financial_impact, p.max_auto_actions_per_day, p.enabled = payload.mode, payload.max_financial_impact, payload.max_auto_actions_per_day, payload.enabled
    db.commit()
    return {"status": "updated", "mode": p.mode}

@router.post("/decision")
def decision(payload: DecisionIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = policy_for(db, seller_id())
    switch = db.scalar(select(AutonomousKillSwitch).where(AutonomousKillSwitch.seller_account_id == seller_id(db, user)))
    paused = bool(switch and switch.enabled)
    allowed = should_auto_execute(mode=p.mode, risk=payload.risk, confidence=payload.confidence, financial_impact=payload.financial_impact, policy=p, daily_actions=payload.daily_actions, execution_paused=paused)
    return {"auto_execute": allowed, "approval_required": not allowed, "paused": paused, "reason": "kill_switch" if paused else ("safe_policy_pass" if allowed else "approval_or_safety_gate")}

@router.post("/workflows")
def create_workflow(payload: WorkflowIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        run = start_workflow(db, seller_id(db, user), payload.workflow_key, payload.idempotency_key)
        db.commit()
        return {"id": run.id, "status": run.status, "idempotency_key": run.idempotency_key}
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc

@router.post("/workflows/{run_id}/complete")
def finish_workflow(run_id: int, payload: CompleteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.production import AutonomousWorkflowRun
    run = db.get(AutonomousWorkflowRun, run_id)
    if not run or run.seller_account_id != seller_id(db, user):
        raise HTTPException(404, "workflow not found")
    complete_workflow(db, run, success=payload.success, error=payload.error)
    db.commit()
    return {"id": run.id, "status": run.status}
