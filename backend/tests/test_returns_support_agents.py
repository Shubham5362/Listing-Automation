from app.agents.base import AgentTask
from app.agents.orchestrator import AgentOrchestrator
from app.services.returns_ai import ReturnsSupportAIService


def test_hindi_support_reply():
    r = ReturnsSupportAIService.analyze_support(
        "रिफंड", "मुझे रिफंड नहीं मिला और मैं नाराज़ हूं", customer_name="Ravi", language="hi"
    )
    assert r.category == "refund" and r.sentiment == "negative" and r.reply.startswith("नमस्ते Ravi,")


def test_hindi_refund_intent_beats_generic_delivery_phrase():
    r = ReturnsSupportAIService.analyze_support("रिफंड", "मुझे रिफंड नहीं मिला", language="hi")
    assert r.category == "refund"


def test_delivery_intent_still_uses_generic_hindi_delivery_phrase():
    r = ReturnsSupportAIService.analyze_support("ऑर्डर", "मुझे ऑर्डर नहीं मिला", language="hi")
    assert r.category == "delivery"


def test_return_agent_approval():
    r = AgentOrchestrator().execute(
        7,
        11,
        AgentTask(name="return", task="analyze", input={"reason": "counterfeit product"}, requires_approval=True),
    )
    assert r.output["category"] == "fraud_risk" and r.output["escalation"] == "manual_review" and r.requires_approval is True


def test_support_agent_triage():
    r = AgentOrchestrator().execute(
        7,
        11,
        AgentTask(
            name="customer_support",
            task="triage",
            input={"subject": "Refund missing", "message": "I am very angry about my refund", "tone": "concise"},
            requires_approval=True,
        ),
    )
    assert r.output["category"] == "refund" and r.output["priority"] == "urgent" and r.output["action"] == "escalate"
