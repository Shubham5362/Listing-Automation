export interface KpisData {
  revenue: number; revenue_growth: number; expenses: number; orders: number; orders_growth: number;
  units: number; average_order_value: number; net_profit: number; net_profit_growth: number;
  profit_margin: number; profit_margin_growth: number; returns: number; returns_growth: number;
  inventory_value: string; inventory_value_numeric: number; inventory_value_growth: number;
  active_listings: number; buy_box_rate: number;
}

export interface SalesTimelinePoint { day: string; amazon: number; flipkart: number; total: number; }
export interface MarketplaceSalesBreakdown { name: string; revenue: number; growth: number; share_percent: number; orders: number; }
export interface SalesTrendData { total: number; growth: number; timeline: SalesTimelinePoint[]; marketplaces: MarketplaceSalesBreakdown[]; }
export interface ProfitTrendPoint { day: string; profit: number; }
export interface OrderStatusSegment { name: string; count: number; percent: number; color: string; }
export interface OrderStatusData { total: number; breakdown: OrderStatusSegment[]; }
export interface MarketplaceHealthItem { id: number; marketplace: string; status: string; listings: number; last_sync: string; api_status: string; connected: boolean; revenue: number; orders: number; units: number; net_profit: number; }
export interface InventoryHealthData { health_score: number; total_items: number; healthy: number; low_stock: number; out_of_stock: number; dead_stock: number; }
export interface TopProductItem { id: number; rank: number; name: string; revenue: number; units: number; margin: number; }
export interface AttentionItem { id: number; category: string; severity: string; title: string; subtitle: string; badge: string; badgeColor: string; riskText?: string; primaryAction: string; secondaryAction?: string; actionType: string; data?: unknown; }
export interface UserProfile { name: string; role: string; store: string; email: string; }
export interface DashboardResponse { period_start: string; period_end: string; user: UserProfile; kpis: KpisData; sales_trend: SalesTrendData; profit_trend: ProfitTrendPoint[]; order_status: OrderStatusData; marketplace_health: MarketplaceHealthItem[]; inventory_health: InventoryHealthData; top_products: TopProductItem[]; needs_attention: AttentionItem[]; recent_activity: Array<{ id: number; type: string; title: string; time: string; icon: 'cart' | 'box' | 'amazon' | 'tag' | 'return' | 'alert' }>; }
