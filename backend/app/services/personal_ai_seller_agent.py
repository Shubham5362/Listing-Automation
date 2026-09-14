from __future__ import annotations

import json
import re
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.advertising import AdvertisingCampaign, AdvertisingPerformance
from app.models.catalog import Listing, Product
from app.models.core import AuditLog, MarketplaceAccount
from app.models.inventory import InventoryItem, InventoryMovement
from app.services.personal_marketplace import personal_seller_id


class PersonalAISellerAgentService:
    """Personal, provider-neutral seller agent built on verified Seller Hub data."""

    def __init__(self, db: Session):
        self.db = db
        self.seller_id = personal_seller_id(db)
        if self.seller_id is None:
            raise LookupError("Personal seller workspace is not initialized")

    def context(self) -> dict[str, Any]:
        seller_id = self.seller_id
        inventory = list(self.db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id == seller_id)).all())
        products = list(self.db.scalars(select(Product).where(Product.seller_account_id == seller_id)).all())
        listings = list(self.db.scalars(select(Listing).join(MarketplaceAccount, Listing.marketplace_account_id == MarketplaceAccount.id).where(MarketplaceAccount.seller_account_id == seller_id)).all())
        marketplaces = list(self.db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id == seller_id)).all())
        campaigns = list(self.db.scalars(select(AdvertisingCampaign).where(AdvertisingCampaign.seller_account_id == seller_id)).all())
        return {
            "marketplaces": [{"id": m.id, "marketplace": m.marketplace, "connected": m.is_connected, "last_sync_at": m.last_sync_at.isoformat() if m.last_sync_at else None, "error": m.connection_error} for m in marketplaces],
            "products": len(products), "listings": len(listings), "active_listings": sum(l.status == "active" for l in listings),
            "inventory_items": len(inventory), "inventory_units": sum(max(i.quantity - i.reserved_quantity, 0) for i in inventory),
            "low_stock": sum(max(i.quantity - i.reserved_quantity, 0) <= i.reorder_level for i in inventory if i.reorder_level > 0),
            "out_of_stock": sum(max(i.quantity - i.reserved_quantity, 0) <= 0 for i in inventory), "campaigns": len(campaigns),
        }

    def inventory_issues(self, limit: int = 10) -> list[dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(days=30)
        items = list(self.db.scalars(select(InventoryItem).where(InventoryItem.seller_account_id == self.seller_id)).all())
        results: list[dict[str, Any]] = []
        for item in items:
            sales = list(self.db.scalars(select(InventoryMovement).where(InventoryMovement.inventory_item_id == item.id, InventoryMovement.movement_type == "sale", InventoryMovement.created_at >= cutoff)).all())
            daily = sum(max(-m.quantity_delta, 0) for m in sales) / 30.0
            available = max(item.quantity - item.reserved_quantity, 0)
            days = available / daily if daily > 0 else None
            if available <= 0: severity = "critical"
            elif item.reorder_level > 0 and available <= item.reorder_level: severity = "high"
            elif days is not None and days <= 7: severity = "high"
            elif days is not None and days <= 14: severity = "medium"
            else: continue
            results.append({"inventory_item_id": item.id, "product_id": item.product_id, "available": available, "daily_sales_velocity": round(daily, 2), "days_remaining": round(days, 1) if days is not None else None, "severity": severity, "recommended_action": "replenish_inventory" if daily > 0 else "investigate_stock"})
        results.sort(key=lambda x: ({"critical": 0, "high": 1, "medium": 2}.get(x["severity"], 3), x["days_remaining"] if x["days_remaining"] is not None else 999))
        return results[:limit]

    def advertising_issues(self, limit: int = 10) -> list[dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(days=30)
        campaigns = list(self.db.scalars(select(AdvertisingCampaign).where(AdvertisingCampaign.seller_account_id == self.seller_id)).all())
        results: list[dict[str, Any]] = []
        for campaign in campaigns:
            rows = list(self.db.scalars(select(AdvertisingPerformance).where(AdvertisingPerformance.campaign_id == campaign.id, AdvertisingPerformance.report_date >= cutoff)).all())
            spend = sum(float(r.spend) for r in rows); sales = sum(float(r.sales) for r in rows); clicks = sum(r.clicks for r in rows); conversions = sum(r.conversions for r in rows)
            if spend <= 0: continue
            acos = spend / sales * 100 if sales > 0 else None; roas = sales / spend if spend > 0 else None
            action = "investigate" if sales <= 0 else "reduce" if acos is not None and acos > 50 else "scale" if acos is not None and acos <= 20 else "maintain"
            if action != "maintain":
                results.append({"campaign_id": campaign.id, "campaign": campaign.name, "spend": round(spend, 2), "sales": round(sales, 2), "acos": round(acos, 2) if acos is not None else None, "roas": round(roas, 2) if roas is not None else None, "clicks": clicks, "conversions": conversions, "action": action, "severity": "high" if action in {"investigate", "reduce"} else "medium", "reason": "High spend with weak attributable sales" if action in {"investigate", "reduce"} else "Efficient attributable return supports cautious scaling"})
        results.sort(key=lambda x: (0 if x["action"] in {"investigate", "reduce"} else 1, -(x["spend"])))
        return results[:limit]

    def pricing_opportunities(self, limit: int = 10) -> list[dict[str, Any]]:
        listings = list(self.db.scalars(select(Listing).join(MarketplaceAccount, Listing.marketplace_account_id == MarketplaceAccount.id).where(MarketplaceAccount.seller_account_id == self.seller_id, Listing.price.is_not(None))).all())
        results: list[dict[str, Any]] = []
        for listing in listings:
            product = self.db.get(Product, listing.product_id)
            if not product or product.cost_price is None: continue
            price = float(listing.price); cost = float(product.cost_price); margin = (price - cost) / price * 100 if price else 0
            if margin < 10:
                results.append({"listing_id": listing.id, "sku": listing.sku, "current_price": price, "cost_price": cost, "margin_percent": round(margin, 2), "action": "review_price", "severity": "high", "reason": "Current gross margin is below 10% before marketplace and fulfilment costs"})
        return results[:limit]

    def recommendations(self, limit: int = 10) -> list[dict[str, Any]]:
        recommendations: list[dict[str, Any]] = []
        for issue in self.inventory_issues(limit):
            recommendations.append({"type": "inventory", "priority": issue["severity"], "title": "Inventory needs attention", "reason": f"Product {issue['product_id']} has {issue['available']} available units and about {issue['days_remaining'] if issue['days_remaining'] is not None else 'unknown'} days of cover.", "suggested_action": issue["recommended_action"], "confidence": 0.9 if issue["days_remaining"] is not None else 0.7, "data": issue})
        for issue in self.advertising_issues(limit):
            recommendations.append({"type": "advertising", "priority": issue["severity"], "title": f"Advertising: {issue['action']}", "reason": issue["reason"], "suggested_action": issue["action"], "confidence": 0.85, "data": issue})
        for issue in self.pricing_opportunities(limit):
            recommendations.append({"type": "pricing", "priority": issue["severity"], "title": f"Review price for {issue['sku']}", "reason": issue["reason"], "suggested_action": issue["action"], "confidence": 0.8, "data": issue})
        priority = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recommendations.sort(key=lambda r: (priority.get(r["priority"], 3), -float(r["confidence"])))
        return recommendations[:limit]

    def brief(self) -> dict[str, Any]:
        context = self.context(); recommendations = self.recommendations(10)
        critical = sum(r["priority"] == "critical" for r in recommendations); high = sum(r["priority"] == "high" for r in recommendations)
        return {"agent": "personal_ai_seller_agent", "mode": "supervised", "summary": f"I found {len(recommendations)} priority item(s): {critical} critical and {high} high priority.", "context": context, "recommendations": recommendations, "approval_required_for_writes": True, "execution_enabled": True, "no_unapproved_actions_executed": True}

    def chat(self, message: str, create_plan: bool = False) -> dict[str, Any]:
        text = re.sub(r"\s+", " ", message.strip().lower())
        if not text: raise ValueError("message cannot be empty")
        if any(word in text for word in ("stock", "inventory", "out of stock", "replenish")): focus = self.inventory_issues(10); intent = "inventory"
        elif any(word in text for word in ("ad", "advertising", "campaign", "acos", "roas")): focus = self.advertising_issues(10); intent = "advertising"
        elif any(word in text for word in ("price", "pricing", "margin", "competitor")): focus = self.pricing_opportunities(10); intent = "pricing"
        else: focus = self.recommendations(10); intent = "business_health"
        plan = [{"step": 1, "action": "review verified Seller Hub data", "status": "ready"}, {"step": 2, "action": f"evaluate {intent} priorities", "status": "ready"}, {"step": 3, "action": "validate a concrete marketplace operation payload", "status": "required"}, {"step": 4, "action": "request owner approval before marketplace writes", "status": "required"}]
        response = {"agent": "personal_ai_seller_agent", "intent": intent, "message": message, "answer": self._answer(intent, focus), "plan": plan, "recommendations": focus, "approval_required": True, "plan_requested": create_plan, "created_actions": [], "execution": "No action request is created until the agent has a concrete, validated marketplace operation payload; approved writes use the existing Action Control pipeline."}
        self.db.add(AuditLog(action="ai_agent.chat", resource_type="ai_agent", resource_id=None, details=json.dumps({"intent": intent, "create_plan": create_plan}, separators=(",", ":"))))
        self.db.commit()
        return response

    @staticmethod
    def _answer(intent: str, rows: list[dict[str, Any]]) -> str:
        if not rows: return f"No {intent} issue requiring attention was found in the available live data."
        return f"I found {len(rows)} {intent} item(s) requiring attention. I have not executed any unapproved marketplace write."
