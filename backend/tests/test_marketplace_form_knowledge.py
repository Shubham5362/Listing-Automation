from app.services.marketplace_form_knowledge import _fingerprint, _schema_payload


class FakeField:
    name = "product_title"
    canonical = "TITLE"
    field_type = "string"
    required = True
    enum = ()
    unit = None
    condition = None


class FakeSchema:
    version = "1.0"
    category = "generic"
    fields = (FakeField(),)


def test_schema_payload_preserves_canonical_field_contract():
    payload = _schema_payload(FakeSchema())
    assert payload["category"] == "generic"
    assert payload["fields"][0]["name"] == "product_title"
    assert payload["fields"][0]["canonical"] == "TITLE"
    assert payload["fields"][0]["required"] is True


def test_schema_fingerprint_is_deterministic():
    payload = _schema_payload(FakeSchema())
    assert _fingerprint(payload) == _fingerprint(payload)
