from app.services.autofill import _confidence_for


def test_verified_fact_gets_high_confidence():
    fact = {"value": "Cotton", "confidence": 0.72, "status": "verified"}
    assert _confidence_for({}, fact, strict=False) == 95


def test_inferred_fact_is_not_treated_as_verified():
    fact = {"value": "Cotton", "confidence": 0.99, "status": "inferred"}
    assert _confidence_for({}, fact, strict=False) == 84


def test_strict_mode_blocks_non_verified_fact():
    fact = {"value": "Cotton", "confidence": 0.99, "status": "inferred"}
    assert _confidence_for({}, fact, strict=True) == 0


def test_unknown_fact_never_gets_auto_confidence():
    fact = {"value": "Cotton", "confidence": 0.99, "status": "unknown"}
    assert _confidence_for({}, fact, strict=False) == 69
