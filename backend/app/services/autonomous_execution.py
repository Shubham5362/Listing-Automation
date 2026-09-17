from __future__ import annotations
import json
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.autonomous_execution import AutonomousPlan, AutonomousPlanItem, BusinessOpportunity
from app.models.core import MarketplaceAccount, SellerAccount, Job
from app.services.marketplace_operations import enqueue_marketplace_operation
from app.services.business_intelligence import BusinessIntelligenceService

RISK_ORDER = {"low": 0, "medium": 1, "high": 2, "critical": 3}

class AutonomousExecutionService:
    def __init__(self, db: Session, seller_account_id: int):
        self.db = db
        self.seller_account_id = seller_account_id

    def _owned_accounts(self):
        return self.db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id == self.seller_account_id)).all()

    def create_plan(self, intent: str, items: list[dict], confidence: float = 0.8, risk: str = "medium") -> AutonomousPlan:
        if risk not in RISK_ORDER:
            raise ValueError("invalid risk")
        if not 0 <= confidence <= 1:
            raise ValueError("confidence must be between 0 and 1")
        accounts = {a.id for a in self._owned_accounts()}
        if not items:
            raise ValueError("at least one item is required")
        normalized = []
        for item in items:
            account_id = item.get("marketplace_account_id")
            if account_id is not None and account_id not in accounts:
                raise ValueError("marketplace account is not owned by seller")
            operation = item.get("operation")
            if operation not in {"inventory_push", "price_push"}:
                raise ValueError("unsupported autonomous operation")
            payload = dict(item.get("payload") or {})
            if operation == "inventory_push" and ("quantity" not in payload or payload["quantity"] < 0):
                raise ValueError("inventory_push requires non-negative quantity")
            if operation == "price_push" and float(payload.get("price", 0)) <= 0:
                raise ValueError("price_push requires positive price")
            normalized.append((account_id, item["sku"], operation, payload))
        approval_required = risk != "low" or confidence < 0.85
        plan = AutonomousPlan(seller_account_id=self.seller_account_id, intent=intent, status="pending_approval" if approval_required else "approved", risk=risk, confidence=confidence, approval_required=approval_required, summary_json=json.dumps({"item_count": len(normalized)}))
        self.db.add(plan); self.db.flush()
        for account_id, sku, operation, payload in normalized:
            self.db.add(AutonomousPlanItem(plan_id=plan.id, seller_account_id=self.seller_account_id, marketplace_account_id=account_id, sku=sku, operation=operation, payload_json=json.dumps(payload)))
        return plan

    def approve_and_queue(self, plan_id: int) -> AutonomousPlan | None:
        plan = self.db.scalar(select(AutonomousPlan).where(AutonomousPlan.id == plan_id, AutonomousPlan.seller_account_id == self.seller_account_id))
        if not plan or plan.status not in {"pending_approval", "proposed"}:
            return None
        items = self.db.scalars(select(AutonomousPlanItem).where(AutonomousPlanItem.plan_id == plan.id, AutonomousPlanItem.seller_account_id == self.seller_account_id)).all()
        for item in items:
            if item.marketplace_account_id is None:
                item.status = "blocked"
                continue
            job_id = enqueue_marketplace_operation(self.db, seller_account_id=self.seller_account_id, marketplace_account_id=item.marketplace_account_id, operation=item.operation, payload=json.loads(item.payload_json or "{}") | {"sku": item.sku})
            item.job_id = job_id; item.status = "queued"
        plan.status = "queued"
        return plan

    def dashboard(self) -> dict:
        plans = self.db.scalars(select(AutonomousPlan).where(AutonomousPlan.seller_account_id == self.seller_account_id).order_by(AutonomousPlan.id.desc()).limit(20)).all()
        open_opps = self.db.scalar(select(func.count()).select_from(BusinessOpportunity).where(BusinessOpportunity.seller_account_id == self.seller_account_id, BusinessOpportunity.status == "open")) or 0
        jobs = self.db.scalar(select(func.count()).select_from(Job).where(Job.seller_account_id == self.seller_account_id, Job.name == "marketplace_operation", Job.status.in_(["queued", "running"]))) or 0
        return {"seller_account_id": self.seller_account_id, "open_opportunities": int(open_opps), "active_marketplace_jobs": int(jobs), "plans": [{"id": p.id, "intent": p.intent, "status": p.status, "risk": p.risk, "confidence": p.confidence, "approval_required": p.approval_required} for p in plans]}

    def generate_opportunities(self, user) -> list[BusinessOpportunity]:
        report = BusinessIntelligenceService(self.db, user).decision_report()
        rows = []
        for decision in report.get("decisions", []):
            priority = decision.get("priority", "medium")
            score = {"critical": 95, "high": 80, "medium": 60, "low": 30}.get(priority, 50)
            row = BusinessOpportunity(seller_account_id=self.seller_account_id, area=decision.get("area", "general"), title=decision.get("action", "Review business plan"), priority=priority, score=score, reason=decision.get("reason"))
            self.db.add(row); rows.append(row)
        return rows
