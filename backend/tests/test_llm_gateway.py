from types import SimpleNamespace

from app.services.llm_gateway import LLMGateway, LLMResult


def _settings(**overrides):
    values = {
        "ai_enabled": True,
        "ai_scope_guard_enabled": True,
        "ai_requests_per_minute": 10,
        "ai_requests_per_hour": 50,
        "ai_max_input_chars": 4000,
        "ai_max_tool_calls": 3,
        "gemini_api_key": None,
        "gemini_model": "gemini-3.6-flash",
        "gemini_fallback_model": "gemini-3.5-flash-lite",
        "openrouter_api_key": None,
        "openrouter_model": "openrouter/free",
        "openrouter_http_referer": "https://example.com",
        "llm_primary_provider": "gemini",
        "llm_timeout_seconds": 30.0,
        "llm_temperature": 0.2,
        "llm_max_output_tokens": 1200,
        "llm_retry_attempts": 1,
        "llm_retry_backoff_seconds": 0.1,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_gemini_is_primary_when_both_providers_are_configured(monkeypatch):
    import app.services.llm_gateway as module

    monkeypatch.setattr(module, "get_settings", lambda: _settings(
        gemini_api_key="gemini-test-key",
        openrouter_api_key="openrouter-test-key",
        llm_primary_provider="gemini",
    ))
    gateway = LLMGateway()
    calls = []

    def gemini(*args, **kwargs):
        calls.append("gemini")
        return LLMResult("gemini response", "gemini", "gemini-3.6-flash", [])

    def openrouter(*args, **kwargs):
        calls.append("openrouter")
        return LLMResult("openrouter response", "openrouter", "openrouter/free", [])

    monkeypatch.setattr(gateway, "_gemini", gemini)
    monkeypatch.setattr(gateway, "_openrouter", openrouter)

    result = gateway.generate(
        system="seller agent",
        user="check my inventory",
        tools=[],
        tool_executor=lambda name, args: {},
        scope_text="check my inventory",
    )

    assert result.provider == "gemini"
    assert calls == ["gemini"]


def test_openrouter_is_used_when_gemini_fails(monkeypatch):
    import app.services.llm_gateway as module

    monkeypatch.setattr(module, "get_settings", lambda: _settings(
        gemini_api_key="gemini-test-key",
        openrouter_api_key="openrouter-test-key",
        llm_primary_provider="gemini",
    ))
    gateway = LLMGateway()
    calls = []

    def gemini(*args, **kwargs):
        calls.append("gemini")
        raise RuntimeError("temporary Gemini failure")

    def openrouter(*args, **kwargs):
        calls.append("openrouter")
        return LLMResult("fallback response", "openrouter", "openrouter/free", [])

    monkeypatch.setattr(gateway, "_gemini", gemini)
    monkeypatch.setattr(gateway, "_openrouter", openrouter)

    result = gateway.generate(
        system="seller agent",
        user="check my inventory",
        tools=[],
        tool_executor=lambda name, args: {},
        scope_text="check my inventory",
    )

    assert result.provider == "openrouter"
    assert calls == ["gemini", "openrouter"]


def test_gemini_tool_schema_uses_uppercase_types():
    schema = {
        "type": "object",
        "properties": {
            "limit": {"type": "integer"},
            "payload": {
                "type": "object",
                "properties": {"sku": {"type": "string"}},
            },
        },
    }

    converted = LLMGateway._gemini_schema(schema)

    assert converted["type"] == "OBJECT"
    assert converted["properties"]["limit"]["type"] == "INTEGER"
    assert converted["properties"]["payload"]["type"] == "OBJECT"
    assert converted["properties"]["payload"]["properties"]["sku"]["type"] == "STRING"
