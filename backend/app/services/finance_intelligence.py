from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable


@dataclass(frozen=True)
class SettlementImportResult:
    imported: int
    duplicates: int
    rejected: int
    total_net: float


@dataclass(frozen=True)
class FinanceInsight:
    revenue: float
    expenses: float
    gst: float
    net_profit: float
    profit_margin_percent: float
    cash_flow: float
    fee_ratio_percent: float
    anomalies: list[str]
    recommendations: list[str]


class FinanceIntelligenceService:
    """Deterministic, provider-neutral finance analytics over persisted ledger data."""

    @staticmethod
    def insight(entries: Iterable[object]) -> FinanceInsight:
        rows = list(entries)
        revenue = sum(Decimal(str(getattr(r, "amount", 0))) for r in rows if getattr(r, "entry_type", "") == "sale")
        expenses = sum(Decimal(str(getattr(r, "amount", 0))) for r in rows if getattr(r, "entry_type", "") in {
            "marketplace_fee", "shipping", "product_cost", "gst", "refund", "return", "advertising", "other_expense"
        })
        gst = sum(Decimal(str(getattr(r, "tax_amount", 0))) for r in rows if getattr(r, "entry_type", "") == "gst")
        fees = sum(Decimal(str(getattr(r, "amount", 0))) for r in rows if getattr(r, "entry_type", "") == "marketplace_fee")
        net = revenue - expenses
        margin = (net / revenue * 100) if revenue else Decimal("0")
        fee_ratio = (fees / revenue * 100) if revenue else Decimal("0")
        cash_in = sum(Decimal(str(getattr(r, "amount", 0))) for r in rows if getattr(r, "entry_type", "") == "sale")
        cash_out = expenses
        anomalies: list[str] = []
        recommendations: list[str] = []
        if revenue and fee_ratio > 20:
            anomalies.append("marketplace_fee_ratio_high")
            recommendations.append("Review marketplace fee and commission leakage by SKU and marketplace")
        if revenue and margin < 10:
            anomalies.append("low_profit_margin")
            recommendations.append("Review product cost, fees, shipping and pricing for low-margin SKUs")
        if gst > revenue * Decimal("0.5"):
            anomalies.append("gst_ratio_unusual")
            recommendations.append("Verify GST ledger entries against tax invoices and marketplace tax reports")
        if cash_out > cash_in:
            anomalies.append("negative_operating_cash_flow")
            recommendations.append("Review upcoming settlements, refunds and discretionary expenses")
        return FinanceInsight(float(revenue), float(expenses), float(gst), float(net), float(margin), float(cash_in - cash_out), float(fee_ratio), anomalies, recommendations)

    @staticmethod
    def match_invoice(invoice_total: float, ledger_total: float, tolerance: float = 0.01) -> dict[str, object]:
        if tolerance < 0:
            raise ValueError("tolerance must be non-negative")
        variance = round(float(invoice_total) - float(ledger_total), 2)
        return {"matched": abs(variance) <= tolerance, "invoice_total": float(invoice_total), "ledger_total": float(ledger_total), "variance": variance}

    @staticmethod
    def gst_reconciliation(output_tax: float, input_tax_credit: float, remitted_tax: float) -> dict[str, float | str]:
        liability = round(float(output_tax) - float(input_tax_credit), 2)
        variance = round(float(remitted_tax) - liability, 2)
        return {"output_tax": float(output_tax), "input_tax_credit": float(input_tax_credit), "expected_liability": liability, "remitted_tax": float(remitted_tax), "variance": variance, "status": "reconciled" if abs(variance) <= 0.01 else "review"}
