from app.agents.base import AgentTask
from app.agents.orchestrator import AgentOrchestrator
from app.services.returns_ai import ReturnsSupportAIService

def test_hindi_support_reply():
    r=ReturnsSupportAIService.analyze_support("रिफंड","मुझे रिफंड नहीं मिला और मैं नाराज़ हूं",customer_name="Ravi",language="hi")
    assert r.category=="refund" and r.sentiment=="negative" and r.reply.startswith("नमस्ते Ravi,")

def test_return_agent_approval():
    r=AgentOrchestrator().execute(7,11,AgentTask(name="return",task="analyze",input={"reason":"counterfeit product"},requires_approval=True))
    assert r.output["category"]=="fraud_risk" and r.output["escalation"]=="manual_review" and r.requires_approval is True

def test_support_agent_triage():
    r=AgentOrchestrator().execute(7,11,AgentTask(name="customer_support",task="triage",input={"subject":"Refund missing","message":"I am very angry about my refund","tone":"concise"},requires_approval=True))
    assert r.output["category"]=="refund" and r.output["priority"]=="urgent" and r.output["action"]=="escalate"
