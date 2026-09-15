from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import get_settings
from app.services.ai_guard import AIScopeGuard, FRIENDLY_SCOPE_MESSAGE


logger = logging.getLogger("seller_hub.llm")


@dataclass(frozen=True)
class LLMResult:
    text: str
    provider: str
    model: str
    tool_calls: list[dict[str, Any]]


class LLMUnavailable(RuntimeError):
    pass


class LLMGateway:
    """Provider-neutral cloud LLM gateway with Gemini primary and OpenRouter fallback.

    The scope/rate guard executes before any provider request so irrelevant requests
    consume zero LLM/API calls. Seller Hub business operations are not rate-limited here.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.scope_guard = AIScopeGuard(
            per_minute=self.settings.ai_requests_per_minute,
            per_hour=self.settings.ai_requests_per_hour,
            max_input_chars=self.settings.ai_max_input_chars,
        )

    @property
    def configured(self) -> bool:
        return bool(self.settings.gemini_api_key or self.settings.openrouter_api_key)

    def generate(
        self,
        *,
        system: str,
        user: str,
        tools: list[dict[str, Any]],
        tool_executor: Callable[[str, dict[str, Any]], dict[str, Any]],
    ) -> LLMResult:
        if not self.settings.ai_enabled:
            return LLMResult(
                text="😊 AI assistance abhi temporarily disabled hai. Aapka Seller Hub normal tarike se kaam karta rahega. ❤️",
                provider="local",
                model="guardrail",
                tool_calls=[],
            )

        if self.settings.ai_scope_guard_enabled:
            decision = self.scope_guard.check(user)
            if not decision.allowed:
                return LLMResult(
                    text=decision.message or FRIENDLY_SCOPE_MESSAGE,
                    provider="local",
                    model="scope-guard",
                    tool_calls=[],
                )

        errors: list[str] = []
        providers = ["openrouter", "gemini"] if self.settings.llm_primary_provider == "openrouter" else ["gemini", "openrouter"]
        for provider in providers:
            try:
                if provider == "gemini" and self.settings.gemini_api_key:
                    return self._gemini(system, user, tools, tool_executor)
                if provider == "openrouter" and self.settings.openrouter_api_key:
                    return self._openrouter(system, user, tools, tool_executor)
            except Exception as exc:
                safe_error = self._safe_error(exc)
                errors.append(f"{provider}: {safe_error}")
                logger.warning("LLM provider failed provider=%s model=%s error=%s", provider, self._provider_model(provider), safe_error)
        raise LLMUnavailable("; ".join(errors) or "No LLM provider is configured")

    def _provider_model(self, provider: str) -> str:
        if provider == "gemini":
            return self.settings.gemini_model
        return self.settings.openrouter_model

    @staticmethod
    def _safe_error(exc: Exception) -> str:
        """Return a useful provider error without ever exposing credentials."""
        text = str(exc).replace("\n", " ").strip()
        for marker in ("key=", "api_key=", "Authorization:", "x-goog-api-key:"):
            if marker.lower() in text.lower():
                return text.split(marker, 1)[0].strip() + "[redacted]"
        return text[:700]

    @staticmethod
    def _gemini_schema(schema: Any) -> Any:
        """Convert OpenAI/JSON-schema style types to Gemini REST Schema enum values."""
        if not isinstance(schema, dict):
            return schema
        normalized: dict[str, Any] = {}
        for key, value in schema.items():
            if key == "type" and isinstance(value, str):
                normalized[key] = value.upper()
            elif key == "properties" and isinstance(value, dict):
                normalized[key] = {name: LLMGateway._gemini_schema(item) for name, item in value.items()}
            elif key == "items":
                normalized[key] = LLMGateway._gemini_schema(value)
            elif key == "required" and isinstance(value, list):
                normalized[key] = value
            else:
                normalized[key] = value
        return normalized

    def _gemini_tools(self, tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
        declarations = []
        for tool in tools:
            declarations.append(
                {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": self._gemini_schema(tool.get("parameters") or {"type": "OBJECT", "properties": {}}),
                }
            )
        return [{"function_declarations": declarations}]

    def _gemini(
        self,
        system: str,
        user: str,
        tools: list[dict[str, Any]],
        executor: Callable[[str, dict[str, Any]], dict[str, Any]],
    ) -> LLMResult:
        models = [self.settings.gemini_model]
        fallback = self.settings.gemini_fallback_model.strip()
        if fallback and fallback != self.settings.gemini_model:
            models.append(fallback)

        errors: list[str] = []
        for model in models:
            try:
                return self._gemini_model(model, system, user, tools, executor)
            except Exception as exc:
                safe_error = self._safe_error(exc)
                errors.append(f"{model}: {safe_error}")
                logger.warning("Gemini model failed model=%s error=%s", model, safe_error)

        raise LLMUnavailable("Gemini models failed; " + "; ".join(errors))

    def _gemini_model(
        self,
        model: str,
        system: str,
        user: str,
        tools: list[dict[str, Any]],
        executor: Callable[[str, dict[str, Any]], dict[str, Any]],
    ) -> LLMResult:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        headers = {"x-goog-api-key": self.settings.gemini_api_key or ""}
        payload: dict[str, Any] = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": self.settings.llm_temperature,
                "maxOutputTokens": self.settings.llm_max_output_tokens,
            },
        }
        if tools:
            payload["tools"] = self._gemini_tools(tools)

        data = self._post_json_with_retry(endpoint, payload, timeout=self.settings.llm_timeout_seconds, headers=headers)
        parts = self._response_parts(data)
        calls = [p["functionCall"] for p in parts if isinstance(p.get("functionCall"), dict)]
        if len(calls) > self.settings.ai_max_tool_calls:
            raise LLMUnavailable(f"AI tool-call safety limit exceeded ({self.settings.ai_max_tool_calls})")

        if calls:
            tool_parts = []
            for call in calls:
                name = str(call.get("name", ""))
                args = call.get("args") or {}
                result = executor(name, args)
                tool_parts.append({"functionResponse": {"name": name, "response": {"result": result}}})

            followup = {
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [
                    {"role": "user", "parts": [{"text": user}]},
                    {"role": "model", "parts": parts},
                    {"role": "user", "parts": tool_parts},
                ],
                "generationConfig": {
                    "temperature": self.settings.llm_temperature,
                    "maxOutputTokens": self.settings.llm_max_output_tokens,
                },
            }
            if tools:
                followup["tools"] = self._gemini_tools(tools)
            data = self._post_json_with_retry(endpoint, followup, timeout=self.settings.llm_timeout_seconds, headers=headers)
            parts = self._response_parts(data)

        text = "\n".join(str(p.get("text", "")) for p in parts if p.get("text")).strip()
        if not text:
            raise LLMUnavailable("Gemini returned no text")
        return LLMResult(text=text, provider="gemini", model=model, tool_calls=calls)

    @staticmethod
    def _response_parts(data: dict[str, Any]) -> list[dict[str, Any]]:
        candidates = data.get("candidates") or []
        if not candidates:
            raise LLMUnavailable("Gemini returned no candidates")
        content = candidates[0].get("content") or {}
        return [part for part in (content.get("parts") or []) if isinstance(part, dict)]

    def _openrouter(
        self,
        system: str,
        user: str,
        tools: list[dict[str, Any]],
        executor: Callable[[str, dict[str, Any]], dict[str, Any]],
    ) -> LLMResult:
        openai_tools = [
            {"type": "function", "function": {"name": t["name"], "description": t["description"], "parameters": t["parameters"]}}
            for t in tools
        ]
        messages: list[dict[str, Any]] = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        payload: dict[str, Any] = {
            "model": self.settings.openrouter_model,
            "messages": messages,
            "temperature": self.settings.llm_temperature,
            "max_tokens": self.settings.llm_max_output_tokens,
        }
        if openai_tools:
            payload["tools"] = openai_tools
            payload["tool_choice"] = "auto"
        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key or ''}",
            "HTTP-Referer": self.settings.openrouter_http_referer,
            "X-Title": "Personal AI Seller Hub",
        }
        data = self._post_json("https://openrouter.ai/api/v1/chat/completions", payload, timeout=self.settings.llm_timeout_seconds, headers=headers)
        msg = data.get("choices", [{}])[0].get("message", {})
        calls = msg.get("tool_calls") or []
        if len(calls) > self.settings.ai_max_tool_calls:
            raise LLMUnavailable(f"AI tool-call safety limit exceeded ({self.settings.ai_max_tool_calls})")
        if calls:
            messages.append(msg)
            for call in calls:
                name = call.get("function", {}).get("name", "")
                raw = call.get("function", {}).get("arguments", "{}")
                args = json.loads(raw) if isinstance(raw, str) else (raw or {})
                result = executor(name, args)
                messages.append({"role": "tool", "tool_call_id": call.get("id"), "content": json.dumps(result, default=str)})
            data = self._post_json(
                "https://openrouter.ai/api/v1/chat/completions",
                {"model": self.settings.openrouter_model, "messages": messages, "temperature": self.settings.llm_temperature, "max_tokens": self.settings.llm_max_output_tokens},
                timeout=self.settings.llm_timeout_seconds,
                headers=headers,
            )
            msg = data.get("choices", [{}])[0].get("message", {})
        text = (msg.get("content") or "").strip()
        if not text:
            raise LLMUnavailable("OpenRouter returned no text")
        return LLMResult(text=text, provider="openrouter", model=self.settings.openrouter_model, tool_calls=calls)

    @staticmethod
    def _format_http_error(exc: HTTPError) -> str:
        try:
            detail = exc.read().decode("utf-8", errors="replace")
        except Exception:
            detail = ""
        return f"HTTP {exc.code}: {detail[:500]}".strip()

    def _post_json_with_retry(
        self,
        url: str,
        payload: dict[str, Any],
        *,
        timeout: float,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        attempts = max(1, self.settings.llm_retry_attempts)
        last_error: Exception | None = None
        for attempt in range(attempts):
            try:
                return self._post_json(url, payload, timeout=timeout, headers=headers)
            except HTTPError as exc:
                last_error = exc
                if exc.code not in {429, 500, 502, 503, 504} or attempt >= attempts - 1:
                    raise LLMUnavailable(self._format_http_error(exc)) from exc
                retry_after = exc.headers.get("Retry-After") if exc.headers else None
                try:
                    delay = float(retry_after) if retry_after else self.settings.llm_retry_backoff_seconds * (2**attempt)
                except (TypeError, ValueError):
                    delay = self.settings.llm_retry_backoff_seconds * (2**attempt)
                delay = min(max(delay, 0.5), 8.0)
                logger.info("Retrying transient LLM error status=%s attempt=%s/%s delay=%.1fs", exc.code, attempt + 1, attempts, delay)
                time.sleep(delay)
            except URLError as exc:
                last_error = exc
                if attempt >= attempts - 1:
                    raise LLMUnavailable(str(exc)) from exc
                delay = min(max(self.settings.llm_retry_backoff_seconds * (2**attempt), 0.5), 8.0)
                logger.info("Retrying transient LLM network error attempt=%s/%s delay=%.1fs", attempt + 1, attempts, delay)
                time.sleep(delay)
            except TimeoutError as exc:
                last_error = exc
                if attempt >= attempts - 1:
                    raise LLMUnavailable(str(exc)) from exc
                delay = min(max(self.settings.llm_retry_backoff_seconds * (2**attempt), 0.5), 8.0)
                logger.info("Retrying transient LLM timeout attempt=%s/%s delay=%.1fs", attempt + 1, attempts, delay)
                time.sleep(delay)
        if last_error:
            raise LLMUnavailable(str(last_error)) from last_error
        raise LLMUnavailable("LLM request failed")

    @staticmethod
    def _post_json(
        url: str,
        payload: dict[str, Any],
        *,
        timeout: float,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        req = Request(url, data=body, headers={"Content-Type": "application/json", **(headers or {})}, method="POST")
        with urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
