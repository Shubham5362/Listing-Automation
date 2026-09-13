from datetime import datetime

from pydantic import BaseModel, Field


class InvoiceMatchRequest(BaseModel):
    invoice_total: float = Field(ge=0)
    ledger_total: float = Field(ge=0)
    tolerance: float = Field(default=0.01, ge=0)


class GSTReconciliationRequest(BaseModel):
    output_tax: float = Field(ge=0)
    input_tax_credit: float = Field(ge=0)
    remitted_tax: float = Field(ge=0)


class SettlementImportItem(BaseModel):
    marketplace_account_id: int = Field(gt=0)
    external_settlement_id: str = Field(min_length=1, max_length=200)
    period_start: datetime
    period_end: datetime
    gross_amount: float = Field(default=0, ge=0)
    fees_amount: float = Field(default=0, ge=0)
    refunds_amount: float = Field(default=0, ge=0)
    net_amount: float = 0


class SettlementImportRequest(BaseModel):
    settlements: list[SettlementImportItem] = Field(min_length=1, max_length=500)


class SettlementImportRead(BaseModel):
    imported: int
    duplicates: int
    rejected: int
    total_net: float


class FinanceInsightRead(BaseModel):
    revenue: float
    expenses: float
    gst: float
    net_profit: float
    profit_margin_percent: float
    cash_flow: float
    fee_ratio_percent: float
    anomalies: list[str]
    recommendations: list[str]


class InvoiceMatchRead(BaseModel):
    matched: bool
    invoice_total: float
    ledger_total: float
    variance: float


class GSTReconciliationRead(BaseModel):
    output_tax: float
    input_tax_credit: float
    expected_liability: float
    remitted_tax: float
    variance: float
    status: str
