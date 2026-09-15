from datetime import datetime

from sqlalchemy.orm import Session

from app.models.core import User
from app.services.business_intelligence import BusinessIntelligenceService


class AdvancedBusinessIntelligenceService:
    """Seller-scoped, advisory-only profit and growth intelligence layer."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.base = BusinessIntelligenceService(db, user)

    def report(self, start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None) -> dict:
        report = self.base.decision_report(start=start, end=end, marketplace_account_id=marketplace_account_id)
        k = report["kpis"]
        products = report.get("top_products", [])
        ads = report.get("advertising", {})
        forecast = report.get("forecasts", {})

        ranked = []
        for p in products:
            revenue = float(p.get("revenue", 0) or 0)
            margin = float(p.get("margin_percent", 0) or 0)
            units = int(p.get("units", 0) or 0)
            score = min(100.0, max(0.0, margin * 2.0 + min(30.0, units / 5.0) + min(20.0, revenue / max(float(k.get("revenue", 1) or 1), 1) * 100)))
            ranked.append({**p, "profitability_score": round(score, 1), "estimated_contribution": round(revenue * margin / 100, 2)})
        ranked.sort(key=lambda x: (x["estimated_contribution"], x["profitability_score"]), reverse=True)

        opportunities = []
        risks = []
        for p in ranked[:15]:
            if p["margin_percent"] >= 20 and p["units"] >= 5:
                opportunities.append({"type": "profit_champion", "sku": p["sku"], "score": min(100, round(p["profitability_score"] + 10, 1)), "action": "Protect availability and test controlled growth."})
            if p["margin_percent"] < 10 and p["revenue"] > 0:
                risks.append({"type": "margin_risk", "sku": p["sku"], "score": min(100, round(100 - p["margin_percent"] * 5, 1)), "action": "Review price, fees, shipping and advertising before scaling."})

        if forecast.get("inventory_days") is not None and forecast["inventory_days"] < 7:
            risks.append({"type": "stockout", "score": 92, "action": "Replenish at-risk inventory before expected stockout."})
        if float(ads.get("acos_percent", 0) or 0) > 35:
            risks.append({"type": "ad_efficiency", "score": 86, "action": "Review high-ACOS campaigns and protect contribution margin."})

        revenue = float(k.get("revenue", 0) or 0)
        profit = float(k.get("net_profit", 0) or 0)
        days = 30
        daily_revenue = revenue / days
        daily_profit = profit / days
        forecast_30 = {"revenue": round(daily_revenue * 30, 2), "profit": round(daily_profit * 30, 2), "confidence": 0.70 if revenue else 0.0}
        forecast_90 = {"revenue": round(daily_revenue * 90, 2), "profit": round(daily_profit * 90, 2), "confidence": 0.60 if revenue else 0.0}

        margin = float(k.get("margin_percent", 0) or 0)
        health = float(report.get("business_health_score", 0) or 0)
        score = round(max(0, min(100, health * 0.55 + max(0, min(100, margin * 3)) * 0.25 + (100 - min(100, len(risks) * 10)) * 0.20)), 1)
        return {**report, "business_health_score": score, "sku_economics": ranked[:25], "opportunities": sorted(opportunities, key=lambda x: x["score"], reverse=True)[:10], "risks": sorted(risks, key=lambda x: x["score"], reverse=True)[:10], "forecasts": {**forecast, "next_30_days": forecast_30, "next_90_days": forecast_90}, "executive_summary": self._summary(k, margin, ads, forecast, opportunities, risks), "advisory_only": True}

    def simulate(self, scenario_type: str, change_percent: float, start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None) -> dict:
        if scenario_type not in {"price", "ad_spend", "discount", "units"}:
            raise ValueError("Unsupported scenario type")
        if abs(change_percent) > 50:
            raise ValueError("Scenario change must be between -50% and 50%")
        report = self.report(start=start, end=end, marketplace_account_id=marketplace_account_id)
        k = report["kpis"]
        revenue = float(k.get("revenue", 0) or 0)
        profit = float(k.get("net_profit", 0) or 0)
        factor = 1 + change_percent / 100
        if scenario_type == "units":
            projected_revenue = revenue * factor
            projected_profit = profit * factor
        elif scenario_type == "ad_spend":
            projected_revenue = revenue * (1 + change_percent * 0.15 / 100)
            projected_profit = profit - max(0, revenue * 0.01 * change_percent / 100) + (projected_revenue - revenue) * 0.25
        else:
            elasticity = -0.8 if scenario_type == "price" else -0.5
            projected_revenue = revenue * factor * (1 + elasticity * change_percent / 100)
            projected_profit = projected_revenue - max(0, revenue - profit) * (1 + (change_percent / 100 if scenario_type == "discount" else 0))
        projected_margin = projected_profit / projected_revenue * 100 if projected_revenue else 0
        return {"scenario_type": scenario_type, "change_percent": change_percent, "baseline_revenue": round(revenue, 2), "baseline_profit": round(profit, 2), "projected_revenue": round(projected_revenue, 2), "projected_profit": round(projected_profit, 2), "projected_margin_percent": round(projected_margin, 2), "profit_delta": round(projected_profit - profit, 2), "confidence": 0.65, "advisory_only": True}

    @staticmethod
    def _summary(k: dict, margin: float, ads: dict, forecast: dict, opportunities: list, risks: list) -> str:
        revenue = float(k.get("revenue", 0) or 0)
        profit = float(k.get("net_profit", 0) or 0)
        if not revenue:
            return "No recorded sales revenue is available for the selected period. Connect marketplace and finance data to activate profit intelligence."
        if risks:
            return f"Recorded revenue is ₹{revenue:,.2f} with ₹{profit:,.2f} net contribution. Margin is {margin:.1f}%; {len(risks)} material risk signal(s) need review before aggressive growth."
        return f"Recorded revenue is ₹{revenue:,.2f} with ₹{profit:,.2f} net contribution and {margin:.1f}% margin. {len(opportunities)} growth opportunity signal(s) are available with no material threshold breach detected."
