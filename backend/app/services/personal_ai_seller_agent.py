from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.advertising import AdvertisingCampaign, AdvertisingPerformance
from app.models.catalog import Listing, Product
from app.models.core import AuditLog, MarketplaceAccount
from app.models.inventory import InventoryItem, InventoryMovement
from app.services.ai_guard import casual_reply, is_casual_message
from app.services.action_control import create_personal_action
from app.services.llm_gateway import LLMGateway, LLMUnavailable
from app.services.personal_marketplace import personal_seller_id


class PersonalAISellerAgentService:
    """Personal seller agent: deterministic business tools + optional cloud LLM."""

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
        return {"marketplaces": [{"id": m.id, "marketplace": m.marketplace, "connected": m.is_connected, "last_sync_at": m.last_sync_at.isoformat() if m.last_sync_at else None, "error": m.connection_error} for m in marketplaces], "products": len(products), "listings": len(listings), "active_listings": sum(l.status == "active" for l in listings), "inventory_items": len(inventory), "inventory_units": sum(max(i.quantity - i.reserved_quantity, 0) for i in inventory), "low_stock": sum(max(i.quantity - i.reserved_quantity, 0) <= i.reorder_level for i in inventory if i.reorder_level > 0), "out_of_stock": sum(max(i.quantity - i.reserved_quantity, 0) <= 0 for i in inventory), "campaigns": len(campaigns)}

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
            if action != "maintain": results.append({"campaign_id": campaign.id, "campaign": campaign.name, "spend": round(spend, 2), "sales": round(sales, 2), "acos": round(acos, 2) if acos is not None else None, "roas": round(roas, 2) if roas is not None else None, "clicks": clicks, "conversions": conversions, "action": action, "severity": "high" if action in {"investigate", "reduce"} else "medium", "reason": "High spend with weak attributable sales" if action in {"investigate", "reduce"} else "Efficient attributable return supports cautious scaling"})
        results.sort(key=lambda x: (0 if x["action"] in {"investigate", "reduce"} else 1, -(x["spend"])))
        return results[:limit]

    def pricing_opportunities(self, limit: int = 10) -> list[dict[str, Any]]:
        listings = list(self.db.scalars(select(Listing).join(MarketplaceAccount, Listing.marketplace_account_id == MarketplaceAccount.id).where(MarketplaceAccount.seller_account_id == self.seller_id, Listing.price.is_not(None))).all())
        results: list[dict[str, Any]] = []
        for listing in listings:
            product = self.db.get(Product, listing.product_id)
            if not product or product.cost_price is None: continue
            price = float(listing.price); cost = float(product.cost_price); margin = (price - cost) / price * 100 if price else 0
            if margin < 10: results.append({"listing_id": listing.id, "sku": listing.sku, "current_price": price, "cost_price": cost, "margin_percent": round(margin, 2), "action": "review_price", "severity": "high", "reason": "Current gross margin is below 10% before marketplace and fulfilment costs"})
        return results[:limit]

    def recommendations(self, limit: int = 10) -> list[dict[str, Any]]:
        recommendations: list[dict[str, Any]] = []
        for issue in self.inventory_issues(limit): recommendations.append({"type": "inventory", "priority": issue["severity"], "title": "Inventory needs attention", "reason": f"Product {issue['product_id']} has {issue['available']} available units and about {issue['days_remaining'] if issue['days_remaining'] is not None else 'unknown'} days of cover.", "suggested_action": issue["recommended_action"], "confidence": 0.9 if issue["days_remaining"] is not None else 0.7, "data": issue})
        for issue in self.advertising_issues(limit): recommendations.append({"type": "advertising", "priority": issue["severity"], "title": f"Advertising: {issue['action']}", "reason": issue["reason"], "suggested_action": issue["action"], "confidence": 0.85, "data": issue})
        for issue in self.pricing_opportunities(limit): recommendations.append({"type": "pricing", "priority": issue["severity"], "title": f"Review price for {issue['sku']}", "reason": issue["reason"], "suggested_action": issue["action"], "confidence": 0.8, "data": issue})
        priority = {"critical": 0, "high": 1, "medium": 2, "low": 3}; recommendations.sort(key=lambda r: (priority.get(r["priority"], 3), -float(r["confidence"])))
        return recommendations[:limit]

    def brief(self) -> dict[str, Any]:
        context = self.context(); recommendations = self.recommendations(10); critical = sum(r["priority"] == "critical" for r in recommendations); high = sum(r["priority"] == "high" for r in recommendations)
        return {"agent": "personal_ai_seller_agent", "mode": "llm_supervised" if LLMGateway().configured else "deterministic_fallback", "summary": f"I found {len(recommendations)} priority item(s): {critical} critical and {high} high priority.", "context": context, "recommendations": recommendations, "approval_required_for_writes": True, "execution_enabled": True, "no_unapproved_actions_executed": True}

    def _tool_definitions(self) -> list[dict[str, Any]]:
        return [
            {"name": "get_business_context", "description": "Read current live Seller Hub counts, marketplaces and sync health.", "parameters": {"type": "object", "properties": {}}},
            {"name": "analyze_inventory_risk", "description": "Find low stock, out of stock and stockout-risk items.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 20}}}},
            {"name": "analyze_advertising", "description": "Analyze recent advertising spend, sales, ACOS and ROAS issues.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 20}}}},
            {"name": "analyze_pricing", "description": "Find current low-margin pricing opportunities from live listings and product costs.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 20}}}},
            {"name": "get_recommendations", "description": "Get prioritized business recommendations from verified live data.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 20}}}},
            {"name": "request_marketplace_action", "description": "Create a backend-enforced marketplace action request. Never claim completion.", "parameters": {"type": "object", "required": ["action", "payload"], "properties": {"action": {"type": "string", "enum": ["marketplace_sync", "marketplace_operation", "listing_update", "listing_publish", "automation_run"]}, "payload": {"type": "object"}, "reason": {"type": "string"}}}},
        ]

    def _execute_tool(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        limit = int(args.get("limit", 10)); limit = max(1, min(limit, 20))
        if name == "get_business_context": return self.context()
        if name == "analyze_inventory_risk": return {"items": self.inventory_issues(limit)}
        if name == "analyze_advertising": return {"campaigns": self.advertising_issues(limit)}
        if name == "analyze_pricing": return {"opportunities": self.pricing_opportunities(limit)}
        if name == "get_recommendations": return {"recommendations": self.recommendations(limit)}
        if name == "request_marketplace_action":
            action = str(args.get("action") or "").strip().lower()
            payload = args.get("payload") if isinstance(args.get("payload"), dict) else {}
            reason = str(args.get("reason") or "Requested by Seller Hub AI agent")[:1000]
            request = create_personal_action(self.db, action=action, payload=payload, reason=reason)
            return {"action_request_id": request.id, "action": request.action, "risk": request.risk, "status": request.status, "job_id": request.job_id, "approval_required": request.status == "pending", "message": "Action request created; no marketplace completion is claimed."}
        raise ValueError(f"Unknown or unauthorized AI tool: {name}")

    @staticmethod
    def _infer_intent(message: str) -> str:
        # LLM/tool planning handles semantic intent. This is only the conservative
        # no-LLM fallback and never routes configured-LLM tool calls.
        return "business_health"

    @staticmethod
    def _is_casual(message: str) -> bool:
        return is_casual_message(message)

    def chat(self, message: str, create_plan: bool = False) -> dict[str, Any]:
        message = message.strip()
        if not message: raise ValueError("message cannot be empty")

        if self._is_casual(message):
            answer = casual_reply(message)
            provider = "deterministic"
            intent = "casual"
            response = {"agent": "personal_ai_seller_agent", "message": message, "answer": answer, "intent": intent, "provider": provider, "model": None, "fallback_reason": None, "tool_calls": [], "plan_requested": create_plan, "created_actions": [], "approval_required": True, "execution": "No marketplace write is executed from chat; approved writes use the existing Action Control pipeline."}
            self.db.add(AuditLog(action="ai_agent.chat", resource_type="ai_agent", resource_id=None, details=json.dumps({"provider": provider, "intent": intent, "tool_calls": [], "plan": create_plan, "fallback_reason": None}, separators=(",", ":"))))
            self.db.commit()
            return response

        gateway = LLMGateway()
        intent = self._infer_intent(message)
        answer = None; provider = "deterministic"; model = None; tool_calls: list[dict[str, Any]] = []; fallback_reason = None
        if gateway.configured:
            system = (
                "ROLE AND HARD SCOPE: You are the Personal AI Seller Agent inside a private Amazon/Flipkart Seller Hub. "
                "This is NOT a general-purpose chatbot. Your job is to help the owner operate, understand, improve and automate "
                "this Seller Hub and the connected selling business. "
                "Seller scope includes products, listings, inventory, stock, orders, returns, pricing, margins, sales, profitability, "
                "advertising, finance, marketplace connections, reports, analytics, business strategy and related seller work. "
                "You may explain how this Seller Hub and its agents/tools work. "
                "If the user's primary request is outside this project (for example stories, poems, jokes, entertainment, travel planning, "
                "homework, unrelated coding, general trivia, or other non-seller work), DO NOT perform it. Briefly and politely redirect "
                "the user to Seller Hub/business help instead. Do not generate outside-scope content. "
                "Basic greetings and brief pleasantries are allowed, but do not become a general-purpose social chatbot. "
                "Understand intent semantically; do not require specific keywords. For business facts, use tools and never invent data. "
                "Never execute marketplace writes directly from chat; approved writes use the existing action-control pipeline. "
                "Reply in the user's current language. Keep answers concise and directly useful."
            )
            try:
                result = gateway.generate(system=system, user=message, tools=self._tool_definitions(), tool_executor=self._execute_tool, scope_text=message)
                answer, provider, model, tool_calls = result.text, result.provider, result.model, result.tool_calls
            except LLMUnavailable as exc:
                fallback_reason = str(exc)[:1200]
        if answer is None:
            if self._is_casual(message): answer = casual_reply(message)
            else:
                if intent == "inventory": focus = self.inventory_issues(10)
                elif intent == "advertising": focus = self.advertising_issues(10)
                elif intent == "pricing": focus = self.pricing_opportunities(10)
                else: focus = self.recommendations(10)
                answer = self._answer(intent, focus)
        response = {"agent": "personal_ai_seller_agent", "message": message, "answer": answer, "intent": intent, "provider": provider, "model": model, "fallback_reason": fallback_reason, "tool_calls": [{"name": c.get("name") or c.get("function", {}).get("name")} for c in tool_calls], "plan_requested": create_plan, "created_actions": [], "approval_required": True, "execution": "No marketplace write is executed from chat; approved writes use the existing Action Control pipeline."}
        self.db.add(AuditLog(action="ai_agent.chat", resource_type="ai_agent", resource_id=None, details=json.dumps({"provider": provider, "model": model, "intent": intent, "tool_calls": response["tool_calls"], "plan": create_plan, "fallback_reason": fallback_reason}, separators=(",", ":"))))
        self.db.commit()
        return response

    @staticmethod
    def _answer(intent: str, rows: list[dict[str, Any]]) -> str:
        if not rows: return f"No {intent} issue requiring attention was found in the available live data."
        return f"I found {len(rows)} {intent} item(s) requiring attention. I have not executed any unapproved marketplace write."
