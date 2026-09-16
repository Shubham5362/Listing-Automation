from app.services.ai_guard import AIScopeGuard


def test_small_configured_input_limit_is_honored() -> None:
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=20)
    assert guard.check("123456789012345678901").allowed is False
