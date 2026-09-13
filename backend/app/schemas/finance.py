from datetime import datetime

from pydantic import BaseModel, Field

from app.models.finance import FinanceEntryType, SettlementStatus


class FinanceEntryCreate(BaseModel):
    marketplace_account_id: int | None = Field(default=None, gt=0)
    order_id: int | None = Field(default=None, gt=0)
    product_id: int | None = Field(default=None, gt=0)
    listing_id: int | None = Field(default=None, gt=0)
    entry_type: FinanceEntryType
    amount: float
    currency: str = "INR"
    tax_amount: float = 0
    external_reference: str | None = None
    description: str | None = None
    occurred_at: datetime | None = None


class FinanceEntryRead(FinanceEntryCreate):
    id: int
    seller_account_id: int
    occurred_at: datetime
    created_at: datetime


class SettlementCreate(BaseModel):
    marketplace_account_id: int = Field(gt=0)
    external_settlement_id: str = Field(min_length=1, max_length=200)
    period_start: datetime
    period_end: datetime
    gross_amount: float = 0
    fees_amount: float = 0
    refunds_amount: float = 0
    net_amount: float = 0
    status: SettlementStatus = SettlementStatus.PENDING
    notes: str | None = None


class SettlementRead(SettlementCreate):
    id: int
    seller_account_id: int
    created_at: datetime
    reconciled_at: datetime | None


class ReconciliationRead(BaseModel):
    settlement_id: int
    expected_net: float
    settlement_net: float
    variance: float
    status: SettlementStatus
