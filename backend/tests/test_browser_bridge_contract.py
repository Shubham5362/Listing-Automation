from app.services.browser_execution import _fingerprint, _selector

def test_server_fingerprint_is_stable_for_reordered_fields():
    a = [{"name": "title", "id": "a"}, {"name": "brand", "id": "b"}]
    assert _fingerprint(a) == _fingerprint(list(reversed(a)))

def test_selector_never_accepts_script_metadata():
    strategy, selector = _selector({"canonical": "TITLE", "script": "alert(1)"})
    assert strategy == "field"
    assert selector == "TITLE"
