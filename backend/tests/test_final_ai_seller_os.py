from app.services.final_ai_seller_os import action_intent


def test_high_risk_requires_approval():
    result = action_intent(risk="high", confidence=0.99)
    assert result["decision"] == "approval_required"


def test_low_confidence_requires_approval():
    result = action_intent(risk="low", confidence=0.60)
    assert result["decision"] == "approval_required"


def test_safe_high_confidence_is_recommendation():
    result = action_intent(risk="low", confidence=0.95)
    assert result["decision"] == "recommend"


def test_explicit_approval_gate_wins():
    result = action_intent(risk="low", confidence=0.99, requires_approval=True)
    assert result["decision"] == "approval_required"
