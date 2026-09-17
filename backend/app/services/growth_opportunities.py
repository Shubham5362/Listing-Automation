from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.core import User
from app.services.advanced_analytics import AdvancedAnalyticsService


class GrowthOpportunityService:
    """Deterministic, advisory growth-opportunity discovery over seller analytics."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def opportunity_report(
        self,
        start: datetime | None = None,
        end: datetime | None = None,
        marketplace_account_id: int | None = None,
    ) -> dict:
        analytics = AdvancedAnalyticsService(self.db, self.user).report(
            start=start, end=end, marketplace_account_id=marketplace_account_id
        )
        opportunities: list[dict] = []
        kpis = analytics.get("kpis", {})
        advertising = analytics.get("advertising", {})
        forecasts = analytics.get("forecasts", {})

        for product in analytics.get("products", []):
            revenue = float(product.get("revenue", 0) or 0)
            margin = float(product.get("margin_percent", 0) or 0)
            if revenue > 0 and margin >= 25:
                opportunities.append({
                    "type": "profitable_product_scale",
                    "priority": "high" if revenue >= max(float(kpis.get("revenue", 0) or 0) * 0.1, 1) else "medium",
                    "sku": product.get("sku"),
                    "product_id": product.get("product_id"),
                    "reason": "Product shows strong recorded margin and meaningful revenue contribution.",
                    "recommended_action": "Evaluate increasing traffic, inventory coverage, and controlled advertising for this SKU.",
                    "approval_required": True,
                })
            if revenue > 0 and margin < 10:
                opportunities.append({
                    "type": "margin_recovery",
                    "priority": "high",
                    "sku": product.get("sku"),
                    "product_id": product.get("product_id"),
                    "reason": "Recorded product margin is below the healthy-growth threshold.",
                    "recommended_action": "Review price, marketplace fees, shipping, and advertising cost before scaling.",
                    "approval_required": True,
                })

        acos = float(advertising.get("acos_percent", 0) or 0)
        roas = float(advertising.get("roas", 0) or 0)
        if advertising.get("spend", 0) and acos <= 15 and roas >= 5:
            opportunities.append({
                "type": "efficient_ad_scale",
                "priority": "high",
                "reason": "Advertising efficiency is strong in the selected period.",
                "recommended_action": "Consider a controlled budget increase on proven campaigns after review.",
                "approval_required": True,
            })
        elif advertising.get("spend", 0) and acos > 35:
            opportunities.append({
                "type": "wasted_ad_spend_recovery",
                "priority": "high",
                "reason": "Advertising ACOS is elevated relative to the growth threshold.",
                "recommended_action": "Reduce inefficient spend and inspect campaign/search-term performance before scaling.",
                "approval_required": True,
            })

        inventory_days = forecasts.get("inventory_days")
        if inventory_days is not None and inventory_days < 14:
            opportunities.append({
                "type": "inventory_constrained_growth",
                "priority": "high" if inventory_days < 7 else "medium",
                "reason": "Current inventory coverage may constrain additional demand generation.",
                "recommended_action": "Review replenishment recommendations before increasing traffic or ad budgets.",
                "approval_required": True,
            })
        elif inventory_days is not None and inventory_days > 60:
            opportunities.append({
                "type": "overstock_clearance",
                "priority": "medium",
                "reason": "Inventory coverage is materially above observed demand velocity.",
                "recommended_action": "Evaluate controlled promotions or pricing actions to improve inventory turnover.",
                "approval_required": True,
            })

        for marketplace in analytics.get("marketplaces", []):
            revenue = float(marketplace.get("revenue", 0) or 0)
            margin = float(marketplace.get("margin_percent", 0) or 0)
            if revenue > 0 and margin >= 20:
                opportunities.append({
                    "type": "marketplace_scale_candidate",
                    "priority": "medium",
                    "marketplace": marketplace.get("marketplace"),
                    "reason": "Marketplace shows a healthy recorded contribution margin.",
                    "recommended_action": "Compare assortment and fulfillment capacity before expanding successful SKUs on this marketplace.",
                    "approval_required": True,
                })

        if not opportunities:
            opportunities.append({
                "type": "baseline_growth_review",
                "priority": "low",
                "reason": "No strong deterministic growth opportunity crossed the configured thresholds.",
                "recommended_action": "Continue monitoring sales, margin, inventory, and advertising trends.",
                "approval_required": False,
            })

        rank = {"high": 0, "medium": 1, "low": 2}
        opportunities.sort(key=lambda item: rank.get(item.get("priority", "low"), 2))
        return {
            "period_start": analytics.get("period_start"),
            "period_end": analytics.get("period_end"),
            "summary": {
                "revenue": kpis.get("revenue", 0),
                "net_profit": kpis.get("net_profit", 0),
                "margin_percent": kpis.get("margin_percent", 0),
                "opportunity_count": len(opportunities),
                "high_priority_count": sum(o.get("priority") == "high" for o in opportunities),
            },
            "opportunities": opportunities[:50],
            "advisory_only": True,
            "approval_required_for_actions": True,
        }
