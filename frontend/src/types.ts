export interface UserProfile {
  name: string;
  role: string;
  store: string;
  email: string;
}

export interface KpisData {
  revenue: number;
  revenue_growth: number;
  orders: number;
  orders_growth: number;
  net_profit: number;
  net_profit_growth: number;
  profit_margin: number;
  profit_margin_growth: number;
  returns: number;
  returns_growth: number;
  inventory_value: string;
  inventory_value_numeric: number;
  inventory_value_growth: number;
  active_listings: number;
  buy_box_rate: number;
}

export interface SalesTimelinePoint {
  day: string;
  amazon: number;
  flipkart: number;
  total: number;
}

export interface MarketplaceSalesBreakdown {
  name: string;
  revenue: number;
  growth: number;
  share_percent: number;
  orders: number;
}

export interface SalesTrendData {
  total: number;
  growth: number;
  timeline: SalesTimelinePoint[];
  marketplaces: MarketplaceSalesBreakdown[];
}

export interface ProfitTrendPoint {
  day: string;
  profit: number;
}

export interface OrderStatusSegment {
  name: string;
  count: number;
  percent: number;
  color: string;
}

export interface OrderStatusData {
  total: number;
  breakdown: OrderStatusSegment[];
}

export interface MarketplaceHealthItem {
  id: number;
  marketplace: string;
  status: string;
  listings: number;
  last_sync: string;
  api_status: string;
  connected: boolean;
}

export interface InventoryHealthData {
  health_score: number;
  total_items: number;
  healthy: number;
  low_stock: number;
  out_of_stock: number;
  dead_stock: number;
}

export interface TopProductItem {
  id?: number;
  product_id?: number;
  sku?: string;
  title?: string;
  rank: number;
  name: string;
  revenue: number;
  units: number;
  margin: number;
}

export interface AttentionItem {
  id: number;
  category: string;
  severity: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  riskText?: string;
  primaryAction: string;
  secondaryAction?: string;
  actionType: string;
  data?: any;
}

export interface RecentActivityItem {
  id: number;
  type: string;
  title: string;
  time: string;
  icon: 'cart' | 'box' | 'amazon' | 'tag' | 'return' | 'alert';
}

export interface CopilotInsight {
  alert: {
    title: string;
    subtitle: string;
    sku: string;
  };
  context: string;
  finding: string;
  why: string[];
  recommendation: {
    title: string;
    cover: string;
  };
  status: string;
}

export interface DashboardResponse {
  period_start: string;
  period_end: string;
  user: UserProfile;
  kpis: KpisData;
  sales_trend: SalesTrendData;
  profit_trend: ProfitTrendPoint[];
  order_status: OrderStatusData;
  marketplace_health: MarketplaceHealthItem[];
  inventory_health: InventoryHealthData;
  top_products: TopProductItem[];
  needs_attention: AttentionItem[];
  recent_activity: RecentActivityItem[];
  copilot_insight: CopilotInsight;
}

export interface OrderProductItem {
  id: string;
  name: string;
  sku: string;
  imageType: 'bottle-black' | 'bottle-steel' | 'tumbler' | 'mug' | 'flask' | 'bowl';
  quantity: number;
  unitPrice: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  date: string;
  time: string;
  marketplace: 'Amazon' | 'Flipkart';
  customer: {
    name: string;
    cityState: string;
    phone: string;
    email: string;
    address: string;
  };
  products: OrderProductItem[];
  moreProductsCount?: number;
  amount: number;
  currency: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled' | 'Return Requested';
  paymentMethod: string;
  deliveredOn?: string;
  tracking: {
    courier: string;
    trackingId: string;
    status: string;
    deliveredOn?: string;
  };
}

export interface ProductCatalogItem {
  id: string | number;
  name: string;
  sku: string;
  category: string;
  brand: string;
  hsnCode: string;
  weight: string;
  dimensions: string;
  createdOn: string;
  lastUpdated: string;
  imageType: 'bottle-black' | 'tumbler' | 'mug' | 'bottle-blue' | 'bottle-yellow' | 'shaker-black' | 'bottle-copper' | 'bottle-glass' | 'flask-silver' | 'sipper-pink' | string;
  marketplaces: ('amazon' | 'flipkart')[];
  stock: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  price: number;
  revenue30d: number;
  margin: number;
  listingStatus: 'Active' | 'Inactive' | 'Suppressed' | 'Archived';
  asin?: string;
  flipkartFsn?: string;
  reservedStock?: number;
  inboundStock?: number;
  availableStock?: number;
  growthMetrics?: {
    revenueGrowth: number;
    unitsSold: number;
    unitsSoldGrowth: number;
    averagePrice: number;
    marginGrowth: number;
  };
}

export interface ListingItem {
  id: string | number;
  name: string;
  asin: string;
  sku: string;
  marketplace: 'amazon' | 'flipkart';
  marketplaces?: ('amazon' | 'flipkart')[];
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  status: 'Active' | 'Inactive' | 'Suppressed' | 'Needs Fix' | 'Draft';
  listingQuality: number; // percentage (e.g. 92)
  issuesCount: number; // 0 for "-"
  category: string;
  brand: string;
  manufacturing: string;
  hsnCode: string;
  createdOn: string;
  lastUpdated: string;
  imageType: string;
  fulfilledBy: string;
  qualityChecklist?: {
    titleOptimized: boolean;
    imagesCount: string;
    bulletPointsCount: string;
    description: boolean;
    aPlusContent: boolean;
    searchKeywords: boolean;
  };
}

export interface InventoryItem {
  id: string | number;
  name: string;
  category: string;
  sku: string;
  asin: string;
  marketplaces: ('amazon' | 'flipkart')[];
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  reorderPoint: number;
  maxStockLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  imageType: string;
  price: number;
  mrp: number;
  costPrice: number;
  margin: number;
  totalStockValue: number;
  avgDailySales: number;
  estimatedDays: number;
  demandTrend: string;
  aiForecast30d: number;
  lastUpdated: string;
}

export interface ReturnRecord {
  id: string | number;
  returnId: string;
  orderId: string;
  orderDisplayId: string;
  marketplace: 'Amazon' | 'Flipkart';
  product: {
    name: string;
    sku: string;
    imageType: string;
    price: number;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    initials: string;
  };
  reason: string;
  status: 'Pending' | 'Approved' | 'Refunded' | 'Replacement' | 'Rejected';
  requestedOn: string;
  requestedOnFull: string;
  returnWindow: string;
  refundAmount: number;
  returnLabelStatus?: string;
  returnImages?: {
    id: string;
    title: string;
    type: string;
  }[];
  timeline?: {
    date: string;
    title: string;
    desc: string;
    by: string;
  }[];
  notes?: {
    id: string;
    author: string;
    date: string;
    text: string;
  }[];
}

export interface PricingRecord {
  id: number;
  name: string;
  category: string;
  sku: string;
  asin: string;
  marketplaces: ('amazon' | 'flipkart')[];
  currentPrice: number;
  suggestedPrice: number;
  hasAiSuggested?: boolean;
  priceStatus: 'Optimal' | 'Reprice' | 'Overpriced' | 'Underpriced';
  buyBox: string;
  buyBoxWon: boolean;
  estProfitLift: number;
  minPrice: number;
  maxPrice: number;
  costPrice: number;
  marginPercent: number;
  marginAmount: number;
  marketPriceAvg: number;
  priceRank: string;
  lowestCompetitorPrice: number;
  totalCompetitors: number;
  aiInsightText?: string;
  imageType: string;
}

export interface CampaignRecord {
  id: number;
  campaignName: string;
  productName: string;
  type: 'Sponsored Brand' | 'Sponsored Products' | 'Sponsored Display';
  marketplace: 'amazon' | 'flipkart';
  status: 'Active' | 'Paused' | 'Ended';
  dailyBudget: number;
  adSpend: number;
  salesAd: number;
  acos: number;
  roas: number;
  imageType: string;
  startDate: string;
  endDate: string;
  clicks: number;
  clicksGrowth: string;
  impressions: number;
  impressionsGrowth: string;
  ctr: number;
  ctrGrowth: string;
  cpc: number;
  cpcGrowth: string;
  ordersAd: number;
  ordersAdGrowth: string;
  salesAdGrowth: string;
  topKeywords: {
    keyword: string;
    clicks: number;
    acos: number;
  }[];
}

