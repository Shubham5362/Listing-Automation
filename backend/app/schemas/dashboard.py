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
