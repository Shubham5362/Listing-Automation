from app.services.marketplace_expansion import confidence_for_mapping, execution_guard


def test_exact_mapping_is_high_confidence():
    assert confidence_for_mapping("color_name", "color_name") == 1.0


def test_execution_guard_blocks_unsupported_capability():
    allowed, reason = execution_guard({"pricing": False}, "pricing:update", "low", 0.99, "auto")
    assert not allowed
    assert reason == "marketplace_capability_unsupported"


def test_execution_guard_blocks_high_risk():
    allowed, reason = execution_guard({"pricing": True}, "pricing:update", "high", 0.99, "auto")
    assert not allowed
    assert reason == "high_risk_requires_approval"


def test_execution_guard_requires_confidence_and_auto_mode():
    allowed, reason = execution_guard({"inventory": True}, "inventory:update", "low", 0.80, "auto")
    assert not allowed
    assert reason == "confidence_below_autonomous_threshold"

    allowed, reason = execution_guard({"inventory": True}, "inventory:update", "low", 0.95, "approval")
    assert not allowed
    assert reason == "autopilot_mode_requires_approval"


def test_execution_guard_allows_safe_auto_action():
    allowed, reason = execution_guard({"inventory": True}, "inventory:update", "low", 0.95, "auto")
    assert allowed
    assert reason == "approved"
