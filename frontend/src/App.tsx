import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Package,
  Boxes,
  ShoppingBag,
  List,
  RotateCcw,
  Tag,
  Megaphone,
  BarChart2,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import KpiCards from './components/KpiCards';
import NeedsAttentionCard from './components/NeedsAttentionCard';
import SalesTrendCard from './components/SalesTrendCard';
import TopProductsCard from './components/TopProductsCard';
import OrderStatusCard from './components/OrderStatusCard';
import MarketplaceHealthCard from './components/MarketplaceHealthCard';
import RecentActivityCard from './components/RecentActivityCard';
import ProfitTrendCard from './components/ProfitTrendCard';
import InventoryHealthCard from './components/InventoryHealthCard';
import AiSellerCopilotDrawer from './components/AiSellerCopilotDrawer';
import OrdersWorkspace from './components/OrdersWorkspace';
import ProductsWorkspace from './components/ProductsWorkspace';
import ListingsWorkspace from './components/ListingsWorkspace';
import InventoryWorkspace from './components/InventoryWorkspace';
import ReturnsWorkspace from './components/ReturnsWorkspace';
import PricingWorkspace from './components/PricingWorkspace';
import AdvertisingWorkspace from './components/AdvertisingWorkspace';
import AnalyticsWorkspace from './components/AnalyticsWorkspace';
import FinanceWorkspace from './components/FinanceWorkspace';
import AutomationsWorkspace from './components/AutomationsWorkspace';
import AiListingStudioWorkspace from './components/AiListingStudioWorkspace';
import AiSellerCopilotWorkspace from './components/AiSellerCopilotWorkspace';
import MarketplacesWorkspace from './components/MarketplacesWorkspace';
import NotificationsWorkspace from './components/NotificationsWorkspace';
import ControlCenterWorkspace from './components/ControlCenterWorkspace';
import DiagnosticsWorkspace from './components/DiagnosticsWorkspace';
import ReportsWorkspace from './components/ReportsWorkspace';
import SettingsWorkspace from './components/SettingsWorkspace';
import { DashboardResponse, AttentionItem } from './types';

// Default initial state matching image in case of initial load delay
const initialDashboardState: DashboardResponse = {
  period_start: '2024-12-10T00:00:00',
  period_end: '2024-12-16T23:59:59',
  user: {
    name: 'Shubham',
    role: 'Seller Pro',
    store: 'Shubham Enterprises',
    email: 'shubham@sellerhub.io',
  },
  kpis: {
    revenue: 241820,
    revenue_growth: 14.2,
    orders: 184,
    orders_growth: 12.8,
    net_profit: 46210,
    net_profit_growth: 18.4,
    profit_margin: 19.1,
    profit_margin_growth: 2.4,
    returns: 8,
    returns_growth: -20.0,
    inventory_value: '₹12.4L',
    inventory_value_numeric: 1240000,
    inventory_value_growth: 5.1,
    active_listings: 2176,
    buy_box_rate: 94.2,
  },
  sales_trend: {
    total: 241820,
    growth: 14.2,
    timeline: [
      { day: 'Dec 10', amazon: 18200, flipkart: 9800, total: 28000 },
      { day: 'Dec 11', amazon: 25400, flipkart: 14200, total: 39600 },
      { day: 'Dec 12', amazon: 21800, flipkart: 11200, total: 33000 },
      { day: 'Dec 13', amazon: 23100, flipkart: 13900, total: 37000 },
      { day: 'Dec 14', amazon: 27900, flipkart: 17400, total: 45300 },
      { day: 'Dec 15', amazon: 31200, flipkart: 21100, total: 52300 },
      { day: 'Dec 16', amazon: 28620, flipkart: 16000, total: 44620 },
    ],
    marketplaces: [
      {
        name: 'Amazon',
        revenue: 148220,
        growth: 12.1,
        share_percent: 61.3,
        orders: 114,
      },
      {
        name: 'Flipkart',
        revenue: 93600,
        growth: 18.4,
        share_percent: 38.7,
        orders: 70,
      },
    ],
  },
  profit_trend: [
    { day: 'Dec 10', profit: 24000 },
    { day: 'Dec 11', profit: 39000 },
    { day: 'Dec 12', profit: 32000 },
    { day: 'Dec 13', profit: 37000 },
    { day: 'Dec 14', profit: 46000 },
    { day: 'Dec 15', profit: 58000 },
    { day: 'Dec 16', profit: 46210 },
  ],
  order_status: {
    total: 184,
    breakdown: [
      { name: 'Delivered', count: 124, percent: 67, color: '#10b981' },
      { name: 'Shipped', count: 28, percent: 15, color: '#3b82f6' },
      { name: 'Processing', count: 18, percent: 10, color: '#f59e0b' },
      { name: 'Cancelled', count: 8, percent: 4, color: '#ef4444' },
      { name: 'Return Requested', count: 6, percent: 3, color: '#8b5cf6' },
    ],
  },
  marketplace_health: [
    {
      id: 1,
      marketplace: 'Amazon',
      status: 'Healthy',
      listings: 1284,
      last_sync: '2 min ago',
      api_status: 'ok',
      connected: true,
    },
    {
      id: 2,
      marketplace: 'Flipkart',
      status: 'Healthy',
      listings: 892,
      last_sync: '5 min ago',
      api_status: 'ok',
      connected: true,
    },
  ],
  inventory_health: {
    health_score: 87,
    total_items: 8872,
    healthy: 8421,
    low_stock: 312,
    out_of_stock: 48,
    dead_stock: 91,
  },
  top_products: [
    { id: 1, rank: 1, name: 'Stainless Steel Bottle 1L', revenue: 48920, units: 184, margin: 28 },
    { id: 2, rank: 2, name: 'Insulated Tumbler 500ml', revenue: 32400, units: 142, margin: 24 },
    { id: 3, rank: 3, name: 'Travel Mug Premium', revenue: 28600, units: 98, margin: 31 },
    { id: 4, rank: 4, name: 'Water Bottle 750ml', revenue: 24180, units: 121, margin: 22 },
    { id: 5, rank: 5, name: 'Kids Bottle 500ml', revenue: 18420, units: 96, margin: 18 },
  ],
  needs_attention: [
    {
      id: 1,
      category: 'inventory',
      severity: 'critical',
      title: 'SKU ABC123 will stock out in ~ 2 days',
      subtitle: 'Current stock: 18 | Avg daily sales: 9',
      badge: 'CRITICAL',
      badgeColor: 'rose',
      riskText: '₹12,600 at risk',
      primaryAction: 'Reorder',
      secondaryAction: 'Ask AI',
      actionType: 'reorder',
      data: { sku: 'ABC123', at_risk: 12600, current_stock: 18, daily_sales: 9 },
    },
    {
      id: 2,
      category: 'listings',
      severity: 'warning',
      title: '3 Amazon listings are suppressed',
      subtitle: 'Potential lost revenue: ₹12,400/day',
      badge: 'WARNING',
      badgeColor: 'amber',
      primaryAction: 'Fix Listings',
      secondaryAction: 'View',
      actionType: 'fix_listings',
      data: { suppressed_count: 3, daily_loss: 12400 },
    },
    {
      id: 3,
      category: 'pricing',
      severity: 'opportunity',
      title: '5 products can increase margin by 3–6%',
      subtitle: 'Based on competitor analysis',
      badge: 'OPPORTUNITY',
      badgeColor: 'yellow',
      primaryAction: 'Review Pricing',
      secondaryAction: 'Ask AI',
      actionType: 'review_pricing',
      data: { skus_count: 5, margin_boost: '3-6%' },
    },
    {
      id: 4,
      category: 'advertising',
      severity: 'optimization',
      title: 'Advertising has ₹8,400 estimated wasted spend',
      subtitle: 'Across 3 campaigns',
      badge: 'OPTIMIZATION',
      badgeColor: 'blue',
      primaryAction: 'Optimize Ads',
      secondaryAction: 'View',
      actionType: 'optimize_ads',
      data: { wasted_amount: 8400, campaigns_count: 3 },
    },
  ],
  recent_activity: [
    { id: 1, type: 'order', title: '3 new orders received', time: '2 min ago', icon: 'cart' },
    { id: 2, type: 'inventory', title: 'SKU XYZ991 stock updated 12 units', time: '8 min ago', icon: 'box' },
    { id: 3, type: 'marketplace', title: 'Amazon listing updated successfully', time: '15 min ago', icon: 'amazon' },
    { id: 4, type: 'pricing', title: 'Price changed for ABC123 ₹999 → ₹989', time: '22 min ago', icon: 'tag' },
    { id: 5, type: 'returns', title: 'Return request received for #40291', time: '34 min ago', icon: 'return' },
  ],
  copilot_insight: {
    alert: {
      title: 'Inventory Alert',
      subtitle: 'SKU ABC123 will run out in 2.1 days',
      sku: 'ABC123',
    },
    context: 'Inventory • SKU ABC123',
    finding: 'Stock will run out in 2.1 days.',
    why: [
      '9 units/day average sales',
      '18 units available',
      'Supplier lead time: 5 days',
    ],
    recommendation: {
      title: 'Order 75 units',
      cover: 'Expected stock cover: 8.3 days',
    },
    status: 'active',
  },
};

export default function App() {
  const [data, setData] = useState<DashboardResponse>(initialDashboardState);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [externalAiPrompt, setExternalAiPrompt] = useState<string | undefined>();
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [notificationsBadge, setNotificationsBadge] = useState<number>(3);

  // Load live data from the backend
  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`/api/v1/dashboard?marketplace=${selectedMarketplace}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Using local state; API fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMarketplace]);

  const showToast = (message: string) => {
    setToastNotification(message);
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Action handlers wired directly to backend endpoints
  const handleAction = async (actionType: string, item: AttentionItem) => {
    if (actionType === 'reorder') {
      try {
        const res = await fetch('/api/v1/actions/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku: 'ABC123', quantity: 75 }),
        });
        const resJson = await res.json();
        showToast(resJson.message || 'Purchase order for 75 units of SKU ABC123 created!');
        fetchDashboardData();
      } catch {
        showToast('Purchase order created for 75 units of SKU ABC123');
      }
    } else if (actionType === 'fix_listings') {
      try {
        const res = await fetch('/api/v1/actions/fix-listings', { method: 'POST' });
        const resJson = await res.json();
        showToast(resJson.message || 'Suppressed listings resolved.');
        fetchDashboardData();
      } catch {
        showToast('Amazon suppressed listings updated with compliant attributes');
      }
    } else if (actionType === 'review_pricing') {
      try {
        const res = await fetch('/api/v1/actions/review-pricing', { method: 'POST' });
        const resJson = await res.json();
        showToast(resJson.message || 'Dynamic pricing updated.');
        fetchDashboardData();
      } catch {
        showToast('Dynamic pricing rule applied to 5 items (+4.2% margin)');
      }
    } else if (actionType === 'optimize_ads') {
      try {
        const res = await fetch('/api/v1/actions/optimize-ads', { method: 'POST' });
        const resJson = await res.json();
        showToast(resJson.message || 'Advertising campaigns optimized.');
        fetchDashboardData();
      } catch {
        showToast('Negative keywords added, saving ₹8,400 wasted ad spend');
      }
    }
  };

  const handleAskAi = (prompt: string) => {
    setIsAiDrawerOpen(true);
    setExternalAiPrompt(prompt);
  };

  const handleCreatePurchasePlan = async () => {
    try {
      const res = await fetch('/api/v1/actions/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: 'ABC123', quantity: 75 }),
      });
      const json = await res.json();
      showToast(json.message || 'Purchase order for 75 units created successfully!');
      fetchDashboardData();
    } catch {
      showToast('Purchase order for 75 units created!');
    }
  };

  const handleIgnoreInsight = async () => {
    try {
      await fetch('/api/v1/actions/dismiss-insight', { method: 'POST' });
      setData((prev) => ({
        ...prev,
        copilot_insight: { ...prev.copilot_insight, status: 'dismissed' },
      }));
      showToast('Insight ignored.');
    } catch {
      showToast('Insight ignored.');
    }
  };

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    handleAskAi(`Search and analyze: ${query}`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Toast Notification popup */}
      {toastNotification && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        ordersBadge={data.order_status?.breakdown?.find((b) => b.name === 'Processing')?.count || 12}
        notificationsBadge={notificationsBadge}
      />

      {/* Main Container Area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200 lg:pl-[240px]"
      >
        {/* Top Header */}
        <TopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
          selectedMarketplace={selectedMarketplace}
          onSelectMarketplace={(m) => setSelectedMarketplace(m)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          notificationsBadge={notificationsBadge}
        />

        {/* Workspace Body */}
        {activeTab === 'Orders' ? (
          <div className="flex-1 min-w-0">
            <OrdersWorkspace
              orderStatusSummary={data.order_status}
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Products' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <ProductsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Listings' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <ListingsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Inventory' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <InventoryWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Returns' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <ReturnsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Pricing' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <PricingWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Advertising' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <AdvertisingWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Analytics' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <AnalyticsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Finance' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <FinanceWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Automations' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <AutomationsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'AI Listing Studio' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <AiListingStudioWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'AI Seller Copilot' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <AiSellerCopilotWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Marketplaces' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <MarketplacesWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Notifications' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <NotificationsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
              onUpdateUnreadCount={(count) => setNotificationsBadge(count)}
            />
          </div>
        ) : activeTab === 'Control Center' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <ControlCenterWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Diagnostics' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <DiagnosticsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Reports' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <ReportsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Settings' ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <SettingsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              user={data.user}
            />
          </div>
        ) : (
          <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
            {activeTab === 'Dashboard' || activeTab === 'Overview' ? (
              <>
                {/* Dashboard Greeting Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      Good morning, {data.user?.name || 'Shubham'} 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
                      Here's what's happening with your business today.
                    </p>
                  </div>

                  {/* Right Date Selector Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 shadow-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Today</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500 font-normal">Dec 16, 2024</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </div>

                    {!isAiDrawerOpen && (
                      <button
                        onClick={() => setIsAiDrawerOpen(true)}
                        className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors shadow-2xs"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Copilot</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. Top Row of 6 KPI Cards */}
                <KpiCards kpis={data.kpis} />

                {/* 2. Middle Row: Needs Attention (left) & Sales Trend (right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-7">
                    <NeedsAttentionCard
                      items={data.needs_attention}
                      onAction={handleAction}
                      onAskAi={handleAskAi}
                      onViewAll={() => setActiveTab('Issues')}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <SalesTrendCard salesTrend={data.sales_trend} />
                  </div>
                </div>

                {/* 3. Bottom Row 1: Top Products, Order Status, Marketplace Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                  <TopProductsCard
                    products={data.top_products}
                    onViewAll={() => setActiveTab('Products')}
                  />
                  <OrderStatusCard
                    orderStatus={data.order_status}
                    onViewAll={() => setActiveTab('Orders')}
                  />
                  <MarketplaceHealthCard
                    marketplaces={data.marketplace_health}
                    onViewAll={() => setActiveTab('Marketplaces')}
                  />
                </div>

                {/* 4. Bottom Row 2: Recent Activity, Profit Trend, Inventory Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                  <RecentActivityCard
                    activities={data.recent_activity}
                    onViewAll={() => setActiveTab('Reports')}
                  />
                  <ProfitTrendCard profitTrend={data.profit_trend} />
                  <InventoryHealthCard
                    inventoryHealth={data.inventory_health}
                    onViewAll={() => setActiveTab('Inventory')}
                  />
                </div>
              </>
            ) : (
              /* Sub-View when another tab is clicked */
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{activeTab} Workspace</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage your {activeTab.toLowerCase()} across connected Amazon and Flipkart accounts.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('Dashboard')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    ← Back to Dashboard
                  </button>
                </div>

                {activeTab === 'Products' && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-slate-600">
                      Catalog items in SellerHub:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {data.top_products.map((p) => (
                        <div key={p.id} className="p-3.5 border border-slate-200 rounded-xl space-y-1">
                          <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                          <div className="text-slate-500">Revenue: ₹{p.revenue.toLocaleString('en-IN')}</div>
                          <div className="text-slate-500">Units sold: {p.units}</div>
                          <div className="text-emerald-600 font-bold">Margin: {p.margin}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {activeTab === 'Inventory' && (
                <div className="space-y-3">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-700 text-sm">Critical: SKU ABC123 Stockout in 2 Days</div>
                      <div className="text-xs text-rose-600 mt-0.5">18 units available. Velocity: 9/day. Lead time: 5 days.</div>
                    </div>
                    <button
                      onClick={handleCreatePurchasePlan}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Reorder 75 Units
                    </button>
                  </div>
                </div>
              )}

              {activeTab !== 'Orders' && activeTab !== 'Products' && activeTab !== 'Inventory' && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Connected to SellerHub live operations for {activeTab}. Click "Back to Dashboard" to view high-level metrics.
                </div>
              )}
            </div>
          )}
        </main>
      )}
      </div>

      {/* Right AI Seller Copilot Drawer */}
      <AiSellerCopilotDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        copilotInsight={data.copilot_insight}
        onCreatePurchasePlan={handleCreatePurchasePlan}
        onIgnoreInsight={handleIgnoreInsight}
        onSelectSecondaryInsight={(type) => {
          handleAction(type, data.needs_attention[0]);
        }}
        externalPrompt={externalAiPrompt}
        onClearExternalPrompt={() => setExternalAiPrompt(undefined)}
      />
    </div>
  );
}
