from app.services.product_knowledge import canonical_attribute, detect_contradictions


def test_canonical_attribute_supports_marketplace_synonyms():
    assert canonical_attribute("colour") == "COLOR"
    assert canonical_attribute("manufacturer") == "BRAND"
    assert canonical_attribute("product description") == "DESCRIPTION"
    assert canonical_attribute("maximum retail price") == "MRP"


def test_verified_fact_conflict_is_explicit():
    facts = {"COLOR": {"value": "Black", "source": "product.attributes_json:Colour", "confidence": 1.0, "status": "verified"}}
    conflicts = detect_contradictions(facts, {"colour": "Blue"})
    assert conflicts[0]["attribute"] == "COLOR"
    assert conflicts[0]["requires_review"] is True


def test_same_value_does_not_create_conflict():
    facts = {"BRAND": {"value": "Acme", "source": "product.brand", "confidence": 1.0, "status": "verified"}}
    assert detect_contradictions(facts, {"manufacturer": " acme "}) == []
