import json

from app.services.marketplace_change import _classify, _fingerprint


def schema(fields):
    return {"version": "1", "category": "generic", "fields": fields}


def field(name, canonical, field_type="string", required=False, enum=(), unit=None):
    return {"name": name, "canonical": canonical, "field_type": field_type, "required": required, "enum": list(enum), "unit": unit, "condition": None}


def test_detects_field_rename():
    old = schema([field("Colour", "COLOR")])
    new = schema([field("Primary Colour", "COLOR")])
    changes = _classify(old, new)
    assert any(c["change_type"] == "FIELD_RENAMED" for c in changes)
    assert any(c["canonical"] == "COLOR" for c in changes)


def test_detects_required_change():
    old = schema([field("Weight", "WEIGHT", required=False)])
    new = schema([field("Weight", "WEIGHT", required=True)])
    changes = _classify(old, new)
    assert changes[0]["change_type"] == "FIELD_REQUIRED_CHANGED"
    assert changes[0]["confidence"] == 99


def test_detects_enum_change():
    old = schema([field("Colour", "COLOR", enum=("Black", "Blue"))])
    new = schema([field("Colour", "COLOR", enum=("Black", "Navy"))])
    changes = _classify(old, new)
    assert changes[0]["change_type"] == "FIELD_OPTIONS_CHANGED"


def test_fingerprint_is_stable():
    value = schema([field("Brand", "BRAND")])
    assert _fingerprint(value) == _fingerprint(json.loads(json.dumps(value)))


def test_uncertain_rename_is_not_auto_adaptable():
    old = schema([field("Style", "STYLE")])
    new = schema([field("Pattern", "PATTERN")])
    changes = _classify(old, new)
    rename = next((c for c in changes if c["change_type"] == "FIELD_RENAMED"), None)
    if rename:
        assert rename["confidence"] < 90
