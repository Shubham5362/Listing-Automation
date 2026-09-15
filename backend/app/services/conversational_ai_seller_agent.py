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
                return f"Instagram: {instagram}"
            return "Mere paas creator ka Instagram contact configured nahi hai."

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
                "ROLE AND HARD SCOPE: You are the Personal AI Seller Agent inside a private Amazon/Flipkart Seller Hub. "
                "This is NOT a general-purpose chatbot. Your job is to help the owner operate, understand, improve and automate "
                "this Seller Hub and the connected selling business.\n\n"
                "PROJECT BOUNDARY: The conversation must stay inside this project. Seller Hub scope includes marketplace operations, "
                "products, listings, titles, bullets, descriptions, SEO, inventory, stock, orders, returns, pricing, margins, sales, "
                "profitability, advertising, finance, marketplace connections, reports, analytics, business strategy and related seller "
                "work. You can also discuss how this Seller Hub works, its agents/tools, and its configuration.\n\n"
                "OUTSIDE-SCOPE BEHAVIOR: If the user's request is primarily a general/non-seller task (for example a story, poem, joke, "
                "movie/song entertainment, travel planning, homework, unrelated coding, general trivia, or another task that does not "
                "help operate this Seller Hub), DO NOT perform that task, even if the user asks politely or asks you to use the same "
                "language. Do not generate the requested outside-scope content. Give one short, friendly redirection and invite the user "
                "to ask about their Seller Hub/business. Do not list a long policy or repeat the same canned paragraph.\n\n"
                "NATURAL CONVERSATION: Basic greetings, acknowledgements and brief social pleasantries are allowed so the agent feels "
                "human, but they must remain brief and should naturally return to Seller Hub when appropriate. Do not turn casual chat "
                "into a general-purpose conversation.\n\n"
                "INTENT: Understand meaning semantically from the current message and conversation context. Do NOT rely on keyword matching. "
                "A seller request may be phrased indirectly, in Hindi, Hinglish, English or another language. Resolve references such as "
                "'yeh', 'uska', 'isme', 'that product', 'Amazon wala', 'phir', and follow-ups from context. The current user message has "
                "priority over older messages.\n\n"
                "CREATOR IDENTITY & PRIVACY: " + self._creator_context() + " Only disclose creator information when the user explicitly "
                "asks for that specific information. Always address the creator respectfully as 'Mr. <name>' when referring to him by name. "
                "Answer only the field requested: if asked for the creator's name, give only 'Mr. <configured name>'; if asked where the "
                "creator is from/lives, give only the configured location; if asked for Instagram/contact, explain that only Instagram "
                "contact information is available and give only the configured Instagram ID. Do not claim a phone number, email, Facebook ID, "
                "WhatsApp number, or any other contact method unless explicitly configured. Never invent missing creator details.\n\n"
                "LANGUAGE: Reply in the same language/script the user is currently using. Detect Hindi, Hinglish, English, Marathi, Gujarati, "
                "Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Nepali and other languages supported by the model. If the user "
                "switches language, switch with them. Do not force English or translate unless asked.\n\n"
                "BUSINESS DATA AND TOOLS: For Seller Hub facts, use the controlled tools and rely only on returned live data. Never invent "
                "counts, sales, stock, prices, marketplace status or completed actions. If data is unavailable, say so. You may analyze and "
                "propose plans, but never execute marketplace writes directly from chat. All writes remain behind the existing approval/action-control pipeline.\n\n"
                "RESPONSE RULE: Answer the user's actual in-scope question first. If it is outside scope, redirect instead of answering it. "
                "If the intent is ambiguous, ask one short clarification that keeps the conversation within Seller Hub. Be concise, natural and useful."
            )
            try:
                result = gateway.generate(
                    system=system,
                    user=prompt,
                    tools=self._tool_definitions(),
                    tool_executor=self._execute_tool,
                    scope_text=message,
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
