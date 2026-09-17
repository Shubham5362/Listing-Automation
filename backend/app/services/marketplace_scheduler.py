from __future__ import annotations

import json
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.models.core import Job, MarketplaceAccount
from app.services.jobs import enqueue_job


def enqueue_due_marketplace_syncs(db: Session, settings: Settings | None = None) -> int:
    settings = settings or get_settings()
    interval = max(5, int(settings.marketplace_sync_interval_minutes))
    cutoff = datetime.utcnow() - timedelta(minutes=interval)
    accounts = list(db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.credentials_ref.is_not(None))).all())
    queued = 0
    for account in accounts:
        if account.last_sync_at and account.last_sync_at > cutoff:
            continue
        payload = json.dumps({"marketplace_account_id": account.id}, separators=(",", ":"))
        active = db.scalar(select(Job.id).where(Job.seller_account_id == account.seller_account_id, Job.name == "marketplace_sync", Job.status.in_(["queued", "running"]), Job.payload == payload).limit(1))
        if active:
            continue
        enqueue_job(db, "marketplace_sync", {"marketplace_account_id": account.id}, seller_account_id=account.seller_account_id)
        queued += 1
    return queued
