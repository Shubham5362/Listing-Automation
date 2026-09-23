from app.services.master_listing import _field_payload


def test_taught_field_keeps_marketplace_and_canonical_identity():
    result = _field_payload({
        "marketplace_field": "item_package_weight",
        "label": "Item Package Weight",
        "canonical": "WEIGHT",
        "field_type": "number",
        "required": True,
        "unit": "g",
    })
    assert result["name"] == "item_package_weight"
    assert result["canonical"] == "WEIGHT"
    assert result["required"] is True
    assert result["unit"] == "g"


def test_unmapped_taught_field_remains_unresolved():
    result = _field_payload({"marketplace_field": "unknown_field", "label": "Unknown"})
    assert result["name"] == "unknown_field"
    assert result["canonical"] == ""
