from datetime import datetime

from pydantic import BaseModel, Field

from app.models.returns import CustomerIssuePriority, CustomerIssueStatus, ReturnResolution, ReturnStatus


class ReturnCreate(BaseModel):
    order_id: int = Field(gt=0)
    order_item_id: int | None = Field(default=None, gt=0)
    reason: str = Field(min_length=1, max_length=200)
    resolution: ReturnResolution = ReturnResolution.NONE
    customer_note: str | None = None
    refund_amount: float = Field(default=0, ge=0)


class ReturnRead(BaseModel):
    id: int
    seller_account_id: int
    order_id: int
    order_item_id: int | None
    external_return_id: str | None
    reason: str
    status: ReturnStatus
    resolution: ReturnResolution
    customer_note: str | None
    refund_amount: float
    replacement_order_id: int | None
    requested_at: datetime
    resolved_at: datetime | None


class ReturnStatusUpdate(BaseModel):
    status: ReturnStatus
    resolution: ReturnResolution | None = None
    refund_amount: float | None = Field(default=None, ge=0)
    replacement_order_id: int | None = Field(default=None, gt=0)


class CustomerIssueCreate(BaseModel):
    order_id: int | None = Field(default=None, gt=0)
    marketplace_account_id: int | None = Field(default=None, gt=0)
    customer_name: str | None = Field(default=None, max_length=200)
    customer_contact: str | None = Field(default=None, max_length=320)
    subject: str = Field(min_length=1, max_length=300)
    message: str = Field(min_length=1)
    priority: CustomerIssuePriority = CustomerIssuePriority.NORMAL


class CustomerIssueRead(BaseModel):
    id: int
    seller_account_id: int
    order_id: int | None
    marketplace_account_id: int | None
    customer_name: str | None
    customer_contact: str | None
    subject: str
    message: str
    status: CustomerIssueStatus
    priority: CustomerIssuePriority
    ai_reply_suggestion: str | None
    resolution_note: str | None
    escalated_at: datetime | None
    resolved_at: datetime | None


class CustomerIssueUpdate(BaseModel):
    status: CustomerIssueStatus | None = None
    priority: CustomerIssuePriority | None = None
    resolution_note: str | None = None


class AIReplyRequest(BaseModel):
    tone: str = Field(default="professional", pattern="^(professional|friendly|concise)$")
