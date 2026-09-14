from fastapi import APIRouter

from app.api.accounts import router as accounts_router
from app.api.advanced_analytics import router as advanced_analytics_router
from app.api.advertising import router as advertising_router
from app.api.ai_command import router as ai_command_router
from app.api.ai_listing import router as ai_listing_router
from app.api.ai_seller_agent import router as ai_seller_agent_router
from app.api.automation import router as automation_router
from app.api.catalog import router as catalog_router
from app.api.catalog_intelligence import router as catalog_intelligence_router
from app.api.dashboard import router as dashboard_router
from app.api.finance import router as finance_router
from app.api.finance_intelligence import router as finance_intelligence_router
from app.api.growth_opportunities import router as growth_opportunities_router
from app.api.inventory import router as inventory_router
from app.api.inventory_intelligence import router as inventory_intelligence_router
from app.api.jobs import router as jobs_router
from app.api.listing_operations import router as listing_operations_router
from app.api.marketplace_operations import router as marketplace_operations_router
from app.api.marketplaces import router as marketplaces_router
from app.api.media import router as media_router
from app.api.monitoring import router as monitoring_router
from app.api.notifications import router as notifications_router
from app.api.operations_autopilot import router as operations_autopilot_router
from app.api.operations_workspace import router as operations_workspace_router
from app.api.order_ops import router as order_ops_router
from app.api.orders import router as orders_router
from app.api.pricing import router as pricing_router
from app.api.realtime import router as realtime_router
from app.api.returns import router as returns_router
from app.api.strategy_action_planner import router as strategy_action_planner_router
from app.api.ui_compat import router as ui_compat_router

api_router = APIRouter(prefix="/api/v1")
for router in (
    accounts_router, advanced_analytics_router, advertising_router, ai_command_router,
    ai_listing_router, ai_seller_agent_router, automation_router, catalog_router,
    catalog_intelligence_router, dashboard_router, finance_router, finance_intelligence_router,
    growth_opportunities_router, inventory_router, inventory_intelligence_router, jobs_router,
    listing_operations_router, marketplace_operations_router, marketplaces_router, media_router,
    monitoring_router, notifications_router, operations_autopilot_router,
    operations_workspace_router, order_ops_router, orders_router, pricing_router,
    realtime_router, returns_router, strategy_action_planner_router, ui_compat_router,
):
    api_router.include_router(router)
