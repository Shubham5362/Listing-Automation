from fastapi import APIRouter
from app.api.accounts import router as accounts_router
from app.api.actions import router as actions_router
from app.api.advertising import router as advertising_router
from app.api.advertising_ai import router as advertising_ai_router
from app.api.agents import router as agents_router
from app.api.ai_command import router as ai_command_router
from app.api.ai_listing import router as ai_listing_router
from app.api.ai_seller_agent import router as ai_seller_agent_router
from app.api.personal_ai_seller_agent import router as personal_ai_seller_agent_router
from app.api.personal_finance import router as personal_finance_router
from app.api.personal_listing_automation import router as personal_listing_automation_router
from app.api.product_knowledge import router as product_knowledge_router
from app.api.marketplace_adapters import router as marketplace_adapters_router
from app.api.marketplace_catalog import router as marketplace_catalog_router
from app.api.marketplace_changes import router as marketplace_changes_router
from app.api.marketplace_expansion import router as marketplace_expansion_router
from app.api.autofill import router as autofill_router
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
from app.api.advanced_business_intelligence import router as advanced_business_intelligence_router
from app.api.growth_opportunities import router as growth_opportunities_router
from app.api.strategy_action_planner import router as strategy_action_planner_router
from app.api.operations_autopilot import router as operations_autopilot_router
from app.api.operations_workspace import router as operations_workspace_router
from app.api.operations_control import router as operations_control_router
from app.api.seller_operations import router as seller_operations_router
from app.api.personal_marketplaces import router as personal_marketplaces_router
from app.api.realtime import router as realtime_router
from app.api.seller_intelligence import router as seller_intelligence_router
from app.api.ui_compat import router as ui_compat_router
from app.api.listing_intelligence import router as listing_intelligence_router
from app.api.diagnostics import router as diagnostics_router
from app.api import diagnostic_fix_api, diagnostic_verify_api
from app.api.vision import router as vision_router
from app.api.listing_validation import router as listing_validation_router
from app.api.learning import router as learning_router
from app.api.autonomous import router as autonomous_router
from app.api.autonomous_execution import router as autonomous_execution_router
from app.api.predictive_intelligence import router as predictive_intelligence_router
from app.api.production import router as production_router
from app.api.reliability import router as reliability_router
from app.api.final_ai_seller_os import router as final_ai_seller_os_router
from app.api.seller_os_v2 import router as seller_os_v2_router
from app.api.release_readiness import router as release_readiness_router

api_router = APIRouter(prefix="/api/v1")
for router in [auth_router, accounts_router, jobs_router, actions_router, marketplaces_router, personal_marketplaces_router, personal_ai_seller_agent_router, personal_finance_router, personal_listing_automation_router, product_knowledge_router, marketplace_adapters_router, marketplace_catalog_router, marketplace_changes_router, marketplace_expansion_router, autofill_router, marketplace_operations_router, listing_operations_router, catalog_router, catalog_intelligence_router, media_router, ai_listing_router, listing_intelligence_router, diagnostics_router, vision_router, listing_validation_router, learning_router, autonomous_router, autonomous_execution_router, predictive_intelligence_router, production_router, reliability_router, final_ai_seller_os_router, seller_os_v2_router, release_readiness_router, advanced_business_intelligence_router, inventory_router, inventory_intelligence_router, orders_router, order_ops_router, pricing_router, returns_router, finance_router, finance_intelligence_router, advertising_router, advertising_ai_router, seller_intelligence_router, dashboard_router, advanced_analytics_router, business_intelligence_router, growth_opportunities_router, strategy_action_planner_router, operations_autopilot_router, operations_workspace_router, operations_control_router, seller_operations_router, ai_seller_agent_router, agents_router, automation_router, notifications_router, monitoring_router, ai_command_router, realtime_router, ui_compat_router]:
    api_router.include_router(router)

@api_router.get("/status", tags=["system"])
def status() -> dict[str, str]:
    return {"service": "seller-hub", "status": "ready"}
