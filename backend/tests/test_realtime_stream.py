from app.api.realtime import _event


def test_realtime_event_is_valid_sse():
    payload = _event("heartbeat", {"unread_count": 2})
    assert payload.startswith("event: heartbeat\n")
    assert 'data: {"unread_count":2}' in payload
    assert payload.endswith("\n\n")
