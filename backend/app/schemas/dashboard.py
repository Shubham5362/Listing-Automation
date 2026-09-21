from pydantic import BaseModel


class DashboardKpis(BaseModel):
    revenue: float
    expenses: float
    net_profit: float
    orders: int
    units: int
    average_order_value: float
    inventory_units: int
    low_stock_items: int
    returns: int
    cancellations: int
    active_listings: int
    buy_box_rate: float
    revenue_growth: float = 0.0
    orders_growth: float = 0.0
    net_profit_growth: float = 0.0
    profit_margin: float = 0.0
    profit_margin_growth: float = 0.0
    returns_growth: float = 0.0
    inventory_value: str = ""
    inventory_value_numeric: float = 0.0
    inventory_value_growth: float = 0.0


class DashboardMarketplaceRow(BaseModel):
    marketplace: str
    revenue: float
    orders: int
    units: int
    net_profit: float
    inventory_units: int
    returns: int
    cancellations: int


class DashboardTrendRow(BaseModel):
    key: str
    revenue: float
    expenses: float
    net_profit: float
    orders: int
    units: int


class DashboardProductRow(BaseModel):
    product_id: int
    sku: str
    title: str
    revenue: float
    units: int
    orders: int
    net_profit: float
    name: str = ""
    rank: int = 1
    margin: float = 0.0


class DashboardAlert(BaseModel):
    type: str
    severity: str
    message: str
    count: int


class DashboardRead(BaseModel):
    period_start: str
    period_end: str
    kpis: DashboardKpis
    marketplaces: list[DashboardMarketplaceRow]
    trends: list[DashboardTrendRow]
    top_products: list[DashboardProductRow]
    alerts: list[DashboardAlert]
    user: dict[str, object] | None = None
    sales_trend: dict[str, object] | None = None
    profit_trend: list[dict[str, object]] | None = None
    order_status: dict[str, object] | None = None
    marketplace_health: list[dict[str, object]] | None = None
    inventory_health: dict[str, object] | None = None
    needs_attention: list[dict[str, object]] | None = None
    recent_activity: list[dict[str, object]] | None = None
    copilot_insight: dict[str, object] | None = None
