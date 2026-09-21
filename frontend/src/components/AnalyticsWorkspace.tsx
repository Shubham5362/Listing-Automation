import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Upload,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
  Edit2,
  FileText,
  ChevronRight,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ShoppingBag,
  Package,
  Tag,
  CircleDollarSign,
  RotateCcw,
  BarChart2,
  Store,
  Layers,
  Users,
  Download,
  Check,
  Info,
  Lightbulb,
  X
} from 'lucide-react';
import AnalyticsTrendChart from './AnalyticsTrendChart';
import AnalyticsMarketplaceDonut from './AnalyticsMarketplaceDonut';
import AnalyticsProfitabilityChart from './AnalyticsProfitabilityChart';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import { AmazonLogo, FlipkartLogo } from './Sidebar';

export interface ProductAnalyticsRow {
  id: string;
  name: string;
  sku: string;
  marketplace: 'amazon' | 'flipkart';
  unitsSold: number;
  sales: number;
  salesDisplay: string;
  profitEst: number;
  profitEstDisplay: string;
  roi: number;
  views: number;
  viewsDisplay: string;
  conversion: number;
  imageType: string;
}

const initialProductAnalytics: ProductAnalyticsRow[] = [
  {
    id: '1',
    name: 'Stainless Steel Bottle 1L',
    sku: 'SB-1L-001',
    marketplace: 'amazon',
    unitsSold: 842,
    sales: 420580,
    salesDisplay: '₹4,20,580',
    profitEst: 105230,
    profitEstDisplay: '₹1,05,230',
    roi: 32,
    views: 12450,
    viewsDisplay: '12,450',
    conversion: 6.8,
    imageType: 'bottle-black',
  },
  {
    id: '2',
    name: 'Insulated Tumbler 500ml',
    sku: 'IT-500-002',
    marketplace: 'flipkart',
    unitsSold: 520,
    sales: 259480,
    salesDisplay: '₹2,59,480',
    profitEst: 62340,
    profitEstDisplay: '₹62,340',
    roi: 28,
    views: 8230,
    viewsDisplay: '8,230',
    conversion: 6.3,
    imageType: 'tumbler',
  },
  {
    id: '3',
    name: 'Travel Mug Premium',
    sku: 'TM-PR-003',
    marketplace: 'amazon',
    unitsSold: 310,
    sales: 216900,
    salesDisplay: '₹2,16,900',
    profitEst: 48120,
    profitEstDisplay: '₹48,120',
    roi: 26,
    views: 6780,
    viewsDisplay: '6,780',
    conversion: 5.9,
    imageType: 'mug',
  },
  {
    id: '4',
    name: 'Water Bottle 750ml',
    sku: 'WB-750-004',
    marketplace: 'flipkart',
    unitsSold: 281,
    sales: 98690,
    salesDisplay: '₹98,690',
    profitEst: 22450,
    profitEstDisplay: '₹22,450',
    roi: 29,
    views: 5420,
    viewsDisplay: '5,420',
    conversion: 5.2,
    imageType: 'bottle-blue',
  },
  {
    id: '5',
    name: 'Kids Bottle 500ml',
    sku: 'KB-500-005',
    marketplace: 'amazon',
    unitsSold: 246,
    sales: 73554,
    salesDisplay: '₹73,554',
    profitEst: 18340,
    profitEstDisplay: '₹18,340',
    roi: 25,
    views: 4980,
    viewsDisplay: '4,980',
    conversion: 4.9,
    imageType: 'bottle-yellow',
  },
];

const categoryDistribution = [
  { name: 'Home & Kitchen', percent: 28.5 },
  { name: 'Sports & Fitness', percent: 18.3 },
  { name: 'Beauty & Personal Care', percent: 14.2 },
  { name: 'Electronics', percent: 12.6 },
  { name: 'Fashion', percent: 9.8 },
  { name: 'Others', percent: 16.6 },
];

interface AnalyticsWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

export default function AnalyticsWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'all',
  onSelectMarketplaceFilter,
}: AnalyticsWorkspaceProps) {
  // State
  const [activePerformanceTab, setActivePerformanceTab] = useState<
    'Product Performance' | 'Marketplace Performance' | 'Category Performance' | 'Search Terms' | 'Customer Insights'
  >('Product Performance');

  const [dateRange, setDateRange] = useState('Dec 1, 2024 - Dec 15, 2024');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeframeFilter, setTimeframeFilter] = useState('Last 30 Days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

  const [productAnalytics, setProductAnalytics] = useState<ProductAnalyticsRow[]>(initialProductAnalytics);
  const [analyticsKpis, setAnalyticsKpis] = useState({
    revenue: 1248350,
    orders: 2845,
    units: 3124,
    conversion_rate: 4.8,
    average_order_value: 438,
    returns_rate: 2.1,
    profit_est: 248670,
  });

  // Sync with backend advanced-analytics API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/v1/advanced-analytics');
        if (res.ok) {
          const data = await res.json();
          if (data.kpis) {
            setAnalyticsKpis({
              revenue: data.kpis.revenue || 1248350,
              orders: data.kpis.orders || 2845,
              units: data.kpis.units || 3124,
              conversion_rate: 4.8,
              average_order_value: Math.round(data.kpis.average_order_value || 438),
              returns_rate: 2.1,
              profit_est: Math.round(data.kpis.net_profit || 248670),
            });
          }
          if (data.products && data.products.length > 0) {
            const mapped: ProductAnalyticsRow[] = data.products.map((p: any, idx: number) => {
              const sku = p.sku || `SKU-${idx + 1}`;
              const s = sku.toLowerCase();
              const imgType = s.includes('tum') || s.includes('shk') ? 'tumbler' : s.includes('mug') ? 'mug' : s.includes('gla') ? 'bottle-glass' : s.includes('cop') ? 'bottle-copper' : 'bottle-black';
              const units = p.units || 10;
              const rev = p.revenue || units * 499;
              const profit = Math.round(rev * ((p.margin_percent || 25) / 100));
              const views = units * 18;
              return {
                id: String(p.product_id || idx + 1),
                name: p.title || 'Stainless Steel Bottle',
                sku: sku,
                marketplace: idx % 2 === 0 ? 'amazon' : 'flipkart',
                unitsSold: units,
                sales: rev,
                salesDisplay: `₹${Math.round(rev).toLocaleString('en-IN')}`,
                profitEst: profit,
                profitEstDisplay: `₹${Math.round(profit).toLocaleString('en-IN')}`,
                roi: Math.round(p.margin_percent || 28),
                views: views,
                viewsDisplay: views.toLocaleString('en-IN'),
                conversion: 5.6,
                imageType: imgType,
              };
            });
            setProductAnalytics(mapped);
          }
        }
      } catch (err) {
        console.warn('Analytics fetch failed:', err);
      }
    };
    fetchAnalytics();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productAnalytics.filter((p) => {
      if (marketplaceFilter !== 'all' && p.marketplace !== marketplaceFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        if (!matchesName && !matchesSku) return false;
      }
      return true;
    });
  }, [productAnalytics, marketplaceFilter, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredProducts.map((p) => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const triggerExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setFeedbackToast('Analytics report generated and downloaded as PDF/CSV.');
      setTimeout(() => setFeedbackToast(null), 3500);
    }, 800);
  };

  const handleReportClick = (name: string) => {
    setFeedbackToast(`Opening "${name}"...`);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-slate-50/60">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Main Analytics Container */}
      <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
        {/* =========================================================================
            1. EXECUTIVE HEADER
           ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
              Get deep insights into your business performance across all marketplaces.
            </p>
          </div>

          {/* Right Header Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
            </div>

            {/* Marketplace Filter Dropdown */}
            <div className="relative">
              <select
                value={marketplaceFilter}
                onChange={(e) => setMarketplaceFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200/90 hover:border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="all">All Marketplaces</option>
                <option value="amazon">Amazon Only</option>
                <option value="flipkart">Flipkart Only</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Export Report Button */}
            <button
              onClick={triggerExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 rotate-180" />
              <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
            </button>

            {/* Overflow Trigger */}
            <button
              onClick={() => {
                setFeedbackToast('Additional view options: Refresh data, Customize cards.');
                setTimeout(() => setFeedbackToast(null), 2500);
              }}
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-slate-500 shadow-2xs transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. TOP ROW OF 6 KPI METRIC CARDS
           ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {/* Card 1: Total Sales */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 truncate">Total Sales</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                ₹{Math.round(analyticsKpis.revenue).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑ 18.3%</span>
                <span className="text-slate-400 font-normal">vs last 30 days</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 truncate">Total Orders</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {analyticsKpis.orders.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑ 12.6%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Units Sold */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 truncate">Units Sold</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {analyticsKpis.units.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑ 15.8%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Avg. Order Value */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 truncate">Avg. Order Value</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                ₹{Math.round(analyticsKpis.average_order_value).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑ 5.1%</span>
              </div>
            </div>
          </div>

          {/* Card 5: Profit (Est.) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CircleDollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 truncate">Profit (Est.)</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                ₹{Math.round(analyticsKpis.profit_est).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑ 22.4%</span>
              </div>
            </div>
          </div>

          {/* Card 6: Return Rate */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 truncate">Return Rate</span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                2.8%
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                <span>↑ 0.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. MAIN WORKSPACE GRID: LEFT CONTENT + RIGHT INSIGHTS PANEL
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* -----------------------------------------------------------------
              LEFT COLUMN (9 COLS)
             ----------------------------------------------------------------- */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5 min-w-0">
            {/* Sales & Orders Trend Card */}
            <AnalyticsTrendChart />

            {/* 3-Card Row: Sales by Marketplace, Top Categories, Profitability */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {/* Card 1: Sales by Marketplace */}
              <div className="h-full">
                <AnalyticsMarketplaceDonut />
              </div>

              {/* Card 2: Top Categories */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full">
                <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  Top Categories
                </h3>
                <div className="space-y-3 my-auto py-1">
                  {categoryDistribution.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-600 truncate">{cat.name}</span>
                        <span className="text-slate-500 ml-2 shrink-0">{cat.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${cat.percent * 2.8}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Profitability */}
              <div className="h-full">
                <AnalyticsProfitabilityChart />
              </div>
            </div>

            {/* ===============================================================
                PERFORMANCE TABS & PRODUCT ANALYTICS TABLE
               =============================================================== */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {/* Performance Tabs Navigation */}
              <div className="border-b border-slate-200 px-5 pt-3 flex items-center gap-6 overflow-x-auto no-scrollbar">
                {(
                  [
                    'Product Performance',
                    'Marketplace Performance',
                    'Category Performance',
                    'Search Terms',
                    'Customer Insights',
                  ] as const
                ).map((tab) => {
                  const isActive = activePerformanceTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActivePerformanceTab(tab)}
                      className={`pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors relative ${
                        isActive
                          ? 'text-blue-600'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search and Filters Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, SKU, ASIN..."
                    className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* All Marketplaces */}
                  <div className="relative">
                    <select
                      value={marketplaceFilter}
                      onChange={(e) => setMarketplaceFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none cursor-pointer"
                    >
                      <option value="all">All Marketplaces</option>
                      <option value="amazon">Amazon Only</option>
                      <option value="flipkart">Flipkart Only</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* All Categories */}
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="kitchen">Home & Kitchen</option>
                      <option value="fitness">Sports & Fitness</option>
                      <option value="beauty">Beauty & Personal Care</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Last 30 Days */}
                  <div className="relative">
                    <select
                      value={timeframeFilter}
                      onChange={(e) => setTimeframeFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none cursor-pointer"
                    >
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="Last 7 Days">Last 7 Days</option>
                      <option value="Last 90 Days">Last 90 Days</option>
                      <option value="Year to Date">Year to Date</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* More Filters button */}
                  <button
                    onClick={() => {
                      setFeedbackToast('Advanced filter criteria: ROI range, Views, and Conversion rate.');
                      setTimeout(() => setFeedbackToast(null), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>More Filters</span>
                  </button>
                </div>
              </div>

              {/* Product Analytics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredProducts.length > 0 &&
                            selectedRows.length === filteredProducts.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Marketplace</th>
                      <th className="py-3 px-3 text-right">Units Sold</th>
                      <th className="py-3 px-3 text-right">Sales</th>
                      <th className="py-3 px-3 text-right">Profit (Est.)</th>
                      <th className="py-3 px-3 text-right">ROI</th>
                      <th className="py-3 px-3 text-right">Views</th>
                      <th className="py-3 px-3 text-right">Conversion</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredProducts.map((p) => {
                      const isSelected = selectedRows.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition-colors group ${
                            isSelected ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(p.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* Product Info */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <ProductCatalogGraphic
                                type={p.sku}
                                className="w-9 h-9 shrink-0"
                              />
                              <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {p.name}
                              </span>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                            {p.sku}
                          </td>

                          {/* Marketplace */}
                          <td className="py-3.5 px-3">
                            {p.marketplace === 'amazon' ? (
                              <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200/60 flex items-center justify-center p-0.5">
                                <AmazonLogo className="w-4 h-4 text-slate-900" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-200/60 flex items-center justify-center p-0.5">
                                <FlipkartLogo className="w-4 h-4" />
                              </div>
                            )}
                          </td>

                          {/* Units Sold */}
                          <td className="py-3.5 px-3 text-right font-medium text-slate-900">
                            {p.unitsSold}
                          </td>

                          {/* Sales */}
                          <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                            {p.salesDisplay}
                          </td>

                          {/* Profit (Est.) */}
                          <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                            {p.profitEstDisplay}
                          </td>

                          {/* ROI */}
                          <td className="py-3.5 px-3 text-right font-medium text-slate-900">
                            {p.roi}%
                          </td>

                          {/* Views */}
                          <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                            {p.viewsDisplay}
                          </td>

                          {/* Conversion */}
                          <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                            {p.conversion}%
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setFeedbackToast(`Action menu for ${p.name}`);
                                setTimeout(() => setFeedbackToast(null), 2000);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-white">
                <div>
                  Showing <span className="font-semibold text-slate-700">1</span> to{' '}
                  <span className="font-semibold text-slate-700">5</span> of{' '}
                  <span className="font-semibold text-slate-700">245</span> products
                </div>

                <div className="flex items-center gap-4">
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {[1, 2, 3, 4, 5].map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <span className="px-1 text-slate-400 font-medium">...</span>

                    <button
                      onClick={() => setCurrentPage(49)}
                      className="w-7 h-7 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      49
                    </button>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(49, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Page size dropdown */}
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none cursor-pointer"
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              RIGHT COLUMN (3-4 COLS): KEY INSIGHTS, GOALS & TARGETS, REPORTS
             ----------------------------------------------------------------- */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5">
            {/* 1. Key Insights Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Key Insights</span>
              </div>

              <div className="space-y-4">
                {/* Insight 1: Sales are up 18.3% */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Sales are up 18.3%
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Your sales have increased by 18.3% compared to the previous period.
                    </div>
                  </div>
                </div>

                {/* Insight 2: Profit margin improved */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Profit margin improved
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Your profit margin has increased by 5.2%.
                    </div>
                  </div>
                </div>

                {/* Insight 3: Return rate is higher */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Return rate is higher
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Your return rate is 0.4% higher than last month.
                    </div>
                  </div>
                </div>

                {/* Insight 4: Top performing category */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Top performing category
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Home & Kitchen accounts for 28.5% of your total sales.
                    </div>
                  </div>
                </div>

                {/* Insight 5: Opportunity */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Opportunity
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Consider increasing ads spend on Sports & Fitness category.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Goals & Targets Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Target className="w-4 h-4 text-slate-700" />
                  <span>Goals & Targets</span>
                </div>
                <button
                  onClick={() => setIsGoalsModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Goal 1: Monthly Sales Goal */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">Monthly Sales Goal</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">₹12,48,350 / ₹15,00,000</span>
                    <span className="font-bold text-slate-900">83%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '83%' }} />
                  </div>
                </div>

                {/* Goal 2: Orders Goal */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">Orders Goal</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">2,845 / 3,500</span>
                    <span className="font-bold text-slate-900">81%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '81%' }} />
                  </div>
                </div>

                {/* Goal 3: Profit Goal */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">Profit Goal</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">₹2,48,670 / ₹3,00,000</span>
                    <span className="font-bold text-slate-900">83%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '83%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Quick Reports Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-slate-700" />
                <span>Quick Reports</span>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { name: 'Sales Report', icon: BarChart2 },
                  { name: 'Product Performance', icon: ShoppingBag },
                  { name: 'Marketplace Comparison', icon: Store },
                  { name: 'Category Analysis', icon: Layers },
                  { name: 'Search Term Report', icon: Search },
                  { name: 'Customer Insights', icon: Users },
                  { name: 'Download Custom Report', icon: Download },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleReportClick(item.name)}
                      className="w-full py-2.5 flex items-center justify-between text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50/80 px-2 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Goals & Targets Modal */}
      {isGoalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Adjust Target Goals</span>
              </div>
              <button
                onClick={() => setIsGoalsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Monthly Sales Target (₹)
                </label>
                <input
                  type="text"
                  defaultValue="15,00,000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Orders Target
                </label>
                <input
                  type="text"
                  defaultValue="3,500"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Profit Target (₹)
                </label>
                <input
                  type="text"
                  defaultValue="3,00,000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsGoalsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsGoalsModalOpen(false);
                  setFeedbackToast('Goals & Targets updated successfully.');
                  setTimeout(() => setFeedbackToast(null), 2500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
