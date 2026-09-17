from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from threading import Lock
import re
import time
import unicodedata


FRIENDLY_SCOPE_MESSAGE = (
    "😊 Main AI Seller Agent hoon. Aap jo bhi baat poochhna chahte hain, context ke hisaab se "
    "main decide karunga ki Seller Hub mein kaise help kar sakta hoon. Agar request business "
    "ya selling se related hogi to main relevant data, tools aur recommendations use karunga. ❤️"
)

# Backwards-compatible names. These are intentionally empty: keywords no longer decide scope.
SELLER_TERMS = ()
SELLER_ACTION_TERMS = ()
OUT_OF_SCOPE_TERMS = ()

CASUAL_MESSAGES: dict[str, str] = {
    "hi": "Namaste 😊 Main yahin hoon. Batao, Seller Hub mein kya karna hai?",
    "hii": "Hii 😊 Main yahin hoon. Batao, Seller Hub mein kya karna hai?",
    "hello": "Hello 😊 Batao, Seller Hub mein kya karna hai?",
    "hey": "Hey 😊 Batao, kis kaam mein help chahiye?",
    "namaste": "Namaste 😊 Batao, kya karna hai?",
    "namaskar": "Namaskar 😊 Batao, kya karna hai?",
    "kaise ho": "Main badhiya hoon 😊 Aap batao, kya help chahiye?",
    "kese ho": "Main badhiya hoon 😊 Aap batao, kya help chahiye?",
    "how are you": "I am doing great 😊 Batao, kya help chahiye?",
    "good morning": "Good morning 😊 Aaj kya kaam karein?",
    "good afternoon": "Good afternoon 😊 Batao, kya karna hai?",
    "good evening": "Good evening 😊 Batao, kya dekhna hai?",
    "help": "Bilkul 😊 Batao kya kaam hai, main context ke hisaab se help karta hoon.",
    "help me": "Bilkul 😊 Batao kya problem ya kaam hai, main help karta hoon.",
}

CASUAL_VARIANTS = (
    r"^(hi+|hello+|hey+|namaste|namaskar)[!. ]*(bhai|bro|dost)?[!. ]*$",
    r"^(kaise|kese|kaisa|kesi) ho( bhai| bro| yaar| ji)?[!?., ]*$",
    r"^(how are you)( bhai| bro)?[!?., ]*$",
    r"^(good morning|good afternoon|good evening)( bhai| bro)?[!. ]*$",
    r"^(bhai|bro|dost|yaar)[!. ]*$",
    r"^(ok|okay|acha|achha|theek hai|thik hai|haan|han|yes|ji|hmm|hmmm|nice|great)[!. ]*$",
    r"^(thanks|thank you|shukriya|dhanyavaad)( bhai| bro)?[!. ]*$",
    r"^(bye|goodbye|see you|milte hain)( bhai| bro)?[!. ]*$",
    r"^(help|help me|madad|madad karo)[!. ]*$",
)

CASUAL_REPLY_VARIANTS = (
    "Haan bhai 😊 Main yahin hoon. Batao kya karna hai?",
    "Bilkul bhai 😊 Batao, kaunsa kaam dekhna hai?",
    "Haan, bolo 😊 Main help karta hoon.",
    "Main ready hoon bhai 😊 Jo kaam hai, batao.",
)


def normalize(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text or "").casefold().split()).strip()


def is_casual_message(text: str) -> bool:
    normalized = normalize(text)
    if normalized in CASUAL_MESSAGES:
        return True
    return any(re.fullmatch(pattern, normalized, flags=re.IGNORECASE) for pattern in CASUAL_VARIANTS)


def casual_reply(text: str) -> str:
    normalized = normalize(text).strip("!?., ")
    if normalized in CASUAL_MESSAGES:
        return CASUAL_MESSAGES[normalized]
    if is_casual_message(normalized):
        return CASUAL_REPLY_VARIANTS[sum(ord(ch) for ch in normalized) % len(CASUAL_REPLY_VARIANTS)]
    return ""


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
    """Provider-independent AI usage guard; never classifies semantic scope."""

    def __init__(self, *, per_minute: int = 10, per_hour: int = 50, max_input_chars: int = 4000) -> None:
        self.per_minute = max(1, per_minute)
        self.per_hour = max(self.per_minute, per_hour)
        # Respect the caller's configured limit, including small values used by
        # tests and policy-specific deployments. The previous 256-char floor
        # silently defeated the input-size guard for limits below 256.
        self.max_input_chars = max(1, max_input_chars)
        self._minute = _RateWindow()
        self._hour = _RateWindow()

    @staticmethod
    def _current_message(text: str) -> str:
        normalized = unicodedata.normalize("NFKC", text or "")
        marker = "current user message:"
        folded = normalized.casefold()
        if marker in folded:
            idx = folded.rfind(marker)
            normalized = normalized[idx + len(marker):]
        return normalized

    def check(self, user_text: str) -> GuardDecision:
        text = self._current_message(user_text)
        if not text.strip():
            return GuardDecision(False, "😊 Message khaali hai. Batao kya karna hai?")
        if len(text) > self.max_input_chars:
            return GuardDecision(False, "😊 Message thoda bada hai. Isse chhote parts mein bhejo, taaki main fast aur accurately help kar sakun. ❤️")
        now = time.monotonic()
        if not self._minute.allow(now, self.per_minute, 60):
            return GuardDecision(False, "😊 AI requests ki short-term limit reach ho gayi hai. Thodi der baad dobara try karo. Seller Hub ke normal operations chalte rahenge. ❤️")
        if not self._hour.allow(now, self.per_hour, 3600):
            return GuardDecision(False, "😊 AI usage ki hourly safety limit reach ho gayi hai. Seller Hub ke normal operations chalte rahenge. Thodi der baad AI analysis try karo. ❤️")
        return GuardDecision(True)
