from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.services.jobs import enqueue_job


@dataclass(frozen=True)
class ActionResult:
    action: str
    status: str
    job_id: int
    message: str


class ActionExecutor:
    """Single safe gateway for user-approved operational actions."""

    ALLOWED_ACTIONS = {
        "marketplace_sync": "marketplace_sync",
        "marketplace_operation": "marketplace_operation",
        "listing_publish": "listing_publish",
        "listing_update": "listing_update",
        "automation_run": "automation_run",
    }

    def __init__(self, db: Session):
        self.db = db

    def enqueue(self, *, seller_account_id: int, action: str, payload: dict[str, Any] | None = None) -> ActionResult:
        normalized = action.strip().lower()
        job_name = self.ALLOWED_ACTIONS.get(normalized)
        if job_name is None:
            raise ValueError(f"Unsupported action: {action}")
        job = enqueue_job(
            self.db,
            job_name,
            payload or {},
            seller_account_id=seller_account_id,
        )
        return ActionResult(
            action=normalized,
            status=job.status,
            job_id=job.id,
            message="Action queued for background execution",
        )
