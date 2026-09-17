from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.action_control import ActionRequest, ActionRequestStatus, ActionRisk
from app.models.core import AuditLog
from app.services.jobs import enqueue_job
from app.services.personal_marketplace import personal_seller_id


ACTION_RISK: dict[str, ActionRisk] = {
    "marketplace_sync": ActionRisk.LOW,
    "marketplace_operation": ActionRisk.MEDIUM,
    "listing_publish": ActionRisk.HIGH,
    "listing_update": ActionRisk.MEDIUM,
    "automation_run": ActionRisk.MEDIUM,
}


def _audit(db: Session, action: str, resource_type: str, resource_id: int | None, details: dict[str, Any]) -> None:
    db.add(AuditLog(action=action, resource_type=resource_type, resource_id=str(resource_id) if resource_id is not None else None, details=json.dumps(details, separators=(",", ":"))))


def create_personal_action(db: Session, *, action: str, payload: dict[str, Any], reason: str | None = None) -> ActionRequest:
    normalized = action.strip().lower()
    risk = ACTION_RISK.get(normalized)
    seller_id = personal_seller_id(db)
    if risk is None:
        raise ValueError(f"Unsupported action: {action}")
    if seller_id is None:
        raise ValueError("Personal seller workspace is not initialized")

    request = ActionRequest(
        seller_account_id=seller_id,
        action=normalized,
        risk=risk.value,
        status=ActionRequestStatus.PENDING.value,
        payload=json.dumps(payload, separators=(",", ":")),
        reason=reason,
    )
    db.add(request)
    db.flush()

    if risk == ActionRisk.LOW:
        _queue_request(db, request)
    _audit(db, "action.requested", "action_request", request.id, {"action": normalized, "risk": risk.value, "status": request.status})
    db.commit()
    db.refresh(request)
    return request


def _queue_request(db: Session, request: ActionRequest) -> ActionRequest:
    payload = json.loads(request.payload or "{}")
    payload["action_request_id"] = request.id
    job = enqueue_job(db, request.action, payload, seller_account_id=request.seller_account_id)
    request.job_id = job.id
    request.status = ActionRequestStatus.EXECUTING.value
    return request


def approve_personal_action(db: Session, request_id: int) -> ActionRequest | None:
    request = _personal_request(db, request_id)
    if not request or request.status != ActionRequestStatus.PENDING.value:
        return None
    request.status = ActionRequestStatus.APPROVED.value
    request.approved_at = datetime.utcnow()
    _queue_request(db, request)
    _audit(db, "action.approved", "action_request", request.id, {"action": request.action, "job_id": request.job_id})
    db.commit()
    db.refresh(request)
    return request


def reject_personal_action(db: Session, request_id: int, reason: str | None = None) -> ActionRequest | None:
    request = _personal_request(db, request_id)
    if not request or request.status != ActionRequestStatus.PENDING.value:
        return None
    request.status = ActionRequestStatus.REJECTED.value
    request.rejected_at = datetime.utcnow()
    request.error = reason or "Rejected by owner"
    _audit(db, "action.rejected", "action_request", request.id, {"action": request.action, "reason": request.error})
    db.commit()
    db.refresh(request)
    return request


def _personal_request(db: Session, request_id: int) -> ActionRequest | None:
    seller_id = personal_seller_id(db)
    if seller_id is None:
        return None
    return db.scalar(select(ActionRequest).where(ActionRequest.id == request_id, ActionRequest.seller_account_id == seller_id))


def list_personal_actions(db: Session, limit: int = 100) -> list[ActionRequest]:
    seller_id = personal_seller_id(db)
    if seller_id is None:
        return []
    return list(db.scalars(select(ActionRequest).where(ActionRequest.seller_account_id == seller_id).order_by(ActionRequest.created_at.desc()).limit(max(1, min(limit, 100)))).all())
