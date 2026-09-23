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
import MarketplaceFormKnowledgeCenter from './MarketplaceFormKnowledgeCenter';
import NotificationsWorkspace from './components/NotificationsWorkspace';
import ControlCenterWorkspace from './components/ControlCenterWorkspace';
import DiagnosticsWorkspace from './components/DiagnosticsWorkspace';
import ReportsWorkspace from './components/ReportsWorkspace';
import SettingsWorkspace from './components/SettingsWorkspace';
import FinalSellerOSWorkspace from './FinalSellerOSWorkspace';
import { DashboardResponse, AttentionItem } from './types';

const emptyDashboardState: DashboardResponse = {
  period_start: '',
  period_end: '',
  user: {
    name: '',
    role: '',
    store: '',
    email: '',
  },
  kpis: {
    revenue: 0,
    revenue_growth: 0,
    orders: 0,
    orders_growth: 0,
    net_profit: 0,
    net_profit_growth: 0,
    profit_margin: 0,
    profit_margin_growth: 0,
    returns: 0,
    returns_growth: 0,
    inventory_value: '₹0',
    inventory_value_numeric: 0,
    inventory_value_growth: 0,
    active_listings: 0,
    buy_box_rate: 0,
  },
  sales_trend: {
    total: 0,
    growth: 0,
    timeline: [],
    marketplaces: [],
  },
  profit_trend: [],
  order_status: {
    total: 0,
    breakdown: [],
  },
  marketplace_health: [],
  inventory_health: {
    health_score: 0,
    total_items: 0,
    healthy: 0,
    low_stock: 0,
    out_of_stock: 0,
    dead_stock: 0,
  },
  top_products: [],
  needs_attention: [],
  recent_activity: [],
  copilot_insight: {
    alert: {
      title: '',
      subtitle: '',
      sku: '',
    },
    context: '',
    finding: '',
    why: [],
    recommendation: {
      title: '',
      cover: '',
    },
    status: 'idle',
  },
};

export default function App() {
  const [data, setData] = useState<DashboardResponse>(emptyDashboardState);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [externalAiPrompt, setExternalAiPrompt] = useState<string | undefined>();
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [notificationsBadge, setNotificationsBadge] = useState<number>(0);

  // Load live data from the backend
  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/v1/dashboard?marketplace=${selectedMarketplace}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Dashboard API request failed:', err);
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
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/actions/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku: item.data?.sku, quantity: item.data?.quantity }),
        });
        const resJson = await res.json();
        showToast(resJson.message || 'Purchase order created successfully.');
        fetchDashboardData();
      } catch {
        showToast('Unable to create purchase order.');
      }
    } else if (actionType === 'fix_listings') {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/actions/fix-listings', { method: 'POST' });
        const resJson = await res.json();
        showToast(resJson.message || 'Suppressed listings resolved.');
        fetchDashboardData();
      } catch {
        showToast('Unable to update suppressed listings.');
      }
    } else if (actionType === 'review_pricing') {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/actions/review-pricing', { method: 'POST' });
        const resJson = await res.json();
        showToast(resJson.message || 'Dynamic pricing updated.');
        fetchDashboardData();
      } catch {
        showToast('Unable to update pricing.');
      }
    } else if (actionType === 'optimize_ads') {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/actions/optimize-ads', { method: 'POST' });
        const resJson = await res.json();
        showToast(resJson.message || 'Advertising campaigns optimized.');
        fetchDashboardData();
      } catch {
        showToast('Unable to optimize advertising.');
      }
    }
  };

  const handleAskAi = (prompt: string) => {
    setIsAiDrawerOpen(true);
    setExternalAiPrompt(prompt);
  };

  const handleCreatePurchasePlan = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/actions/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      showToast(json.message || 'Purchase order created successfully.');
      fetchDashboardData();
    } catch {
      showToast('Unable to create purchase order.');
    }
  };

  const handleIgnoreInsight = async () => {
    try {
      await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/actions/dismiss-insight', { method: 'POST' });
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
        ordersBadge={data.order_status?.breakdown?.find((b) => b.name === 'Processing')?.count || 0}
        notificationsBadge={notificationsBadge}
        marketplaceHealth={data.marketplace_health}
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
          <div className="flex-1 min-w-0">
            <ProductsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Listings' ? (
          <div className="flex-1 min-w-0">
            <ListingsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Inventory' ? (
          <div className="flex-1 min-w-0">
            <InventoryWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Returns' ? (
          <div className="flex-1 min-w-0">
            <ReturnsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Pricing' ? (
          <div className="flex-1 min-w-0">
            <PricingWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Advertising' ? (
          <div className="flex-1 min-w-0">
            <AdvertisingWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Analytics' ? (
          <div className="flex-1 min-w-0">
            <AnalyticsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Finance' ? (
          <div className="flex-1 min-w-0">
            <FinanceWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Automations' ? (
          <div className="flex-1 min-w-0">
            <AutomationsWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'AI Listing Studio' ? (
          <div className="flex-1 min-w-0">
            <AiListingStudioWorkspace
              onOpenAiCopilot={() => setIsAiDrawerOpen(true)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'AI Seller OS' ? (
          <div className="flex-1 min-w-0">
            <FinalSellerOSWorkspace />
          </div>
        ) : activeTab === 'AI Seller Copilot' ? (
          <div className="flex-1 min-w-0">
            <AiSellerCopilotWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Marketplaces' ? (
          <div className="flex-1 min-w-0">
            <>
            <MarketplacesWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
            <MarketplaceFormKnowledgeCenter />
          </>
          </div>
        ) : activeTab === 'Notifications' ? (
          <div className="flex-1 min-w-0">
            <NotificationsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
              onUpdateUnreadCount={(count) => setNotificationsBadge(count)}
            />
          </div>
        ) : activeTab === 'Control Center' ? (
          <div className="flex-1 min-w-0">
            <ControlCenterWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Diagnostics' ? (
          <div className="flex-1 min-w-0">
            <DiagnosticsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Reports' ? (
          <div className="flex-1 min-w-0">
            <ReportsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              selectedMarketplaceFilter={selectedMarketplace}
              onSelectMarketplaceFilter={(m) => setSelectedMarketplace(m)}
            />
          </div>
        ) : activeTab === 'Settings' ? (
          <div className="flex-1 min-w-0">
            <SettingsWorkspace
              onNavigateTab={(tab) => setActiveTab(tab)}
              user={data.user}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
            {activeTab === 'Dashboard' || activeTab === 'Overview' ? (
              <>
                {/* Dashboard Greeting Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      {data.user?.name ? `Good morning, ${data.user.name} 👋` : 'Welcome to SellerHub'}
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
                      <span className="text-slate-500 font-normal"></span>
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
                  <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-sm text-slate-400">
                    No inventory alert data available yet.
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
        </div>
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
