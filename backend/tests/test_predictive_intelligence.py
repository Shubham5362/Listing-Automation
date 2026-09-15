from app.models.core import User
from app.models.predictive_intelligence import AutopilotRun, BusinessPrediction
from app.services.predictive_intelligence import PredictiveSellerIntelligence


def _report(**overrides):
    base = {
        "business_health_score": 82.0,
        "kpis": {"revenue": 10000, "net_profit": 1200, "margin_percent": 12},
        "forecasts": {"inventory_days": 5},
        "advertising": {"acos_percent": 12, "roas": 6},
    }
    base.update(overrides)
    return base


def test_stockout_prediction_is_high_confidence(db_session, monkeypatch):
    monkeypatch.setattr("app.services.predictive_intelligence.BusinessIntelligenceService.decision_report", lambda self: _report())
    user = User(id=1, email="seller@example.com", password_hash="x")
    report = PredictiveSellerIntelligence(db_session, user).report()
    item = next(p for p in report["predictions"] if p["type"] == "stockout_risk")
    assert item["score"] >= 90
    assert item["confidence"] >= 0.9


def test_loss_prediction_is_critical(db_session, monkeypatch):
    monkeypatch.setattr("app.services.predictive_intelligence.BusinessIntelligenceService.decision_report", lambda self: _report(kpis={"revenue": 10000, "net_profit": -200, "margin_percent": -2}, forecasts={"inventory_days": 20}, advertising={"acos_percent": 20, "roas": 4}))
    user = User(id=2, email="loss@example.com", password_hash="x")
    predictions = PredictiveSellerIntelligence(db_session, user).report()["predictions"]
    item = next(p for p in predictions if p["type"] == "loss_risk")
    assert item["score"] >= 95
    assert item["confidence"] >= 0.9


def test_autopilot_never_auto_executes_high_risk_prediction(db_session, monkeypatch):
    monkeypatch.setattr("app.services.predictive_intelligence.BusinessIntelligenceService.decision_report", lambda self: _report())
    user = User(id=3, email="auto@example.com", password_hash="x")
    result = PredictiveSellerIntelligence(db_session, user).run_autopilot("auto")
    assert result["auto_action_count"] == 0
    assert result["approval_count"] == result["decision_count"]
    assert db_session.query(AutopilotRun).count() == 1


def test_persisted_predictions_are_seller_scoped(db_session, monkeypatch):
    monkeypatch.setattr("app.services.predictive_intelligence.BusinessIntelligenceService.decision_report", lambda self: _report())
    user = User(id=4, email="persist@example.com", password_hash="x")
    rows = PredictiveSellerIntelligence(db_session, user).persist_predictions()
    assert rows
    assert db_session.query(BusinessPrediction).filter_by(seller_account_id=4).count() == len(rows)
    assert db_session.query(BusinessPrediction).filter_by(seller_account_id=5).count() == 0
