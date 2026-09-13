from __future__ import annotations

import json
import logging
import socket
import time

from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.automation import AutomationRule
from app.models.core import Job, MarketplaceAccount
from app.services.automation import AutomationService
from app.services.automation_scheduler import enqueue_due_scheduled_automations
from app.services.jobs import claim_next_job, mark_job_finished, recover_stale_jobs, retry_job
from app.services.listing_operations import execute_listing_publish
from app.services.marketplace_operations import execute_marketplace_operation
from app.services.marketplace_sync import sync_marketplace_account

logger = logging.getLogger("seller_hub.worker")


class BackgroundWorker:
    def __init__(self, worker_id: str | None = None) -> None:
        self.settings = get_settings()
        self.worker_id = worker_id or f"{socket.gethostname()}-{id(self)}"

    def execute_job(self, db, job: Job) -> dict:
        payload = json.loads(job.payload or "{}")
        if job.name == "marketplace_sync":
            account_id = payload.get("marketplace_account_id")
            if account_id is None:
                raise ValueError("marketplace_account_id is required")
            account = db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == int(account_id), MarketplaceAccount.seller_account_id == job.seller_account_id))
            if not account:
                raise ValueError("Marketplace account not found for seller")
            return sync_marketplace_account(db, account)
        if job.name == "marketplace_operation":
            account_id = payload.get("marketplace_account_id")
            operation = payload.get("operation")
            if account_id is None or not operation:
                raise ValueError("marketplace_account_id and operation are required")
            return execute_marketplace_operation(db, seller_account_id=job.seller_account_id, marketplace_account_id=int(account_id), operation=str(operation), payload=dict(payload.get("payload") or {}))
        if job.name == "listing_publish":
            draft_id = payload.get("listing_draft_id")
            product_type = payload.get("product_type")
            if draft_id is None or not product_type:
                raise ValueError("listing_draft_id and product_type are required")
            return execute_listing_publish(db, seller_account_id=job.seller_account_id, draft_id=int(draft_id), product_type=str(product_type))
        if job.name == "automation_run":
            rule_id = payload.get("automation_rule_id")
            if rule_id is None or payload.get("user_id") is None:
                raise ValueError("automation_rule_id and user_id are required")
            rule = db.scalar(select(AutomationRule).where(AutomationRule.id == int(rule_id), AutomationRule.seller_account_id == job.seller_account_id))
            if not rule:
                raise ValueError("Automation rule not found for seller")
            context = dict(payload.get("context") or {})
            context["user_id"] = int(payload["user_id"])
            run = AutomationService().execute(db, rule, context)
            return {"automation_run_id": run.id, "status": run.status}
        raise ValueError(f"Unsupported background job: {job.name}")

    def run_once(self) -> int:
        db = SessionLocal()
        try:
            recover_stale_jobs(db)
            enqueue_due_scheduled_automations(db)
            processed = 0
            for _ in range(max(1, self.settings.worker_batch_size)):
                job = claim_next_job(db, self.worker_id)
                if not job:
                    break
                processed += 1
                try:
                    result = self.execute_job(db, job)
                except Exception as exc:
                    logger.exception("Background job %s failed", job.id)
                    retry_job(db, job.id, str(exc))
                else:
                    mark_job_finished(db, job.id, result=result)
            return processed
        finally:
            db.close()

    def run_forever(self) -> None:
        logger.info("Seller Hub worker started: %s", self.worker_id)
        while True:
            processed = self.run_once()
            if not processed:
                time.sleep(max(0.5, self.settings.worker_poll_interval_seconds))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    BackgroundWorker().run_forever()
