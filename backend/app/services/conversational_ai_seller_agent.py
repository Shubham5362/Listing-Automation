from __future__ import annotations

import json
import os
from typing import Any

from app.models.core import AuditLog
from app.services.llm_gateway import LLMGateway, LLMUnavailable
from app.services.personal_ai_seller_agent import PersonalAISellerAgentService


class ConversationalAISellerAgentService(PersonalAISellerAgentService):
    """Conversation-aware layer over the verified Seller Hub agent tools."""

    @staticmethod
    def _history_prompt(conversation: list[dict[str, str]], current: str) -> str:
        lines: list[str] = []
        for item in conversation[-12:]:
            role = item.get("role", "user")
            content = (item.get("content") or "").strip()
            if content:
                lines.append(f"{role}: {content[:2000]}")
        if lines:
            return "Conversation history (use only for continuity; current message has priority):\n" + "\n".join(lines) + f"\n\nCurrent user message:\n{current}"
        return current

    @staticmethod
    def _creator_context() -> str:
        """Build narrowly scoped creator facts from server-side configuration."""
        name = os.getenv("CREATOR_NAME", "").strip()
        location = os.getenv("CREATOR_LOCATION", "").strip()
        instagram = os.getenv("CREATOR_INSTAGRAM", "").strip()
        facts: list[str] = []
        if name:
            facts.append(f"creator name: Mr. {name}")
        if location:
            facts.append(f"creator location: {location}")
        if instagram:
            facts.append(f"creator Instagram: {instagram}")
        if not facts:
            return "No creator identity details are configured. Do not invent them."
        return "Creator facts (private runtime configuration): " + "; ".join(facts)

    @staticmethod
    def _creator_reply(message: str) -> str | None:
        """Return a deterministic, field-scoped creator answer for simple identity questions."""
        text = message.casefold().strip()
        name_terms = ("naam", "name", "who made", "who created", "creator ka naam", "banaya")
        location_terms = ("kahan", "kaha", "where", "rehta", "rehte", "belongs", "from")
        instagram_terms = ("instagram", "insta", "contact", "social id", "social media")

        name = os.getenv("CREATOR_NAME", "").strip()
        location = os.getenv("CREATOR_LOCATION", "").strip()
        instagram = os.getenv("CREATOR_INSTAGRAM", "").strip()

        if any(term in text for term in instagram_terms):
            if instagram:
                return f"Mr. {name} ka Instagram: {instagram}" if name else f"Mr. {instagram}"
            return "Mere paas creator ka sirf Instagram contact configured hai, lekin Instagram ID abhi configured nahi hai."

        if any(term in text for term in location_terms) and ("creator" in text or "owner" in text or "shubham" in text or "uska" in text):
            return f"Mr. {name} Mandla, Madhya Pradesh 481661 se hain." if name and location else None

        if any(term in text for term in name_terms) and ("creator" in text or "owner" in text or "kisne" in text or "banaya" in text):
            return f"Mr. {name}" if name else None

        return None

    def chat(self, message: str, create_plan: bool = False, conversation: list[dict[str, str]] | None = None) -> dict[str, Any]:
        message = message.strip()
        if not message:
            raise ValueError("message cannot be empty")
        gateway = LLMGateway()
        intent = self._infer_intent(message)
        answer: str | None = None
        provider = "deterministic"
        model = None
        tool_calls: list[dict[str, Any]] = []
        fallback_reason = None
        prompt = self._history_prompt(conversation or [], message)

        if gateway.configured:
            system = (
                "You are the Personal AI Seller Agent for a single-user Amazon/Flipkart Seller Hub. "
                "You are a real conversational assistant, not a scripted FAQ. Understand the user's meaning "
                "from context and handle greetings, casual chat, explanations, business analysis, follow-up questions "
                "and action requests naturally.\n\n"
                "CREATOR IDENTITY & PRIVACY: " + self._creator_context() + " Only disclose creator information "
                "when the user explicitly asks for that specific information. Always address the creator respectfully "
                "as 'Mr. <name>' when referring to him by name. Answer only the field requested: if asked for the creator's "
                "name, give only 'Mr. <configured name>'; if asked where the creator is from/lives, give only the configured "
                "location; if asked for Instagram/contact, explain that only Instagram contact information is available "
                "and give only the configured Instagram ID. Do not claim a phone number, email, Facebook ID, WhatsApp number, "
                "or any other contact method unless it is explicitly configured. Never volunteer, combine, or infer other "
                "personal details unless the user explicitly asks for them. Never invent missing creator details.\n\n"
                "LANGUAGE: Reply in the same language/script the user is currently using. Detect Hindi, Hinglish, "
                "English, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Nepali "
                "and other languages supported by the model. If the user switches language, switch with them. "
                "Do not force English. Do not translate unless asked.\n\n"
                "CONTEXT: Resolve references such as 'yeh', 'uska', 'isme', 'that product', 'Amazon wala', "
                "'phir', and follow-up questions using the supplied conversation history. Never repeat a canned answer "
                "when the user is asking something different.\n\n"
                "BUSINESS: For Seller Hub facts, use the controlled tools and rely only on returned live data. "
                "Never invent counts, sales, stock, prices, marketplace status or actions. If data is unavailable, say so. "
                "You may analyze and propose plans, but never execute marketplace writes directly from chat. "
                "All writes remain behind the existing approval/action-control pipeline.\n\n"
                "STYLE: Be concise but conversational. Answer the actual question first. Ask a short clarification only "
                "when necessary to avoid a wrong action."
            )
            try:
                result = gateway.generate(
                    system=system,
                    user=prompt,
                    tools=self._tool_definitions(),
                    tool_executor=self._execute_tool,
                )
                answer, provider, model, tool_calls = result.text, result.provider, result.model, result.tool_calls
            except LLMUnavailable as exc:
                fallback_reason = str(exc)[:1200]

        if answer is None:
            answer = self._creator_reply(message)
            if answer is None:
                if self._is_casual(message):
                    answer = "Main badhiya hoon 😊 Aap batao, Seller Hub mein kis kaam mein help chahiye?"
                else:
                    if intent == "inventory":
                        focus = self.inventory_issues(10)
                    elif intent == "advertising":
                        focus = self.advertising_issues(10)
                    elif intent == "pricing":
                        focus = self.pricing_opportunities(10)
                    else:
                        focus = self.recommendations(10)
                    answer = self._answer(intent, focus)

        response = {
            "agent": "personal_ai_seller_agent",
            "message": message,
            "answer": answer,
            "intent": intent,
            "provider": provider,
            "model": model,
            "fallback_reason": fallback_reason,
            "tool_calls": [{"name": c.get("name") or c.get("function", {}).get("name")} for c in tool_calls],
            "plan_requested": create_plan,
            "created_actions": [],
            "approval_required": True,
            "execution": "No marketplace write is executed from chat; approved writes use the existing Action Control pipeline.",
        }
        self.db.add(
            AuditLog(
                action="ai_agent.chat",
                resource_type="ai_agent",
                resource_id=None,
                details=json.dumps(
                    {
                        "message": message,
                        "answer": answer,
                        "provider": provider,
                        "model": model,
                        "intent": intent,
                        "tool_calls": response["tool_calls"],
                        "plan": create_plan,
                        "fallback_reason": fallback_reason,
                    },
                    separators=(",", ":"),
                    ensure_ascii=False,
                ),
            )
        )
        self.db.commit()
        return response
