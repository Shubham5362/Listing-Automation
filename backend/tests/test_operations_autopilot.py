from app.services.operations_autopilot import OperationsAutopilotService


def test_autopilot_build_queue_is_approval_gated(monkeypatch):
    service = object.__new__(OperationsAutopilotService)
    service.db = None
    service.user = None

    class Planner:
        def __init__(self, *args): pass
        def plan(self, **kwargs):
            return {
                "horizon": "daily", "period_start": None, "period_end": None,
                "business_health_score": 61,
                "actions": [
                    {"id": "A1", "priority": "critical", "area": "inventory", "action": "Replenish",
                     "why_now": "Low stock", "depends_on": [], "expected_impact": "Protect sales",
                     "approval_required": True, "status": "planned"},
                    {"id": "A2", "priority": "low", "area": "general", "action": "Review",
                     "why_now": "Review", "depends_on": [], "expected_impact": "Clarity",
                     "approval_required": True, "status": "planned"},
                ],
            }

    monkeypatch.setattr("app.services.operations_autopilot.StrategyActionPlannerService", Planner)
    result = service.build_queue()
    assert result["queue_count"] == 1
    assert result["approval_required_count"] == 1
    assert result["execution_enabled"] is False
    assert result["queue"][0]["execution_state"] == "awaiting_approval"
    assert result["queue"][0]["executed"] is False
