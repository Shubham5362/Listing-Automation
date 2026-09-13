from datetime import datetime, timedelta

from app.agents.base import AgentTask
from app.agents.orchestrator import AgentOrchestrator
from app.services.order_ops import OrderOpsService


def test_order_ops_flags_sla_breach():
    result = OrderOpsService.analyze(status="confirmed", ordered_at=datetime.utcnow() - timedelta(hours=30), ship_by_hours=24)
    assert result.sla_status == "breached"
    assert result.late_shipment_risk in {"high", "critical"}
    assert result.priority in {"high", "critical"}


def test_order_ops_flags_packed_without_tracking():
    result = OrderOpsService.analyze(status="packed", ordered_at=datetime.utcnow() - timedelta(hours=2), has_tracking=False)
    assert result.recommended_action.startswith("dispatch order")
    assert result.late_shipment_risk in {"high", "critical"}


def test_order_ops_detects_age_outlier():
    result = OrderOpsService.analyze(status="confirmed", ordered_at=datetime.utcnow() - timedelta(hours=20),
                                     historical_hours=[2, 3, 4, 3, 2])
    assert result.anomaly == "unusually_old_order"


def test_order_agent_uses_ops_intelligence():
    result = AgentOrchestrator().execute(7, 11, AgentTask(
        name="order", task="analyze order risk",
        input={"status": "confirmed", "ordered_at": datetime.utcnow() - timedelta(hours=25)}, requires_approval=True
    ))
    assert result.agent == "order"
    assert result.output["sla_status"] == "breached"
    assert result.requires_approval is True
