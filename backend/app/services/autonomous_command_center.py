from __future__ import annotations
import json
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.autonomous import AutonomousAction, AutonomousAudit, AutonomousIncident

RISK_ORDER = {"low": 1, "medium": 2, "high": 3}

class AutonomousCommandCenter:
    def __init__(self, db: Session, seller_id: int):
        self.db, self.seller_id = db, seller_id

    def propose(self, action: str, confidence: float, risk: str = "low", reason: str | None = None, incident_id: int | None = None):
        risk = risk if risk in RISK_ORDER else "high"
        approval = risk != "low" or confidence < 0.85
        row = AutonomousAction(seller_account_id=self.seller_id, incident_id=incident_id, action=action, risk=risk, confidence=max(0, min(1, confidence)), approval_required=approval, status="pending_approval" if approval else "proposed", reason=reason)
        self.db.add(row); self.db.flush(); self.audit(row.id, "proposed", {"approval_required": approval})
        return row

    def create_incident(self, title: str, source: str, severity: str = "info", root_cause: str | None = None, impact: dict | None = None):
        row = AutonomousIncident(seller_account_id=self.seller_id, title=title, source=source, severity=severity, root_cause=root_cause, impact_json=json.dumps(impact) if impact else None)
        self.db.add(row); self.db.flush(); self.audit(None, "incident_detected", {"incident_id": row.id})
        return row

    def approve(self, action_id: int):
        row = self.db.scalar(select(AutonomousAction).where(AutonomousAction.id == action_id, AutonomousAction.seller_account_id == self.seller_id))
        if not row: return None
        row.status = "approved"; self.audit(row.id, "approved"); return row

    def verify(self, action_id: int, success: bool):
        row = self.db.scalar(select(AutonomousAction).where(AutonomousAction.id == action_id, AutonomousAction.seller_account_id == self.seller_id))
        if not row: return None
        row.status = "completed" if success else "failed"
        row.verification_status = "verified" if success else "failed"
        self.audit(row.id, "verified", {"success": success})
        return row

    def audit(self, action_id: int | None, event: str, details: dict | None = None):
        self.db.add(AutonomousAudit(seller_account_id=self.seller_id, action_id=action_id, event=event, details_json=json.dumps(details) if details else None))

    def dashboard(self):
        incidents = self.db.scalar(select(func.count()).select_from(AutonomousIncident).where(AutonomousIncident.seller_account_id == self.seller_id, AutonomousIncident.status != "resolved")) or 0
        pending = self.db.scalar(select(func.count()).select_from(AutonomousAction).where(AutonomousAction.seller_account_id == self.seller_id, AutonomousAction.status == "pending_approval")) or 0
        completed = self.db.scalar(select(func.count()).select_from(AutonomousAction).where(AutonomousAction.seller_account_id == self.seller_id, AutonomousAction.status == "completed")) or 0
        failed = self.db.scalar(select(func.count()).select_from(AutonomousAction).where(AutonomousAction.seller_account_id == self.seller_id, AutonomousAction.status == "failed")) or 0
        total = completed + failed
        return {"seller_health": max(0, round(100 * completed / total)) if total else 100, "open_incidents": incidents, "pending_approvals": pending, "completed_actions": completed, "failed_actions": failed}
