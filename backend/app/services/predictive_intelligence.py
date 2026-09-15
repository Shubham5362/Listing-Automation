from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import SellerAccount, User
from app.models.predictive_intelligence import AutopilotRun, BusinessPrediction
from app.services.business_intelligence import BusinessIntelligenceService


class PredictiveSellerIntelligence:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id))
        self.seller_account_id = seller.id if seller else user.id

    def report(self) -> dict:
        report = BusinessIntelligenceService(self.db, self.user).decision_report()
        kpis = report.get("kpis", {})
        forecast = report.get("forecasts", {})
        ads = report.get("advertising", {})
        revenue = float(kpis.get("revenue", 0) or 0)
        profit = float(kpis.get("net_profit", 0) or 0)
        margin = float(kpis.get("margin_percent", 0) or 0)
        inventory_days = forecast.get("inventory_days")
        acos = float(ads.get("acos_percent", 0) or 0)
        roas = float(ads.get("roas", 0) or 0)

        predictions: list[dict] = []
        if inventory_days is not None:
            days = float(inventory_days)
            if days < 7:
                predictions.append({"type": "stockout_risk", "horizon_days": max(1, int(days)), "score": 95, "confidence": 0.91, "title": "Stock-out risk is approaching", "reason": f"Estimated portfolio coverage is {days:.1f} days.", "action": "Review replenishment for at-risk SKUs."})
            elif days < 14:
                predictions.append({"type": "stockout_risk", "horizon_days": int(days), "score": 78, "confidence": 0.82, "title": "Inventory coverage is tightening", "reason": f"Estimated coverage is {days:.1f} days.", "action": "Prepare replenishment before coverage falls below 7 days."})
            elif days > 60:
                predictions.append({"type": "overstock_risk", "horizon_days": 30, "score": 68, "confidence": 0.78, "title": "Slow-moving inventory risk", "reason": f"Estimated coverage is {days:.1f} days.", "action": "Review slow movers before placing more replenishment."})
        if revenue > 0 and margin < 10:
            predictions.append({"type": "margin_risk", "horizon_days": 30, "score": 84, "confidence": 0.88, "title": "Margin pressure may persist", "reason": f"Current net margin is {margin:.1f}%.", "action": "Review fees, ads, returns and pricing before scaling volume."})
        if revenue > 0 and profit < 0:
            predictions.append({"type": "loss_risk", "horizon_days": 14, "score": 97, "confidence": 0.93, "title": "Loss-making growth risk", "reason": f"Recorded net profit is {profit:.2f}.", "action": "Pause loss-making growth actions and inspect cost drivers."})
        if acos > 35 and roas > 0:
            predictions.append({"type": "ad_efficiency_risk", "horizon_days": 14, "score": 81, "confidence": 0.86, "title": "Ad efficiency risk", "reason": f"ACOS is {acos:.1f}% with ROAS {roas:.2f}.", "action": "Reduce inefficient spend and protect profitable campaigns."})
        if not predictions:
            predictions.append({"type": "stable_outlook", "horizon_days": 7, "score": 18, "confidence": 0.76, "title": "No material threshold risk detected", "reason": "Current business intelligence signals are within configured thresholds.", "action": "Continue monitoring weekly KPIs."})
        return {"seller_account_id": self.seller_account_id, "generated_at": datetime.utcnow().isoformat(), "health_score": report.get("business_health_score", 0), "predictions": predictions, "kpis": kpis, "forecasts": forecast, "advertising": ads}

    def run_autopilot(self, mode: str = "recommend") -> dict:
        allowed = {"observe", "recommend", "approval", "auto", "strict"}
        if mode not in allowed:
            raise ValueError("invalid autopilot mode")
        report = self.report()
        decisions = report["predictions"]
        auto_count = 0
        approval_count = 0
        for item in decisions:
            safe = item["score"] < 50 and item["confidence"] >= 0.90 and item["type"] == "stable_outlook"
            if mode == "auto" and safe:
                auto_count += 1
            else:
                approval_count += 1
        run = AutopilotRun(seller_account_id=self.seller_account_id, mode=mode, status="completed", decision_count=len(decisions), auto_action_count=auto_count, approval_count=approval_count)
        self.db.add(run)
        self.db.commit()
        return {"run_id": run.id, "mode": mode, "decision_count": len(decisions), "auto_action_count": auto_count, "approval_count": approval_count, "safety": "high-risk and low-confidence actions require approval"}

    def persist_predictions(self) -> list[BusinessPrediction]:
        report = self.report()
        rows: list[BusinessPrediction] = []
        for item in report["predictions"]:
            row = BusinessPrediction(seller_account_id=self.seller_account_id, prediction_type=item["type"], horizon_days=item["horizon_days"], score=item["score"], confidence=item["confidence"], title=item["title"], reason=item["reason"], recommended_action=item["action"])
            self.db.add(row)
            rows.append(row)
        self.db.commit()
        return rows
