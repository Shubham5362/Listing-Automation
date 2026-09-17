from app.agents.base import AgentContext, AgentResult, AgentTask
from app.services.order_ops import OrderOpsService
from app.services.returns_ai import ReturnsSupportAIService
from app.services.finance_intelligence import FinanceIntelligenceService
from app.services.advertising_ai import AdvertisingAIService

class RuleAgent:
    name = "rule"
    def run(self, context: AgentContext, task: AgentTask) -> AgentResult:
        return AgentResult(self.name, task.name, "completed", {"seller_account_id": context.seller_account_id, **task.input}, task.requires_approval)

def _result(name, context, task, output): return AgentResult(name, task.name, "completed", {"seller_account_id": context.seller_account_id, **output}, task.requires_approval)
class InventoryAgent(RuleAgent):
    name="inventory"
    def run(self, context, task):
        qty=float(task.input.get("available",0)); reorder=float(task.input.get("reorder_level",0)); return _result(self.name,context,task,{"action":"reorder" if qty<=reorder else "monitor","available":qty,"reorder_level":reorder})
class PricingAgent(RuleAgent):
    name="pricing"
    def run(self, context, task):
        price=float(task.input.get("price",0)); competitor=task.input.get("competitor_price"); minimum=task.input.get("min_price"); maximum=task.input.get("max_price"); recommended=price
        if competitor is not None: recommended=float(competitor)-0.01
        if minimum is not None: recommended=max(recommended,float(minimum))
        if maximum is not None: recommended=min(recommended,float(maximum))
        return _result(self.name,context,task,{"action":"reprice" if recommended!=price else "hold","recommended_price":round(recommended,2)})
class ListingAgent(RuleAgent):
    name="listing"
    def run(self, context, task):
        score=float(task.input.get("quality_score",0)); return _result(self.name,context,task,{"action":"approve" if score>=80 else "review","quality_score":score})
class OrderAgent(RuleAgent):
    name="order"
    def run(self, context, task):
        status=str(task.input.get("status","")); ordered_at=task.input.get("ordered_at")
        if hasattr(ordered_at,"isoformat"):
            r=OrderOpsService.analyze(status=status,ordered_at=ordered_at,ship_by_hours=int(task.input.get("ship_by_hours",24)),cancel_risk_hours=int(task.input.get("cancel_risk_hours",12)),historical_hours=list(task.input.get("historical_hours",[])),has_tracking=bool(task.input.get("has_tracking",False)))
            return _result(self.name,context,task,{"action":r.recommended_action,"fulfillment_status":r.fulfillment_status,"sla_status":r.sla_status,"late_shipment_risk":r.late_shipment_risk,"cancellation_risk":r.cancellation_risk,"anomaly":r.anomaly,"risk_score":r.risk_score,"priority":r.priority,"reasons":r.reasons})
        return _result(self.name,context,task,{"action":"escalate" if status in {"cancelled","delayed","exception"} else "continue","status":status})
class ReturnAgent(RuleAgent):
    name="return"
    def run(self, context, task):
        r=ReturnsSupportAIService.analyze_return(str(task.input.get("reason","")),task.input.get("customer_note"),float(task.input.get("refund_amount",0)))
        return _result(self.name,context,task,{"action":"escalate" if r.escalation=="manual_review" else "review","category":r.category,"risk":r.risk,"escalation":r.escalation,"confidence":r.confidence,"reasons":r.reasons})
class FinanceAgent(RuleAgent):
    name="finance"
    def run(self, context, task):
        rows=task.input.get("entries", [])
        if rows and all(hasattr(row, "entry_type") for row in rows):
            result=FinanceIntelligenceService.insight(rows)
            return _result(self.name,context,task,{"action":"investigate" if result.anomalies else "monitor","net_profit":result.net_profit,"profit_margin_percent":result.profit_margin_percent,"cash_flow":result.cash_flow,"anomalies":result.anomalies,"recommendations":result.recommendations})
        revenue=float(task.input.get("revenue",0)); expenses=float(task.input.get("expenses",0)); return _result(self.name,context,task,{"net_profit":round(revenue-expenses,2),"action":"investigate" if expenses>revenue else "monitor"})
class AdsAgent(RuleAgent):
    name="ads"
    def run(self, context, task):
        if "spend" in task.input or "sales" in task.input:
            r=AdvertisingAIService.optimize(spend=float(task.input.get("spend",0)), sales=float(task.input.get("sales",0)), clicks=int(task.input.get("clicks",0)), conversions=int(task.input.get("conversions",0)), daily_budget=float(task.input.get("daily_budget",0)), target_acos=float(task.input.get("target_acos",30)), max_budget_step_percent=float(task.input.get("max_budget_step_percent",15)))
            return _result(self.name,context,task,{"action":r.action,"confidence":r.confidence,"reasons":r.reasons,"recommended_budget":r.recommended_budget,"bid_multiplier":r.bid_multiplier,"waste_score":r.waste_score})
        acos=float(task.input.get("acos",0)); roas=float(task.input.get("roas",0)); action="scale" if roas>=4 and acos<=25 else "reduce" if acos>40 or roas<1 else "monitor"; return _result(self.name,context,task,{"action":action,"acos":acos,"roas":roas})
class CustomerSupportAgent(RuleAgent):
    name="customer_support"
    def run(self, context, task):
        r=ReturnsSupportAIService.analyze_support(str(task.input.get("subject","")),str(task.input.get("message","")),str(task.input.get("priority","normal")),task.input.get("customer_name"),str(task.input.get("tone","professional")),str(task.input.get("language","auto")))
        return _result(self.name,context,task,{"action":"escalate" if r.escalation in {"immediate","manual_review"} else "draft_reply","category":r.category,"sentiment":r.sentiment,"priority":r.priority,"escalation":r.escalation,"confidence":r.confidence,"reasons":r.reasons,"reply":r.reply})
class ComplianceAgent(RuleAgent):
    name="compliance"
    def run(self, context, task):
        issues=list(task.input.get("issues",[])); return _result(self.name,context,task,{"action":"block" if issues else "pass","issues":issues})
class ResearchAgent(RuleAgent):
    name="research"
    def run(self, context, task):
        competitors=list(task.input.get("competitors",[])); return _result(self.name,context,task,{"action":"compare","competitor_count":len(competitors),"competitors":competitors})
class NotificationAgent(RuleAgent):
    name="notification"
    def run(self, context, task):
        channel=str(task.input.get("channel","in_app")); message=str(task.input.get("message","")); return _result(self.name,context,task,{"action":"send","channel":channel,"message":message})
