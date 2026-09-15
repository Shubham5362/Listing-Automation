from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from threading import Lock
import time
import unicodedata


FRIENDLY_SCOPE_MESSAGE = (
    "😊 Main aapke Seller Hub ka AI Seller Agent hoon, isliye mera focus aapke business aur "
    "selling operations ko manage karne mein help karna hai. Is wajah se main general "
    "entertainment ya unrelated kaam mein help nahi kar paunga. ❤️\n\n"
    "Lekin main products, listings, pricing, orders, inventory, sales, advertising, "
    "returns, finance ya Amazon/Flipkart se related kaam mein turant help kar sakta hoon."
)

SELLER_TERMS = (
    "seller", "selling", "amazon", "flipkart", "marketplace", "product", "products", "listing", "listings", "title", "bullet", "description", "sku", "asin", "inventory", "stock", "reorder", "order", "orders", "return", "returns", "refund", "customer", "sales", "sale", "revenue", "profit", "margin", "pricing", "price", "reprice", "buy box", "buybox", "advertising", "ads", "campaign", "acos", "roas", "settlement", "fee", "fees", "expense", "gst", "catalog", "catalogue", "business", "dashboard", "analytics", "report", "reports", "performance", "supplier", "shipping", "fulfilment", "fulfillment", "dispatch", "cancel", "cancellation", "customer support", "compliance", "लिस्टिंग", "प्रोडक्ट", "उत्पाद", "स्टॉक", "इन्वेंटरी", "ऑर्डर", "रिटर्न", "रिफंड", "बिक्री", "सेल्स", "कमाई", "राजस्व", "मुनाफा", "कीमत", "प्राइस", "विज्ञापन", "कैंपेन", "ग्राहक", "कस्टमर", "बिजनेस", "व्यापार", "अमेज़न", "फ्लिपकार्ट",
)

SELLER_ACTION_TERMS = (
    "optimize", "optimise", "analyze", "analyse", "improve", "create listing", "write title", "write description", "rewrite listing", "generate listing", "reprice", "forecast sales", "find low stock", "check orders", "check inventory", "check sales", "check returns", "listing optimize", "listing optimisation", "लिस्टिंग बनाओ", "टाइटल बनाओ", "डिस्क्रिप्शन बनाओ", "प्रोडक्ट का", "उत्पाद का", "स्टॉक बताओ", "ऑर्डर बताओ", "बिक्री बताओ",
)

OUT_OF_SCOPE_TERMS = (
    "love story", "romantic story", "poem", "poetry", "shayari", "joke", "movie", "song lyrics", "gaming", "game cheat", "homework", "exam", "essay", "relationship advice", "dating advice", "travel itinerary", "recipe", "cook", "weather", "politics", "news", "general knowledge", "kahani", "कहानी", "कविता", "शायरी", "चुटकुला", "फिल्म", "गाना", "मौसम", "राजनीति",
)


@dataclass(frozen=True)
class GuardDecision:
    allowed: bool
    message: str = ""


class _RateWindow:
    def __init__(self) -> None:
        self._lock = Lock()
        self._events: deque[float] = deque()

    def allow(self, now: float, limit: int, window_seconds: int) -> bool:
        with self._lock:
            cutoff = now - window_seconds
            while self._events and self._events[0] <= cutoff:
                self._events.popleft()
            if len(self._events) >= limit:
                return False
            self._events.append(now)
            return True


class AIScopeGuard:
    """Cheap, provider-independent guard that runs before any paid LLM request."""

    def __init__(self, *, per_minute: int = 10, per_hour: int = 50, max_input_chars: int = 4000) -> None:
        self.per_minute = max(1, per_minute)
        self.per_hour = max(self.per_minute, per_hour)
        self.max_input_chars = max(256, max_input_chars)
        self._minute = _RateWindow()
        self._hour = _RateWindow()

    @staticmethod
    def _normalize(text: str) -> str:
        normalized = unicodedata.normalize("NFKC", text or "")
        marker = "current user message:\n"
        if marker in normalized.casefold():
            # The conversational agent embeds history before this marker. Scope
            # decisions must use only the current user message, never old context.
            idx = normalized.casefold().rfind(marker)
            normalized = normalized[idx + len(marker):]
        return " ".join(normalized.casefold().split())

    def check(self, user_text: str) -> GuardDecision:
        text = self._normalize(user_text or "")
        if not text:
            return GuardDecision(False, FRIENDLY_SCOPE_MESSAGE)
        if len(text) > self.max_input_chars:
            return GuardDecision(False, "😊 Message thoda bada hai. Seller-related kaam ko chhote parts mein bhejiye, taaki main aapko fast aur accurately help kar sakun. ❤️")
        in_scope = any(term in text for term in SELLER_TERMS) or any(term in text for term in SELLER_ACTION_TERMS)
        explicit_outside = any(term in text for term in OUT_OF_SCOPE_TERMS)
        if explicit_outside and not in_scope:
            return GuardDecision(False, FRIENDLY_SCOPE_MESSAGE)
        if not in_scope:
            return GuardDecision(False, FRIENDLY_SCOPE_MESSAGE)
        now = time.monotonic()
        if not self._minute.allow(now, self.per_minute, 60):
            return GuardDecision(False, "😊 AI requests thodi der ke liye limit par pahunch gayi hain. Seller Hub ke normal operations chalte rahenge; please thodi der baad AI analysis dobara try karein. ❤️")
        if not self._hour.allow(now, self.per_hour, 3600):
            return GuardDecision(False, "😊 Aaj ki tarah heavy AI usage ko control rakhne ke liye hourly AI limit temporarily reach ho gayi hai. Seller Hub ke orders, inventory aur baaki operations normal chalenge. ❤️")
        return GuardDecision(True)
