from pydantic import BaseModel, Field


class InvoiceMatchRequest(BaseModel):
    invoice_total: float = Field(ge=0)
    ledger_total: float = Field(ge=0)
    tolerance: float = Field(default=0.01, ge=0)


class GSTReconciliationRequest(BaseModel):
    output_tax: float = Field(ge=0)
    input_tax_credit: float = Field(ge=0)
    remitted_tax: float = Field(ge=0)


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
