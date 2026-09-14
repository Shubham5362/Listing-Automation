from fastapi import APIRouter
from app.api.accounts import router as accounts_router
from app.api.actions import router as actions_router
from app.api.advertising import router as advertising_router
from app.api.advertising_ai import router as advertising_ai_router
from app.api.agents import router as agents_router
from app.api.ai_command import router as ai_command_router
from app.api.ai_listing import router as ai_listing_router
from app.api.ai_seller_agent import router as ai_seller_agent_router
from app.api.auth import router as auth_router
from app.api.automation import router as automation_router
from app.api.catalog import router as catalog_router
from app.api.catalog_intelligence import router as catalog_intelligence_router
from app.api.dashboard import router as dashboard_router
from app.api.finance import router as finance_router
from app.api.finance_intelligence import router as finance_intelligence_router
from app.api.inventory import router as inventory_router
from app.api.inventory_intelligence import router as inventory_intelligence_router
from app.api.jobs import router as jobs_router
from app.api.listing_operations import router as listing_operations_router
from app.api.marketplaces import router as marketplaces_router
from app.api.marketplace_operations import router as marketplace_operations_router
from app.api.media import router as media_router
from app.api.notifications import router as notifications_router
from app.api.monitoring import router as monitoring_router
from app.api.order_ops import router as order_ops_router
from app.api.orders import router as orders_router
from app.api.pricing import router as pricing_router
from app.api.returns import router as returns_router
from app.api.advanced_analytics import router as advanced_analytics_router
from app.api.business_intelligence import router as business_intelligence_router
from app.api.growth_opportunities import router as growth_opportunities_router
from app.api.strategy_action_planner import router as strategy_action_planner_router
from app.api.operations_autopilot import router as operations_autopilot_router
from app.api.operations_workspace import router as operations_workspace_router
from app.api.realtime import router as realtime_router
from app.api.ui_compat import router as ui_compat_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router); api_router.include_router(accounts_router); api_router.include_router(jobs_router); api_router.include_router(actions_router); api_router.include_router(marketplaces_router); api_router.include_router(marketplace_operations_router); api_router.include_router(listing_operations_router); api_router.include_router(catalog_router); api_router.include_router(catalog_intelligence_router); api_router.include_router(media_router); api_router.include_router(ai_listing_router); api_router.include_router(inventory_router); api_router.include_router(inventory_intelligence_router); api_router.include_router(orders_router); api_router.include_router(order_ops_router); api_router.include_router(pricing_router); api_router.include_router(returns_router); api_router.include_router(finance_router); api_router.include_router(finance_intelligence_router); api_router.include_router(advertising_router); api_router.include_router(advertising_ai_router); api_router.include_router(dashboard_router); api_router.include_router(advanced_analytics_router); api_router.include_router(business_intelligence_router); api_router.include_router(growth_opportunities_router); api_router.include_router(strategy_action_planner_router); api_router.include_router(operations_autopilot_router); api_router.include_router(operations_workspace_router); api_router.include_router(ai_seller_agent_router); api_router.include_router(agents_router); api_router.include_router(automation_router); api_router.include_router(notifications_router); api_router.include_router(monitoring_router); api_router.include_router(ai_command_router); api_router.include_router(realtime_router); api_router.include_router(ui_compat_router)

@api_router.get("/status", tags=["system"])
def status() -> dict[str, str]:
    return {"service": "seller-hub", "status": "ready"}
