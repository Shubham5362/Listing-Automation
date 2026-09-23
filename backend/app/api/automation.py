from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.automation import AutomationRule, AutomationRun
from app.models.core import SellerAccount, User
from app.schemas.automation import AutomationCreate, AutomationExecute, AutomationRead, AutomationRunRead
from app.services.automation import AutomationService
from app.services.automation_scheduler import run_due_scheduled_automations

router = APIRouter(prefix="/automations", tags=["automation"])
service = AutomationService()


def _seller(db: Session, user: User, seller_account_id: int) -> SellerAccount:
    seller = db.execute(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id)).scalar_one_or_none()
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return seller


def _rule(db: Session, seller_account_id: int, automation_id: int) -> AutomationRule:
    rule = db.execute(select(AutomationRule).where(AutomationRule.id == automation_id, AutomationRule.seller_account_id == seller_account_id)).scalar_one_or_none()
    if rule is None:
        raise HTTPException(status_code=404, detail="Automation not found")
    return rule


@router.post("", response_model=AutomationRead, status_code=201)
def create_automation(payload: AutomationCreate, seller_account_id: int | None = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if seller_account_id is None:
        seller_account_id = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id))
    if not seller_account_id:
        raise HTTPException(status_code=404, detail="Seller account not found")
    _seller(db, user, seller_account_id)
    if payload.trigger_type not in {"schedule", "event", "manual", "ai"}:
        raise HTTPException(status_code=422, detail="Unsupported trigger type")
    if not payload.actions:
        raise HTTPException(status_code=422, detail="At least one action is required")
    if payload.trigger_type == "schedule" and int(payload.trigger_config.get("interval_minutes", 0)) <= 0:
        raise HTTPException(status_code=422, detail="schedule trigger requires interval_minutes > 0")
    if payload.trigger_type == "event" and not payload.trigger_config.get("event_type"):
        raise HTTPException(status_code=422, detail="event trigger requires event_type")
    for action in payload.actions:
        if action.get("type") not in {"agent", "notification", "marketplace_sync", "set_context"}:
            raise HTTPException(status_code=422, detail=f"Unsupported automation action: {action.get('type')}")
        if action.get("type") == "agent" and not action.get("agent"):
            raise HTTPException(status_code=422, detail="agent action requires agent")
    rule = AutomationRule(seller_account_id=seller_account_id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("", response_model=list[AutomationRead])
def list_automations(seller_account_id: int | None = Query(default=None), enabled: bool | None = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if seller_account_id is None:
        s = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id))
        if not s:
            s = db.scalar(select(SellerAccount.id).where(SellerAccount.is_active == True))
        seller_account_id = s
    if not seller_account_id:
        return []
    query = select(AutomationRule).where(AutomationRule.seller_account_id == seller_account_id)
    if enabled is not None:
        query = query.where(AutomationRule.enabled == enabled)
    return list(db.execute(query.order_by(AutomationRule.id.desc())).scalars())


@router.patch("/{automation_id}/enabled", response_model=AutomationRead)
def set_enabled(automation_id: int, enabled: bool, seller_account_id: int | None = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if seller_account_id is None:
        seller_account_id = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id))
    if not seller_account_id:
        raise HTTPException(status_code=404, detail="Seller account not found")
    _seller(db, user, seller_account_id)
    rule = _rule(db, seller_account_id, automation_id)
    rule.enabled = enabled
    rule.status = "active" if enabled else "paused"
    db.commit()
    db.refresh(rule)
    return rule


@router.post("/{automation_id}/run", response_model=AutomationRunRead, status_code=201)
def run_automation(automation_id: int, payload: AutomationExecute, seller_account_id: int | None = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if seller_account_id is None:
        seller_account_id = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id))
    if not seller_account_id:
        raise HTTPException(status_code=404, detail="Seller account not found")
    _seller(db, user, seller_account_id)
    rule = _rule(db, seller_account_id, automation_id)
    context = {**payload.trigger_context, "user_id": user.id, "idempotency_key": payload.idempotency_key or str(uuid4())}
    return service.execute(db, rule, context)


@router.post("/{automation_id}/approve", response_model=AutomationRunRead)
def approve_automation_run(automation_id: int, run_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    rule = _rule(db, seller_account_id, automation_id)
    run = db.execute(select(AutomationRun).where(AutomationRun.id == run_id, AutomationRun.automation_rule_id == automation_id, AutomationRun.seller_account_id == seller_account_id)).scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="Automation run not found")
    if run.status != "awaiting_approval":
        raise HTTPException(status_code=409, detail="Automation run is not awaiting approval")
    context = dict(run.trigger_context or {})
    context["user_id"] = user.id
    context["idempotency_key"] = f"{context.get('idempotency_key', run.id)}:approved"
    return service.execute(db, rule, context, approved=True)


@router.post("/{automation_id}/runs/{run_id}/retry", response_model=AutomationRunRead, status_code=201)
def retry_automation_run(automation_id: int, run_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    rule = _rule(db, seller_account_id, automation_id)
    run = db.execute(select(AutomationRun).where(AutomationRun.id == run_id, AutomationRun.automation_rule_id == automation_id, AutomationRun.seller_account_id == seller_account_id)).scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="Automation run not found")
    if run.status != "failed":
        raise HTTPException(status_code=409, detail="Only failed automation runs can be retried")
    if not rule.enabled:
        raise HTTPException(status_code=409, detail="Automation is disabled")
    rule.status = "active"
    context = dict(run.trigger_context or {})
    context["user_id"] = user.id
    context["idempotency_key"] = f"retry:{run.id}:{uuid4()}"
    db.commit()
    return service.execute(db, rule, context, approved=True)


@router.post("/events/{event_type}", response_model=list[AutomationRunRead])
def dispatch_event(event_type: str, seller_account_id: int, payload: dict[str, Any] | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    context = {**(payload or {}), "event_type": event_type, "user_id": user.id, "idempotency_key": f"event:{event_type}:{uuid4()}"}
    rules = db.execute(select(AutomationRule).where(AutomationRule.seller_account_id == seller_account_id, AutomationRule.enabled.is_(True), AutomationRule.trigger_type == "event")).scalars().all()
    return [service.execute(db, rule, context) for rule in rules]


@router.post("/scheduled/due", response_model=list[dict[str, object]])
def run_due_scheduled(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    jobs = run_due_scheduled_automations(db, seller_account_id, user.id, service)
    return [{"id": job.id, "status": job.status, "name": job.name, "seller_account_id": job.seller_account_id} for job in jobs]


@router.delete("/{automation_id}", status_code=204)
def delete_automation(automation_id: int, seller_account_id: int | None = Query(default=None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if seller_account_id is None:
        seller_account_id = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id))
    if not seller_account_id:
        raise HTTPException(status_code=404, detail="Seller account not found")
    _seller(db, user, seller_account_id)
    rule = _rule(db, seller_account_id, automation_id)
    db.delete(rule)
    db.commit()

@router.get("/{automation_id}/runs", response_model=list[AutomationRunRead])
def list_runs(automation_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    _rule(db, seller_account_id, automation_id)
    return list(db.execute(select(AutomationRun).where(AutomationRun.automation_rule_id == automation_id, AutomationRun.seller_account_id == seller_account_id).order_by(AutomationRun.id.desc())).scalars())
