from types import SimpleNamespace

import pytest

from app.services.finance_intelligence import FinanceIntelligenceService


def test_invoice_match_with_tolerance():
    result = FinanceIntelligenceService.match_invoice(1000, 999.995, 0.01)
    assert result["matched"] is True
    assert result["variance"] == 0.0


def test_invoice_match_flags_variance():
    result = FinanceIntelligenceService.match_invoice(1000, 990, 0.01)
    assert result["matched"] is False
    assert result["variance"] == 10.0


def test_gst_reconciliation():
    result = FinanceIntelligenceService.gst_reconciliation(180, 50, 130)
    assert result["expected_liability"] == 130.0
    assert result["status"] == "reconciled"


def test_finance_insight_uses_ledger_data():
    rows = [
        SimpleNamespace(entry_type="sale", amount=1000, tax_amount=0),
        SimpleNamespace(entry_type="marketplace_fee", amount=100, tax_amount=0),
        SimpleNamespace(entry_type="product_cost", amount=400, tax_amount=0),
        SimpleNamespace(entry_type="gst", amount=50, tax_amount=50),
    ]
    result = FinanceIntelligenceService.insight(rows)
    assert result.revenue == 1000.0
    assert result.expenses == 550.0
    assert result.net_profit == 450.0
    assert result.cash_flow == 450.0


def test_negative_cash_flow_recommendation():
    rows = [
        SimpleNamespace(entry_type="sale", amount=100, tax_amount=0),
        SimpleNamespace(entry_type="other_expense", amount=150, tax_amount=0),
    ]
    result = FinanceIntelligenceService.insight(rows)
    assert "negative_operating_cash_flow" in result.anomalies


def test_negative_tolerance_rejected():
    with pytest.raises(ValueError):
        FinanceIntelligenceService.match_invoice(10, 10, -0.01)
