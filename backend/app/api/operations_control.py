from __future__ import annotations

import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.action_control import ActionRequest, ActionRequestStatus
from app.models.core import AuditLog, Job
from app.services.action_control import approve_personal_action, create_personal_action, reject_personal_action
from app.services.marketplace_reconciliation import reconcile_inventory
from app.services.personal_marketplace import personal_seller_id

router = APIRouter(prefix="/operations", tags=["operations-control"])


class PersonalActionRequest(BaseModel):
    action: str = Field(min_length=1, max_length=80)
    payload: dict = Field(default_factory=dict)
    reason: str | None = Field(default=None, max_length=1000)


class RejectRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)


def _seller(db: Session) -> int:
    seller_id = personal_seller_id(db)
    if seller_id is None:
        raise HTTPException(status_code=503, detail="Personal seller workspace is not initialized")
    return seller_id


def _dt(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _job_dict(job: Job) -> dict:
    return {"id": job.id, "name": job.name, "status": job.status, "seller_account_id": job.seller_account_id, "attempts": job.attempts, "max_attempts": job.max_attempts, "error": job.error, "result": json.loads(job.result) if job.result else None, "created_at": _dt(job.created_at), "started_at": _dt(job.started_at), "finished_at": _dt(job.finished_at), "run_after": _dt(job.run_after)}


def _action_dict(item: ActionRequest) -> dict:
    return {"id": item.id, "action": item.action, "risk": item.risk, "status": item.status, "payload": json.loads(item.payload) if item.payload else {}, "reason": item.reason, "job_id": item.job_id, "result": json.loads(item.result) if item.result else None, "error": item.error, "created_at": _dt(item.created_at), "approved_at": _dt(item.approved_at), "rejected_at": _dt(item.rejected_at), "completed_at": _dt(item.completed_at)}


@router.get("/jobs")
def personal_jobs(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1, le=100)) -> dict:
    seller_id = _seller(db)
    jobs = db.scalars(select(Job).where(Job.seller_account_id == seller_id).order_by(Job.created_at.desc()).limit(limit)).all()
    counts: dict[str, int] = {}
    for job in jobs: counts[job.status] = counts.get(job.status, 0) + 1
    return {"counts": counts, "jobs": [_job_dict(job) for job in jobs]}


@router.post("/jobs/{job_id}/retry", status_code=202)
def personal_retry_job(job_id: int, db: Session = Depends(get_db)) -> dict:
    seller_id = _seller(db)
    job = db.scalar(select(Job).where(Job.id == job_id, Job.seller_account_id == seller_id))
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in {"failed", "completed"}: raise HTTPException(status_code=409, detail="Only failed or completed jobs can be retried")
    job.attempts = 0; job.status = "queued"; job.error = None; job.result = None; job.started_at = None; job.finished_at = None; job.locked_at = None; job.worker_id = None
    db.commit(); db.refresh(job)
    return _job_dict(job)


@router.get("/actions")
def personal_actions(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1, le=100)) -> dict:
    items = db.scalars(select(ActionRequest).where(ActionRequest.seller_account_id == _seller(db)).order_by(ActionRequest.created_at.desc()).limit(limit)).all()
    pending = sum(1 for item in items if item.status == ActionRequestStatus.PENDING.value)
    return {"pending": pending, "actions": [_action_dict(item) for item in items]}


@router.post("/actions", status_code=202)
def request_personal_action(request: PersonalActionRequest, db: Session = Depends(get_db)) -> dict:
    try: item = create_personal_action(db, action=request.action, payload=request.payload, reason=request.reason)
    except ValueError as exc: raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _action_dict(item)


@router.post("/actions/{action_id}/approve", status_code=202)
def approve_action(action_id: int, db: Session = Depends(get_db)) -> dict:
    item = approve_personal_action(db, action_id)
    if not item: raise HTTPException(status_code=404, detail="Pending action not found")
    return _action_dict(item)


@router.post("/actions/{action_id}/reject")
def reject_action(action_id: int, request: RejectRequest, db: Session = Depends(get_db)) -> dict:
    item = reject_personal_action(db, action_id, request.reason)
    if not item: raise HTTPException(status_code=404, detail="Pending action not found")
    return _action_dict(item)


@router.get("/audit")
def personal_audit(db: Session = Depends(get_db), limit: int = Query(default=100, ge=1, le=100)) -> list[dict]:
    seller_id = _seller(db)
    action_ids = select(ActionRequest.id).where(ActionRequest.seller_account_id == seller_id)
    rows = db.scalars(select(AuditLog).where(AuditLog.resource_type == "action_request", AuditLog.resource_id.in_(action_ids)).order_by(AuditLog.created_at.desc()).limit(limit)).all()
    return [{"id": row.id, "action": row.action, "resource_type": row.resource_type, "resource_id": row.resource_id, "details": json.loads(row.details) if row.details else {}, "created_at": _dt(row.created_at)} for row in rows]


@router.get("/marketplaces/{marketplace_account_id}/inventory-reconciliation")
def marketplace_inventory_reconciliation(marketplace_account_id: int, limit: int = Query(default=100, ge=1, le=100), db: Session = Depends(get_db)) -> dict:
    try:
        return reconcile_inventory(db, seller_account_id=_seller(db), marketplace_account_id=marketplace_account_id, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
