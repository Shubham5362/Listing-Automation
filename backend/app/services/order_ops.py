from dataclasses import dataclass
from datetime import datetime, timedelta
from statistics import mean, pstdev

from app.models.orders import OrderStatus


@dataclass(frozen=True)
class OrderOpsResult:
    fulfillment_status: str
    sla_status: str
    late_shipment_risk: str
    cancellation_risk: str
    anomaly: str | None
    risk_score: float
    priority: str
    recommended_action: str
    reasons: list[str]


class OrderOpsService:
    """Provider-neutral order operations intelligence.

    SLA values are deliberately configurable at request time because marketplace
    promises vary by account, fulfillment program and shipping lane.
    """

    @staticmethod
    def analyze(*, status: str, ordered_at: datetime, now: datetime | None = None,
                ship_by_hours: int = 24, cancel_risk_hours: int = 12,
                historical_hours: list[float] | None = None,
                has_tracking: bool = False) -> OrderOpsResult:
        now = now or datetime.utcnow()
        age_hours = max(0.0, (now - ordered_at).total_seconds() / 3600)
        reasons: list[str] = []
        active = status not in {OrderStatus.CANCELLED.value, OrderStatus.RETURNED.value, OrderStatus.DELIVERED.value}

        if status == OrderStatus.PENDING.value:
            fulfillment = "awaiting_confirmation"
        elif status == OrderStatus.CONFIRMED.value:
            fulfillment = "confirmed"
        elif status == OrderStatus.PACKED.value:
            fulfillment = "ready_to_ship"
        elif status == OrderStatus.SHIPPED.value:
            fulfillment = "in_transit"
        elif status == OrderStatus.DELIVERED.value:
            fulfillment = "delivered"
        elif status == OrderStatus.CANCELLED.value:
            fulfillment = "cancelled"
        elif status == OrderStatus.RETURNED.value:
            fulfillment = "returned"
        else:
            fulfillment = "unknown"

        sla_ratio = age_hours / max(1, ship_by_hours)
        if active and status in {OrderStatus.PENDING.value, OrderStatus.CONFIRMED.value, OrderStatus.PACKED.value}:
            if age_hours >= ship_by_hours:
                sla_status = "breached"
                reasons.append("shipment SLA has been breached")
            elif sla_ratio >= 0.75:
                sla_status = "at_risk"
                reasons.append("shipment SLA is approaching")
            else:
                sla_status = "on_track"
        else:
            sla_status = "not_applicable"

        late_score = min(1.0, max(0.0, (sla_ratio - 0.5) / 0.5)) if active else 0.0
        cancel_score = 0.0
        if active and status in {OrderStatus.PENDING.value, OrderStatus.CONFIRMED.value}:
            cancel_score = min(1.0, age_hours / max(1, cancel_risk_hours))
            if cancel_score >= 0.75:
                reasons.append("unfulfilled order is entering the cancellation-risk window")

        anomaly = None
        if historical_hours and len(historical_hours) >= 3 and age_hours > mean(historical_hours) + 2 * pstdev(historical_hours):
            anomaly = "unusually_old_order"
            reasons.append("order age is an outlier versus the supplied historical baseline")

        if status == OrderStatus.PACKED.value and not has_tracking:
            reasons.append("packed order has no tracking number")
            late_score = max(late_score, 0.65)

        risk_score = round(min(1.0, max(late_score, cancel_score, 0.8 if anomaly else 0.0)), 3)
        if risk_score >= 0.8:
            priority = "critical"
        elif risk_score >= 0.5:
            priority = "high"
        elif risk_score >= 0.25:
            priority = "medium"
        else:
            priority = "low"

        if sla_status == "breached":
            action = "expedite fulfillment and review carrier/SLA exception"
        elif status == OrderStatus.PACKED.value and not has_tracking:
            action = "dispatch order and attach tracking immediately"
        elif cancellation_risk := (cancel_score >= 0.75):
            action = "prioritize fulfillment before cancellation risk increases"
        elif anomaly:
            action = "review order and fulfillment exception"
        elif sla_status == "at_risk":
            action = "prioritize order for same-day fulfillment"
        else:
            action = "no immediate intervention required"

        return OrderOpsResult(fulfillment, sla_status, _risk_label(late_score), _risk_label(cancel_score), anomaly,
                              risk_score, priority, action, reasons)


def _risk_label(score: float) -> str:
    if score >= 0.8:
        return "critical"
    if score >= 0.5:
        return "high"
    if score >= 0.25:
        return "medium"
    return "low"
