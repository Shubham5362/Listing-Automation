from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Callable
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

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
    """Small provider-neutral gateway for Gemini with OpenRouter fallback."""

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
        providers = []
        if self.settings.llm_primary_provider == "openrouter":
            providers = ["openrouter", "gemini"]
        else:
            providers = ["gemini", "openrouter"]
        for provider in providers:
            try:
                if provider == "gemini" and self.settings.gemini_api_key:
                    return self._gemini(system, user, tools, tool_executor)
                if provider == "openrouter" and self.settings.openrouter_api_key:
                    return self._openrouter(system, user, tools, tool_executor)
            except Exception as exc:  # provider fallback is deliberately broad
                errors.append(f"{provider}: {exc}")
        raise LLMUnavailable("; ".join(errors) or "No LLM provider is configured")

    def _gemini(self, system: str, user: str, tools: list[dict[str, Any]], executor: Callable[[str, dict[str, Any]], dict[str, Any]]) -> LLMResult:
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "tools": [{"function_declarations": tools}],
            "generationConfig": {"temperature": self.settings.llm_temperature, "maxOutputTokens": self.settings.llm_max_output_tokens},
        }
        data = self._post_json(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.gemini_model}:generateContent?key={self.settings.gemini_api_key}",
            payload,
            timeout=self.settings.llm_timeout_seconds,
        )
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        calls = [p.get("functionCall") for p in parts if p.get("functionCall")]
        if calls:
            tool_parts = []
            for call in calls:
                name = call.get("name", "")
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
                "generationConfig": {"temperature": self.settings.llm_temperature, "maxOutputTokens": self.settings.llm_max_output_tokens},
            }
            data = self._post_json(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.gemini_model}:generateContent?key={self.settings.gemini_api_key}",
                followup,
                timeout=self.settings.llm_timeout_seconds,
            )
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        text = "\n".join(p.get("text", "") for p in parts if p.get("text")).strip()
        if not text:
            raise LLMUnavailable("Gemini returned no text")
        return LLMResult(text=text, provider="gemini", model=self.settings.gemini_model, tool_calls=calls)

    def _openrouter(self, system: str, user: str, tools: list[dict[str, Any]], executor: Callable[[str, dict[str, Any]], dict[str, Any]]) -> LLMResult:
        openai_tools = [{"type": "function", "function": {"name": t["name"], "description": t["description"], "parameters": t["parameters"]}} for t in tools]
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        data = self._post_json("https://openrouter.ai/api/v1/chat/completions", {"model": self.settings.openrouter_model, "messages": messages, "tools": openai_tools, "tool_choice": "auto", "temperature": self.settings.llm_temperature, "max_tokens": self.settings.llm_max_output_tokens}, timeout=self.settings.llm_timeout_seconds, headers={"Authorization": f"Bearer {self.settings.openrouter_api_key}", "HTTP-Referer": self.settings.openrouter_http_referer, "X-Title": "Personal AI Seller Hub"})
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
            data = self._post_json("https://openrouter.ai/api/v1/chat/completions", {"model": self.settings.openrouter_model, "messages": messages, "temperature": self.settings.llm_temperature, "max_tokens": self.settings.llm_max_output_tokens}, timeout=self.settings.llm_timeout_seconds, headers={"Authorization": f"Bearer {self.settings.openrouter_api_key}", "HTTP-Referer": self.settings.openrouter_http_referer, "X-Title": "Personal AI Seller Hub"})
            msg = data.get("choices", [{}])[0].get("message", {})
        text = (msg.get("content") or "").strip()
        if not text:
            raise LLMUnavailable("OpenRouter returned no text")
        return LLMResult(text=text, provider="openrouter", model=self.settings.openrouter_model, tool_calls=calls)

    @staticmethod
    def _post_json(url: str, payload: dict[str, Any], *, timeout: float, headers: dict[str, str] | None = None) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        req = Request(url, data=body, headers={"Content-Type": "application/json", **(headers or {})}, method="POST")
        try:
            with urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError) as exc:
            raise LLMUnavailable(str(exc)) from exc
