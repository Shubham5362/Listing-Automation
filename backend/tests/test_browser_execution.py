from app.services.browser_execution import _fingerprint,_selector
def test_fingerprint_is_deterministic():
    fields=[{"name":"title"},{"name":"brand"}]; assert _fingerprint(fields)==_fingerprint(list(reversed(fields)))
def test_selector_prefers_name():
    assert _selector({"name":"product_title"})==("name",'[name="product_title"]')
def test_selector_ignores_script():
    assert "alert" not in _selector({"canonical":"TITLE","script":"alert(1)"})[1]
