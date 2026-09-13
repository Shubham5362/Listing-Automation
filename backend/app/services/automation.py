from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.base import AgentTask
from app.agents.orchestrator import AgentOrchestrator
from app.models.automation import AutomationRule, AutomationRun, AutomationRunStatus, AutomationStatus, AutomationTriggerType
from app.models.core import MarketplaceAccount
from app.services.marketplace_sync import MarketplaceSyncError, sync_marketplace_account
from app.services.notifications import NotificationService


SUPPORTED_OPERATORS = {"eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"}


class AutomationService:
    def __init__(self, orchestrator: AgentOrchestrator | None = None, notification_service: NotificationService | None = None) -> None:
        self.orchestrator = orchestrator or AgentOrchestrator()
        self.notification_service = notification_service or NotificationService()

    @staticmethod
    def _value(context: dict[str, Any], path: str) -> Any:
        value: Any = context
        for part in path.split("."):
            if not isinstance(value, dict) or part not in value:
                return None
            value = value[part]
        return value

    @classmethod
    def conditions_match(cls, conditions: list[dict[str, Any]], context: dict[str, Any]) -> bool:
        for condition in conditions:
            actual = cls._value(context, str(condition.get("field", "")))
            expected = condition.get("value")
            operator = condition.get("operator", "eq")
            if operator not in SUPPORTED_OPERATORS:
                raise ValueError(f"Unsupported condition operator: {operator}")
            if operator == "eq" and actual != expected:
                return False
            if operator == "neq" and actual == expected:
                return False
            if operator == "gt" and not (actual is not None and actual > expected):
                return False
            if operator == "gte" and not (actual is not None and actual >= expected):
                return False
            if operator == "lt" and not (actual is not None and actual < expected):
                return False
            if operator == "lte" and not (actual is not None and actual <= expected):
                return False
            if operator == "in" and actual not in expected:
                return False
            if operator == "contains" and (actual is None or expected not in actual):
                return False
        return True

    @staticmethod
    def _utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @classmethod
    def trigger_matches(cls, rule: AutomationRule, context: dict[str, Any], now: datetime) -> bool:
        config = rule.trigger_config or {}
        if rule.trigger_type == AutomationTriggerType.event.value:
            return context.get("event_type") == config.get("event_type")
        if rule.trigger_type == AutomationTriggerType.schedule.value:
            interval = int(config.get("interval_minutes", 0))
            if interval <= 0:
                return False
            last_run = rule.last_run_at
            return last_run is None or cls._utc(now) >= cls._utc(last_run) + timedelta(minutes=interval)
        if rule.trigger_type in {AutomationTriggerType.manual.value, AutomationTriggerType.ai.value}:
            return True
        return False

    @staticmethod
    def _idempotency_key(context: dict[str, Any]) -> str | None:
        value = context.get("idempotency_key")
        return str(value) if value else None

    @classmethod
    def find_idempotent_run(cls, db: Session, rule: AutomationRule, context: dict[str, Any]) -> AutomationRun | None:
        key = cls._idempotency_key(context)
        if not key:
            return None
        runs = db.scalars(
            select(AutomationRun).where(
                AutomationRun.automation_rule_id == rule.id,
                AutomationRun.seller_account_id == rule.seller_account_id,
                AutomationRun.trigger_context.is_not(None),
            ).order_by(AutomationRun.id.desc())
        ).all()
        for run in runs:
            if isinstance(run.trigger_context, dict) and run.trigger_context.get("idempotency_key") == key:
                return run
        return None

    @staticmethod
    def _needs_approval(rule: AutomationRule) -> bool:
        return any(bool(action.get("requires_approval", False)) for action in (rule.actions or []))

    def execute(self, db: Session, rule: AutomationRule, context: dict[str, Any], approved: bool = False) -> AutomationRun:
        now = datetime.now(timezone.utc)
        existing = self.find_idempotent_run(db, rule, context)
        if existing is not None:
            return existing
        run = AutomationRun(automation_rule_id=rule.id, seller_account_id=rule.seller_account_id, status=AutomationRunStatus.running, trigger_context=context, result={}, started_at=now)
        db.add(run)
        db.flush()
        try:
            if not rule.enabled or rule.status != AutomationStatus.active.value:
                run.status = AutomationRunStatus.skipped
                run.result = {"reason": "automation_disabled"}
                return self._finish(db, rule, run, now)
            if not self.trigger_matches(rule, context, now):
                run.status = AutomationRunStatus.skipped
                run.result = {"reason": "trigger_not_matched"}
                return self._finish(db, rule, run, now)
            if not self.conditions_match(rule.conditions or [], context):
                run.status = AutomationRunStatus.skipped
                run.result = {"reason": "conditions_not_met"}
                return self._finish(db, rule, run, now)
            if self._needs_approval(rule) and not approved:
                run.status = "awaiting_approval"
                run.result = {"status": "awaiting_approval", "message": "Human approval is required before this workflow can execute.", "action_count": len(rule.actions or [])}
                db.commit()
                db.refresh(run)
                return run

            outputs: list[dict[str, Any]] = []
            for index, action in enumerate(rule.actions or []):
                action_type = action.get("type")
                if action_type == "agent":
                    result = self.orchestrator.execute(rule.seller_account_id, int(context["user_id"]), AgentTask(name=str(action["agent"]), task=str(action.get("task", "automation_action")), input={**context, **action.get("input", {})}, requires_approval=False))
                    outputs.append({"step": index, "type": "agent", "agent": result.agent, "status": result.status, "output": result.output, "requires_approval": False})
                elif action_type == "notification":
                    notification = self.notification_service.create_and_dispatch(db, rule.seller_account_id, int(context["user_id"]), category=str(action.get("category", "critical")), severity=str(action.get("severity", "info")), title=str(action.get("title", "Seller Hub alert")), message=str(action.get("message", context.get("message", "Automation alert"))), data={**context, **action.get("data", {})}, channels=list(action.get("channels", [action.get("channel", "in_app")])))
                    outputs.append({"step": index, "type": "notification", "notification_id": notification.id, "channels": action.get("channels", [action.get("channel", "in_app")])})
                elif action_type == "marketplace_sync":
                    account_id = action.get("marketplace_account_id", context.get("marketplace_account_id"))
                    if account_id is None:
                        raise ValueError("marketplace_account_id is required for marketplace_sync")
                    account = db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == int(account_id), MarketplaceAccount.seller_account_id == rule.seller_account_id))
                    if not account:
                        raise ValueError("Marketplace account not found for seller")
                    try:
                        sync_result = sync_marketplace_account(db, account)
                    except MarketplaceSyncError as exc:
                        raise RuntimeError(str(exc)) from exc
                    outputs.append({"step": index, "type": "marketplace_sync", "marketplace_account_id": account.id, "result": sync_result})
                elif action_type == "set_context":
                    context.update(action.get("values", {}))
                    outputs.append({"step": index, "type": "set_context", "values": action.get("values", {})})
                else:
                    raise ValueError(f"Unsupported automation action: {action_type}")
            run.status = AutomationRunStatus.succeeded
            run.result = {"actions": outputs, "steps_completed": len(outputs)}
            return self._finish(db, rule, run, now)
        except Exception as exc:
            run.status = AutomationRunStatus.failed
            run.error = str(exc)
            run.result = {"failed": True, "actions_completed": len(run.result.get("actions", [])) if isinstance(run.result, dict) else 0}
            rule.status = AutomationStatus.failed
            return self._finish(db, rule, run, now)

    @staticmethod
    def _finish(db: Session, rule: AutomationRule, run: AutomationRun, now: datetime) -> AutomationRun:
        run.finished_at = datetime.now(timezone.utc)
        if run.status == AutomationRunStatus.succeeded:
            rule.last_run_at = now
        db.commit()
        db.refresh(run)
        return run
