from __future__ import annotations

import hashlib
import json
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.action_control import ActionRequest, ActionRequestStatus
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount, Job
from app.models.diagnostic import Diagnostic
from app.models.inventory import InventoryItem
from app.models.listing_validation import ListingValidation
from app.models.operations import BusinessHealthSnapshot, OperationAlert
from app.models.orders import Order
from app.models.pricing import PriceHistory
from app.models.returns import ReturnRequest


class OperationsCenterService:
    """Build an explainable, seller-scoped operational command view."""

    def __init__(self, db: Session, seller_id: int):
        self.db = db
        self.seller_id = seller_id

    @staticmethod
    def _score(value: float) -> int:
        return max(0, min(100, round(value)))

    def _counts(self) -> dict:
        products = self.db.scalar(select(func.count(Product.id)).where(Product.seller_account_id == self.seller_id)) or 0
        listings = self.db.scalar(select(func.count(Listing.id)).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id == self.seller_id)) or 0
        active = self.db.scalar(select(func.count(Listing.id)).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id == self.seller_id, Listing.status == "active")) or 0
        inventory = list(self.db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id == self.seller_id)).all())
        available = sum(max(0, i.quantity - i.reserved_quantity) for i in inventory)
        low = sum(1 for i in inventory if i.quantity - i.reserved_quantity <= i.reorder_level)
        oos = sum(1 for i in inventory if i.quantity - i.reserved_quantity <= 0)
        order_rows = self.db.execute(select(Order.status, func.count(Order.id)).where(Order.seller_account_id == self.seller_id).group_by(Order.status)).all()
        jobs = self.db.execute(select(Job.status, func.count(Job.id)).where(Job.seller_account_id == self.seller_id).group_by(Job.status)).all()
        job_counts = {str(s): c for s, c in jobs}
        returns = self.db.scalar(select(func.count(ReturnRequest.id)).where(ReturnRequest.seller_account_id == self.seller_id)) or 0
        pending = self.db.scalar(select(func.count(ActionRequest.id)).where(ActionRequest.seller_account_id == self.seller_id, ActionRequest.status == ActionRequestStatus.PENDING.value)) or 0
        diagnostics = self.db.execute(select(Diagnostic.severity, func.count(Diagnostic.id)).where(Diagnostic.seller_account_id == self.seller_id, Diagnostic.status.in_(["open", "planned", "approved", "fixing", "failed"])).group_by(Diagnostic.severity)).all()
        diag_counts = {str(s): c for s, c in diagnostics}
        validation_rows = self.db.execute(select(ListingValidation.status, func.count(ListingValidation.id)).where(ListingValidation.seller_account_id == self.seller_id).group_by(ListingValidation.status)).all()
        validation_counts = {str(s): c for s, c in validation_rows}
        return locals()

    def calculate_health(self, c: dict | None = None) -> dict:
        c = c or self._counts()
        products, listings, active = c["products"], c["listings"], c["active"]
        inventory, low, oos = c["inventory"], c["low"], c["oos"]
        job_counts, pending = c["job_counts"], c["pending"]
        diag_counts, validation_counts = c["diag_counts"], c["validation_counts"]
        listing_score = 100 if not listings else self._score((active / listings) * 100)
        inventory_score = 100 if not inventory else self._score(100 - min(70, (low / len(inventory)) * 100) - min(30, (oos / len(inventory)) * 100))
        order_total = sum(c["order_rows"])
        delayed = sum(v for s, v in c["order_rows"] if str(s) in {"pending", "confirmed"})
        order_score = 100 if not order_total else self._score(100 - min(70, delayed / order_total * 100))
        pricing_rows = self.db.scalar(select(func.count(PriceHistory.id)).join(Listing, PriceHistory.listing_id == Listing.id).join(Product, Listing.product_id == Product.id).where(Product.seller_account_id == self.seller_id)) or 0
        pricing_score = 100 if not products or pricing_rows > 0 else 80
        critical = diag_counts.get("critical", 0) + diag_counts.get("high", 0)
        diagnostics_score = self._score(100 - min(100, critical * 12 + diag_counts.get("medium", 0) * 4))
        validation_bad = sum(v for s, v in validation_counts.items() if s not in {"healthy", "valid"})
        validation_total = sum(validation_counts.values())
        image_score = 100 if not validation_total else self._score(100 - (validation_bad / validation_total) * 100)
        compliance_score = self._score(100 - min(100, diag_counts.get("critical", 0) * 15 + diag_counts.get("high", 0) * 7))
        overall = self._score(listing_score * .20 + inventory_score * .15 + order_score * .10 + pricing_score * .10 + compliance_score * .15 + diagnostics_score * .20 + image_score * .10)
        reasons = []
        if oos: reasons.append({"area": "inventory", "impact": -min(30, oos * 3), "message": f"{oos} products are out of stock"})
        if low: reasons.append({"area": "inventory", "impact": -min(20, low * 2), "message": f"{low} products are at or below reorder level"})
        if validation_bad: reasons.append({"area": "listing", "impact": -min(25, validation_bad * 2), "message": f"{validation_bad} listing validations need attention"})
        if critical: reasons.append({"area": "diagnostics", "impact": -min(30, critical * 5), "message": f"{critical} high/critical diagnostics are open"})
        if job_counts.get("failed", 0): reasons.append({"area": "jobs", "impact": -min(20, job_counts["failed"] * 4), "message": f"{job_counts['failed']} background jobs failed"})
        if pending: reasons.append({"area": "approvals", "impact": -min(10, pending), "message": f"{pending} actions await approval"})
        return {"overall": overall, "components": {"listing": listing_score, "inventory": inventory_score, "orders": order_score, "pricing": pricing_score, "compliance": compliance_score, "diagnostics": diagnostics_score, "images": image_score}, "reasons": reasons}

    def sync_alerts(self, health: dict, c: dict) -> list[OperationAlert]:
        candidates = []
        if c["oos"]: candidates.append(("inventory_oos", "critical", "Out-of-stock products", f"{c['oos']} products have no available stock.", "inventory"))
        if c["low"]: candidates.append(("inventory_low", "warning", "Low-stock products", f"{c['low']} products are at or below reorder level.", "inventory"))
        if c["job_counts"].get("failed", 0): candidates.append(("jobs_failed", "critical", "Failed background jobs", f"{c['job_counts']['failed']} jobs need recovery.", "jobs"))
        if c["pending"]: candidates.append(("approval_pending", "warning", "AI actions awaiting approval", f"{c['pending']} controlled actions are waiting for an owner decision.", "action_queue"))
        if c["diag_counts"].get("critical", 0): candidates.append(("diagnostic_critical", "critical", "Critical diagnostics open", f"{c['diag_counts']['critical']} critical findings require attention.", "diagnostics"))
        existing = {a.fingerprint: a for a in self.db.scalars(select(OperationAlert).where(OperationAlert.seller_account_id == self.seller_id)).all()}
        result = []
        for key, severity, title, message, source in candidates:
            fp = hashlib.sha256(f"{self.seller_id}:{key}:{message}".encode()).hexdigest()
            item = existing.get(fp)
            if not item:
                item = OperationAlert(seller_account_id=self.seller_id, fingerprint=fp, alert_type=key, severity=severity, title=title, message=message, source=source)
                self.db.add(item)
            item.is_read = False
            result.append(item)
        self.db.flush()
        return result

    def overview(self, persist: bool = True) -> dict:
        c = self._counts()
        health = self.calculate_health(c)
        if persist:
            snap = BusinessHealthSnapshot(seller_account_id=self.seller_id, overall_score=health["overall"], listing_score=health["components"]["listing"], inventory_score=health["components"]["inventory"], order_score=health["components"]["orders"], pricing_score=health["components"]["pricing"], compliance_score=health["components"]["compliance"], diagnostics_score=health["components"]["diagnostics"], image_score=health["components"]["images"], reason_json=json.dumps(health["reasons"]))
            self.db.add(snap)
            alerts = self.sync_alerts(health, c)
            self.db.commit()
        else:
            alerts = list(self.db.scalars(select(OperationAlert).where(OperationAlert.seller_account_id == self.seller_id, OperationAlert.is_read.is_(False)).order_by(OperationAlert.created_at.desc()).limit(20)).all())
        accounts = list(self.db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id == self.seller_id)).all())
        actions = list(self.db.scalars(select(ActionRequest).where(ActionRequest.seller_account_id == self.seller_id).order_by(ActionRequest.created_at.desc()).limit(20)).all())
        return {"health": health, "kpis": {"orders": sum(c["order_rows"]), "products": c["products"], "listings": c["listings"], "inventory_units": sum(max(0, i.quantity - i.reserved_quantity) for i in c["inventory"]), "low_stock": c["low"], "out_of_stock": c["oos"], "returns": c["returns"], "pending_jobs": sum(c["job_counts"].get(s, 0) for s in ("queued", "running", "retrying")), "pending_approvals": c["pending"]}, "orders": {"by_status": {str(s): n for s, n in c["order_rows"]}}, "inventory": {"total_items": len(c["inventory"]), "units": sum(max(0, i.quantity - i.reserved_quantity) for i in c["inventory"]), "low_stock": c["low"], "out_of_stock": c["oos"]}, "catalog": {"products": c["products"], "listings": c["listings"], "active_listings": c["active"]}, "diagnostics": c["diag_counts"], "listing_validation": c["validation_counts"], "marketplaces": [{"id": a.id, "marketplace": a.marketplace, "status": "connected" if a.is_connected else "not_connected", "last_sync_at": a.last_sync_at.isoformat() if a.last_sync_at else None, "last_error": a.connection_error} for a in accounts], "alerts": [{"id": a.id, "severity": a.severity, "title": a.title, "message": a.message, "source": a.source, "is_read": a.is_read} for a in alerts], "action_queue": [{"id": a.id, "action": a.action, "risk": a.risk, "status": a.status, "reason": a.reason, "created_at": a.created_at.isoformat() if a.created_at else None} for a in actions]}
