from pydantic import BaseModel, Field

class ReturnAIRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=200)
    customer_note: str | None = None
    refund_amount: float = Field(default=0, ge=0)

class SupportAIRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=300)
    message: str = Field(min_length=1)
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    customer_name: str | None = Field(default=None, max_length=200)
    tone: str = Field(default="professional", pattern="^(professional|friendly|concise)$")
    language: str = Field(default="auto", pattern="^(auto|en|hi)$")

class ReturnAIRead(BaseModel):
    category: str
    risk: str
    escalation: str
    confidence: float
    reasons: list[str]

class SupportAIRead(BaseModel):
    category: str
    sentiment: str
    priority: str
    escalation: str
    confidence: float
    reasons: list[str]
    reply: str
