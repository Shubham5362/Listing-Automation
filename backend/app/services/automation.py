from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.agents.base import AgentTask
from app.agents.orchestrator import AgentOrchestrator
from app.models.automation import AutomationRule, AutomationRun, AutomationRunStatus, AutomationStatus, AutomationTriggerType


class AutomationService:
    def __init__(self, orchestrator: AgentOrchestrator | None = None) -> None:
        self.orchestrator = orchestrator or AgentOrchestrator()

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
            if operator not in {"eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"}:
                raise ValueError(f"Unsupported condition operator: {operator}")
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

    def execute(self, db: Session, rule: AutomationRule, context: dict[str, Any]) -> AutomationRun:
        now = datetime.now(timezone.utc)
        run = AutomationRun(
            automation_rule_id=rule.id,
            seller_account_id=rule.seller_account_id,
            status=AutomationRunStatus.running,
            trigger_context=context,
            result={},
            started_at=now,
        )
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

            outputs: list[dict[str, Any]] = []
            for action in rule.actions or []:
                action_type = action.get("type")
                if action_type == "agent":
                    result = self.orchestrator.execute(
                        rule.seller_account_id,
                        int(context["user_id"]),
                        AgentTask(
                            name=str(action["agent"]),
                            task=str(action.get("task", "automation_action")),
                            input={**context, **action.get("input", {})},
                            requires_approval=bool(action.get("requires_approval", False)),
                        ),
                    )
                    outputs.append({"type": "agent", "agent": result.agent, "status": result.status, "output": result.output, "requires_approval": result.requires_approval})
                elif action_type == "notification":
                    outputs.append({"type": "notification", "channel": action.get("channel", "in_app"), "message": action.get("message", "")})
                elif action_type == "set_context":
                    context.update(action.get("values", {}))
                    outputs.append({"type": "set_context", "values": action.get("values", {})})
                else:
                    raise ValueError(f"Unsupported automation action: {action_type}")
            run.status = AutomationRunStatus.succeeded
            run.result = {"actions": outputs}
            return self._finish(db, rule, run, now)
        except Exception as exc:
            run.status = AutomationRunStatus.failed
            run.error = str(exc)
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
