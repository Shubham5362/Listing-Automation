from dataclasses import dataclass
import re

@dataclass(frozen=True)
class ReturnIntelligence:
    category: str
    risk: str
    escalation: str
    confidence: float
    reasons: list[str]

@dataclass(frozen=True)
class SupportIntelligence:
    category: str
    sentiment: str
    priority: str
    escalation: str
    confidence: float
    reasons: list[str]
    reply: str

class ReturnsSupportAIService:
    """Deterministic, provider-neutral intelligence; recommendations are advisory."""
    @staticmethod
    def analyze_return(reason: str, customer_note: str | None = None, refund_amount: float = 0) -> ReturnIntelligence:
        text = f"{reason} {customer_note or ''}".lower()
        rules = {
            "damage": ("damaged", "broken", "crack", "damage", "टूटा", "खराब", "क्षतिग्रस्त"),
            "wrong_item": ("wrong item", "different product", "incorrect item", "गलत सामान", "गलत प्रोडक्ट"),
            "missing_item": ("missing", "not received", "shortage", "सामान नहीं मिला", "गायब"),
            "quality": ("quality", "defect", "defective", "poor", "गुणवत्ता", "दोषपूर्ण"),
            "buyer_remorse": ("changed mind", "dont want", "do not want", "ordered by mistake", "मन बदल गया", "गलती से ऑर्डर"),
            "fraud_risk": ("fraud", "fake", "counterfeit", "tampered", "धोखा", "नकली", "छेड़छाड़"),
        }
        category = next((name for name, needles in rules.items() if any(n in text for n in needles)), "other")
        risk = "high" if category in {"fraud_risk", "damage", "missing_item"} else "medium" if category in {"wrong_item", "quality"} else "low"
        reasons = [f"return classified as {category}"]
        if refund_amount >= 10000:
            risk = "high"; reasons.append("refund amount exceeds high-value review threshold")
        return ReturnIntelligence(category, risk, "manual_review" if risk == "high" else "standard_review", 0.9 if category != "other" else 0.55, reasons)

    @staticmethod
    def analyze_support(subject: str, message: str, priority: str = "normal", customer_name: str | None = None, tone: str = "professional", language: str = "auto") -> SupportIntelligence:
        text = f"{subject} {message}".lower()
        rules = {
            "delivery": ("delivery", "late", "not delivered", "shipping", "डिलीवरी", "देर", "नहीं मिला"),
            "refund": ("refund", "money back", "refund not received", "रिफंड", "पैसे वापस"),
            "return": ("return", "replace", "replacement", "रिटर्न", "बदलना"),
            "damaged_product": ("damaged", "broken", "defective", "टूटा", "खराब", "दोषपूर्ण"),
            "billing": ("charged", "payment", "invoice", "billing", "भुगतान", "बिल"),
            "complaint": ("complaint", "unhappy", "terrible", "worst", "शिकायत", "नाराज़", "बहुत खराब"),
        }
        category = next((name for name, needles in rules.items() if any(n in text for n in needles)), "general")
        negative = any(w in text for w in ("angry", "bad", "terrible", "worst", "fraud", "scam", "unhappy", "disappointed", "नाराज़", "गुस्सा", "खराब", "धोखा"))
        positive = any(w in text for w in ("thanks", "thank you", "great", "happy", "धन्यवाद", "शुक्रिया"))
        sentiment = "negative" if negative else "positive" if positive else "neutral"
        effective_priority = "urgent" if sentiment == "negative" and category in {"complaint", "damaged_product", "refund"} else priority
        escalation = "immediate" if effective_priority == "urgent" else "manual_review" if category in {"refund", "billing"} else "standard"
        is_hindi = bool(re.search(r"[\u0900-\u097F]", text))
        lang = "hi" if language == "auto" and is_hindi else "en" if language == "auto" else language
        greeting = f"नमस्ते {customer_name}, " if lang == "hi" and customer_name else "नमस्ते, " if lang == "hi" else f"Hi {customer_name}, " if customer_name else "Hello, "
        if lang == "hi":
            reply = greeting + ("संपर्क करने के लिए धन्यवाद। हम आपकी चिंता समझते हैं और इसे जल्द से जल्द हल करने में आपकी सहायता करेंगे." if tone == "friendly" else "संपर्क करने के लिए धन्यवाद। हम आपके अनुरोध की समीक्षा कर रहे हैं और जल्द अपडेट देंगे." if tone == "concise" else "संपर्क करने के लिए धन्यवाद। हम आपकी समस्या को समझते हैं और विवरण की समीक्षा कर रहे हैं। हम अगले चरणों में आपकी सहायता करेंगे।")
        else:
            reply = greeting + ("thank you for reaching out. We understand your concern and will help resolve it as quickly as possible." if tone == "friendly" else "thank you for contacting us. We’re reviewing your request and will update you shortly." if tone == "concise" else "thank you for contacting us. We understand your concern and are reviewing the details. We’ll assist you with the next steps as soon as possible.")
        return SupportIntelligence(category, sentiment, effective_priority, escalation, 0.88 if category != "general" else 0.6, [f"issue classified as {category}", f"sentiment is {sentiment}"], reply)
