from datetime import datetime

from sqlalchemy.orm import Session

from app.models.core import User
from app.services.advanced_analytics import AdvancedAnalyticsService


class BusinessIntelligenceService:
    """Deterministic advisory decision layer over existing seller analytics."""

    def __init__(self, db: Session, user: User):
        self.analytics = AdvancedAnalyticsService(db, user)

    def decision_report(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        marketplace_account_id: int | None = None,
    ) -> dict:
        report = self.analytics.report(start=start, end=end, marketplace_account_id=marketplace_account_id)
        kpis = report["kpis"]
        forecast = report["forecasts"]
        ads = report["advertising"]
        insights: list[dict] = list(report["insights"])
        decisions: list[dict] = []

        revenue = float(kpis.get("revenue", 0) or 0)
        profit = float(kpis.get("net_profit", 0) or 0)
        margin = float(kpis.get("margin_percent", 0) or 0)
        inventory_days = forecast.get("inventory_days")
        acos = float(ads.get("acos_percent", 0) or 0)
        roas = float(ads.get("roas", 0) or 0)

        if inventory_days is not None and inventory_days < 7:
            decisions.append({"priority": "critical", "area": "inventory", "action": "Replenish at-risk SKUs before stockout.", "reason": f"Portfolio coverage is {inventory_days:.1f} days.", "approval_required": True})
        elif inventory_days is not None and inventory_days > 60:
            decisions.append({"priority": "medium", "area": "inventory", "action": "Review slow-moving stock and reduce replenishment.", "reason": f"Portfolio coverage is {inventory_days:.1f} days.", "approval_required": True})

        if acos > 35 and roas > 0:
            decisions.append({"priority": "high", "area": "advertising", "action": "Reduce inefficient ad spend and review high-ACOS campaigns.", "reason": f"ACOS is {acos:.1f}% with ROAS {roas:.2f}.", "approval_required": True})
        elif acos and acos < 15 and roas >= 5:
            decisions.append({"priority": "medium", "area": "advertising", "action": "Consider scaling efficient campaigns within budget limits.", "reason": f"ACOS is {acos:.1f}% with ROAS {roas:.2f}.", "approval_required": True})

        if revenue > 0 and margin < 10:
            decisions.append({"priority": "high", "area": "profitability", "action": "Protect margin before pursuing additional volume.", "reason": f"Net margin is {margin:.1f}%.", "approval_required": True})
        if revenue > 0 and profit < 0:
            decisions.append({"priority": "critical", "area": "cash", "action": "Stop loss-making growth actions and review major cost drivers.", "reason": f"Recorded net profit is {profit:.2f}.", "approval_required": True})
        if not decisions:
            decisions.append({"priority": "low", "area": "general", "action": "Continue current operating plan and review weekly KPIs.", "reason": "No high-confidence threshold breach was detected.", "approval_required": False})

        score = 100.0
        score -= min(35, sum(20 if d["priority"] == "critical" else 12 if d["priority"] == "high" else 5 for d in decisions if d["area"] != "general"))
        if margin < 10: score -= 10
        if inventory_days is not None and inventory_days < 7: score -= 10
        if acos > 35: score -= 10
        score = max(0.0, min(100.0, score))
        return {
            "period_start": report["period_start"],
            "period_end": report["period_end"],
            "business_health_score": round(score, 1),
            "kpis": kpis,
            "forecasts": forecast,
            "advertising": ads,
            "marketplaces": report["marketplaces"],
            "top_products": report["products"][:10],
            "insights": insights,
            "decisions": decisions,
            "advisory_only": True,
        }
