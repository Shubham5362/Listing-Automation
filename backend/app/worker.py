from __future__ import annotations

import json
import logging
import socket
import time

from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.automation import AutomationRule, AutomationTriggerType
from app.models.core import MarketplaceAccount, SellerAccount
from app.services.automation import AutomationService
from app.services.jobs import claim_next_job, recover_stale_jobs, retry_job, mark_job_finished, enqueue_job
from app.services.marketplace_sync import sync_marketplace_account

logger = logging.getLogger("seller_hub.worker")


class BackgroundWorker:
    def __init__(self, worker_id: str | None = None) -> None:
        self.settings = get_settings()
        self.worker_id = worker_id or f"{socket.gethostname()}-{id(self)}"

    def enqueue_due_automations(self, db) -> int:
        now_rules = db.scalars(
            select(AutomationRule).where(
                AutomationRule.enabled.is_(True),
                AutomationRule.trigger_type == AutomationTriggerType.schedule.value,
                AutomationRule.status == "active",
            )
        ).all()
        queued = 0
        service = AutomationService()
        for rule in now_rules:
            now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
            if not service.trigger_matches(rule, {}, now):
                continue
            seller = db.get(SellerAccount, rule.seller_account_id)
            if not seller or not seller.user_id:
                continue
            active = db.scalar(
                select(__import__("app.models.core", fromlist=["Job"]).Job).where(
                    __import__("app.models.core", fromlist=["Job"]).Job.name == "automation_run",
                    __import__("app.models.core", fromlist=["Job"]).Job.seller_account_id == rule.seller_account_id,
                    __import__("app.models.core", fromlist=["Job"]).Job.status.in_(["queued", "running"]),
                )
            )
            if active:
                continue
            enqueue_job(
                db,
                "automation_run",
                {"automation_rule_id": rule.id, "user_id": seller.user_id, "context": {"trigger_type": "schedule", "user_id": seller.user_id}},
                seller_account_id=rule.seller_account_id,
            )
            queued += 1
        return queued

    def execute_job(self, db, job) -> dict:
        payload = json.loads(job.payload or "{}")
        if job.name == "marketplace_sync":
            account_id = payload.get("marketplace_account_id")
            if account_id is None:
                raise ValueError("marketplace_account_id is required")
            account = db.scalar(
                select(MarketplaceAccount).where(
                    MarketplaceAccount.id == int(account_id),
                    MarketplaceAccount.seller_account_id == job.seller_account_id,
                )
            )
            if not account:
                raise ValueError("Marketplace account not found for seller")
            return sync_marketplace_account(db, account)
        if job.name == "automation_run":
            rule_id = payload.get("automation_rule_id")
            rule = db.scalar(
                select(AutomationRule).where(
                    AutomationRule.id == int(rule_id),
                    AutomationRule.seller_account_id == job.seller_account_id,
                )
            )
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
            self.enqueue_due_automations(db)
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
