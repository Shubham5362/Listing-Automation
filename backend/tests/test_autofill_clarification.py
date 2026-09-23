from app.services.autofill_clarification import _question_text


def test_missing_value_question_is_actionable():
    text = _question_text("VALUE_MISSING", {"label": "Item Package Weight", "unit": "g"}, "amazon")
    assert "Item Package Weight" in text
    assert "verified value" in text


def test_field_unclear_question_asks_for_mapping():
    text = _question_text("FIELD_UNCLEAR", {"label": "Manufacturer Part Number", "unit": None}, "amazon")
    assert "mapping" in text


def test_reason_codes_are_distinct():
    assert _question_text("VALUE_AMBIGUOUS", {"label": "Color"}, "flipkart") != _question_text("FORMAT_INVALID", {"label": "Color"}, "flipkart")
