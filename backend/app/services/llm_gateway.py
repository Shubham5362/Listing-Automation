from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import get_settings


@dataclass(frozen=True)
class LLMResult:
    text: str
    provider: str
    model: str
    tool_calls: list[dict[str, Any]]


class LLMUnavailable(RuntimeError):
    pass


class LLMGateway:
    """Provider-neutral cloud LLM gateway with Gemini primary and OpenRouter fallback."""

    def __init__(self) -> None:
        self.settings = get_settings()

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
        errors: list[str] = []
        providers = ["openrouter", "gemini"] if self.settings.llm_primary_provider == "openrouter" else ["gemini", "openrouter"]
        for provider in providers:
            try:
                if provider == "gemini" and self.settings.gemini_api_key:
                    return self._gemini(system, user, tools, tool_executor)
                if provider == "openrouter" and self.settings.openrouter_api_key:
                    return self._openrouter(system, user, tools, tool_executor)
            except Exception as exc:
                errors.append(f"{provider}: {exc}")
        raise LLMUnavailable("; ".join(errors) or "No LLM provider is configured")

    def _gemini(
        self,
        system: str,
        user: str,
        tools: list[dict[str, Any]],
        executor: Callable[[str, dict[str, Any]], dict[str, Any]],
    ) -> LLMResult:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.gemini_model}:generateContent"
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
            payload["tools"] = [{"function_declarations": tools}]

        data = self._post_json(endpoint, payload, timeout=self.settings.llm_timeout_seconds, headers=headers)
        parts = self._response_parts(data)
        calls = [p["functionCall"] for p in parts if isinstance(p.get("functionCall"), dict)]

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
                followup["tools"] = [{"function_declarations": tools}]
            data = self._post_json(endpoint, followup, timeout=self.settings.llm_timeout_seconds, headers=headers)
            parts = self._response_parts(data)

        text = "\n".join(str(p.get("text", "")) for p in parts if p.get("text")).strip()
        if not text:
            raise LLMUnavailable("Gemini returned no text")
        return LLMResult(text=text, provider="gemini", model=self.settings.gemini_model, tool_calls=calls)

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
    def _post_json(
        url: str,
        payload: dict[str, Any],
        *,
        timeout: float,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        req = Request(url, data=body, headers={"Content-Type": "application/json", **(headers or {})}, method="POST")
        try:
            with urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            try:
                detail = exc.read().decode("utf-8", errors="replace")
            except Exception:
                detail = ""
            raise LLMUnavailable(f"HTTP {exc.code}: {detail[:500]}") from exc
        except (URLError, TimeoutError) as exc:
            raise LLMUnavailable(str(exc)) from exc
