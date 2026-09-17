from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from app.core.observability import metrics_snapshot
from app.services.notifications import NotificationService


@dataclass(frozen=True)
class AlertRule:
    key: str
    title: str
    severity: str
    description: str


RULES = (
    AlertRule("http_5xx_rate", "High API error rate", "critical", "5xx responses are at or above 5% of observed requests."),
    AlertRule("http_slow_rate", "High API latency", "warning", "At least 20% of observed requests took one second or longer."),
    AlertRule("rate_limited_requests", "Rate limiting activity", "warning", "Rate-limited requests are materially elevated."),
)


class MonitoringService:
    """Provider-neutral operational monitoring with safe, advisory alerts."""

    def evaluate(self, snapshot: dict[str, int] | None = None) -> list[dict[str, Any]]:
        m = snapshot or metrics_snapshot()
        total = int(m.get("requests_total", 0))
        errors = int(m.get("requests_5xx", 0))
        slow = int(m.get("requests_slow", 0))
        limited = int(m.get("requests_429", 0))
        alerts: list[dict[str, Any]] = []
        if total >= 20 and errors / total >= 0.05:
            alerts.append(self._alert(RULES[0], errors=errors, total=total, rate=round(errors / total * 100, 2)))
        if total >= 20 and slow / total >= 0.20:
            alerts.append(self._alert(RULES[1], slow=slow, total=total, rate=round(slow / total * 100, 2)))
        if total >= 50 and limited / total >= 0.10:
            alerts.append(self._alert(RULES[2], limited=limited, total=total, rate=round(limited / total * 100, 2)))
        return alerts

    @staticmethod
    def _alert(rule: AlertRule, **data: Any) -> dict[str, Any]:
        return {
            "rule": rule.key,
            "title": rule.title,
            "severity": rule.severity,
            "description": rule.description,
            "data": data,
            "observed_at": datetime.now(timezone.utc).isoformat(),
        }

    def dispatch(self, db, seller_account_id: int, user_id: int, alerts: list[dict[str, Any]]) -> list[Any]:
        service = NotificationService()
        sent = []
        for alert in alerts:
            sent.append(service.create_and_dispatch(
                db,
                seller_account_id,
                user_id,
                category="critical" if alert["severity"] == "critical" else "ai",
                severity=alert["severity"],
                title=alert["title"],
                message=alert["description"],
                data={"monitoring_rule": alert["rule"], **alert["data"]},
                channels=["in_app"],
            ))
        return sent
