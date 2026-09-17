import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
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
import { DashboardResponse, AttentionItem } from './types';

type BackendDashboardResponse = {
  period_start: string;
  period_end: string;
  kpis: {
    revenue: number; expenses: number; net_profit: number; orders: number; units: number;
    average_order_value: number; inventory_units: number; low_stock_items: number;
    returns: number; cancellations: number; active_listings: number; buy_box_rate: number;
  };
  marketplaces: Array<{ marketplace: string; revenue: number; orders: number; units: number; net_profit: number; inventory_units: number; returns: number; cancellations: number }>;
  trends: Array<{ key: string; revenue: number; expenses: number; net_profit: number; orders: number; units: number }>;
  top_products: Array<{ product_id: number; sku: string; title: string; revenue: number; units: number; orders: number; net_profit: number }>;
  alerts: Array<{ type: string; severity: string; message: string; count: number }>;
};

function toDashboardViewModel(api: BackendDashboardResponse): DashboardResponse {
  const revenue = Number(api.kpis?.revenue || 0);
  const netProfit = Number(api.kpis?.net_profit || 0);
  const margin = revenue ? (netProfit / revenue) * 100 : 0;
  const trends = Array.isArray(api.trends) ? api.trends : [];
  const marketplaces = Array.isArray(api.marketplaces) ? api.marketplaces : [];
  const alerts = Array.isArray(api.alerts) ? api.alerts : [];
  const totalOrders = Number(api.kpis?.orders || 0);
  const statusRows = alerts.map((a, index) => ({
    name: a.type,
    count: Number(a.count || 0),
    percent: totalOrders ? Math.round((Number(a.count || 0) / totalOrders) * 100) : 0,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
  }));
  const attention = alerts.map((a, index) => ({
    id: index + 1,
    category: a.type,
    severity: a.severity,
    title: a.message,
    subtitle: `${a.count} item${a.count === 1 ? '' : 's'} reported by live data`,
    badge: String(a.severity || 'INFO').toUpperCase(),
    badgeColor: a.severity === 'critical' ? 'rose' : a.severity === 'warning' ? 'amber' : 'blue',
    primaryAction: 'View',
    secondaryAction: 'Ask AI',
    actionType: `navigate_${a.type}`,
    data: a,
  }));
  return {
    period_start: api.period_start,
    period_end: api.period_end,
    user: { name: '', role: '', store: '', email: '' },
    kpis: {
      revenue,
      revenue_growth: 0,
      orders: totalOrders,
      orders_growth: 0,
      net_profit: netProfit,
      net_profit_growth: 0,
      profit_margin: Number(margin.toFixed(2)),
      profit_margin_growth: 0,
      returns: Number(api.kpis?.returns || 0),
      returns_growth: 0,
      inventory_value: '—',
      inventory_value_numeric: 0,
      inventory_value_growth: 0,
      active_listings: Number(api.kpis?.active_listings || 0),
      buy_box_rate: Number(api.kpis?.buy_box_rate || 0),
      expenses: Number(api.kpis?.expenses || 0),
      units: Number(api.kpis?.units || 0),
      average_order_value: Number(api.kpis?.average_order_value || 0),
    } as DashboardResponse['kpis'],
    sales_trend: {
      total: revenue,
      growth: 0,
      timeline: trends.map(t => ({ day: t.key, amazon: t.revenue, flipkart: 0, total: t.revenue })),
      marketplaces: marketplaces.map(m => ({ name: m.marketplace, revenue: m.revenue, growth: 0, share_percent: revenue ? (m.revenue / revenue) * 100 : 0, orders: m.orders })),
    },
    profit_trend: trends.map(t => ({ day: t.key, profit: t.net_profit })),
    order_status: { total: totalOrders, breakdown: statusRows },
    marketplace_health: marketplaces.map((m, index) => ({ id: index + 1, marketplace: m.marketplace, status: 'Performance data', listings: 0, last_sync: '—', api_status: 'unknown', connected: true })),
    inventory_health: {
      health_score: api.kpis?.inventory_units ? Math.max(0, Math.min(100, 100 - ((api.kpis.low_stock_items || 0) / Math.max(1, api.kpis.inventory_units)) * 100)) : 0,
      total_items: Number(api.kpis?.inventory_units || 0),
      healthy: Math.max(0, Number(api.kpis?.inventory_units || 0) - Number(api.kpis?.low_stock_items || 0)),
      low_stock: Number(api.kpis?.low_stock_items || 0),
      out_of_stock: 0,
      dead_stock: 0,
    },
    top_products: (api.top_products || []).map((p, index) => ({ id: p.product_id, rank: index + 1, name: p.title || p.sku, revenue: p.revenue, units: p.units, margin: p.revenue ? (p.net_profit / p.revenue) * 100 : 0 })),
    needs_attention: attention,
    recent_activity: [],
  };
}

export default function DashboardApp() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const accountsRes = await fetch('/api/v1/personal/marketplaces', { headers: { Accept: 'application/json' } });
      const accounts = accountsRes.ok ? await accountsRes.json().catch(() => []) : [];
      const idMap: Record<string, number> = {};
      if (Array.isArray(accounts)) {
        for (const account of accounts) {
          const name = String(account.marketplace || account.display_name || '').toLowerCase();
          if (account.id && name) idMap[name.includes('amazon') ? 'amazon' : name.includes('flipkart') ? 'flipkart' : name] = Number(account.id);
        }
      }
      const params = new URLSearchParams();
      if (selectedMarketplace !== 'all' && idMap[selectedMarketplace]) params.set('marketplace_account_id', String(idMap[selectedMarketplace]));
      const res = await fetch(`/api/v1/dashboard${params.toString() ? `?${params.toString()}` : ''}`, { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail || `Dashboard API returned ${res.status}`);
      setData(toDashboardViewModel(body as BackendDashboardResponse));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Unable to load live dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, [selectedMarketplace]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleAction = (actionType: string, item: AttentionItem) => {
    const routes: Record<string, string> = {
      navigate_inventory: 'Inventory', navigate_orders: 'Orders', navigate_returns: 'Returns',
      navigate_listings: 'Listings', navigate_customer: 'Notifications', navigate_pricing: 'Pricing',
    };
    if (routes[actionType]) setActiveTab(routes[actionType]);
    else notify(`No executable action is configured for ${item.category}.`);
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) notify('Global search will be connected during the dedicated workspace migration.');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>{toast}</span></div>}
      <Sidebar activeTab={activeTab} onSelectTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }} mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} ordersBadge={data?.order_status.breakdown.find(b => b.name === 'orders')?.count || 0} notificationsBadge={0} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px]">
        <TopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onSearchSubmit={handleSearchSubmit} onOpenMobileMenu={() => setMobileMenuOpen(true)} onToggleAiDrawer={() => notify('AI Copilot will be connected during its dedicated migration step.')} selectedMarketplace={selectedMarketplace} onSelectMarketplace={setSelectedMarketplace} onNavigateTab={setActiveTab} notificationsBadge={0} />
        {activeTab !== 'Dashboard' && activeTab !== 'Overview' ? (
          <main className="flex-1 flex items-center justify-center p-8"><div className="bg-white border border-slate-200 rounded-xl p-7 text-center max-w-md"><h2 className="text-lg font-bold text-slate-900">{activeTab}</h2><p className="text-sm text-slate-500 mt-2">This workspace is being migrated one module at a time. No placeholder business data is shown.</p><button onClick={() => setActiveTab('Dashboard')} className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold">Back to Dashboard</button></div></main>
        ) : loading && !data ? (
          <main className="flex-1 flex items-center justify-center p-8"><div className="text-sm text-slate-500">Loading live dashboard data…</div></main>
        ) : error && !data ? (
          <main className="flex-1 flex items-center justify-center p-8"><div className="bg-white border border-rose-200 rounded-xl p-6 text-center max-w-md"><h2 className="font-bold text-slate-900">Dashboard data unavailable</h2><p className="text-sm text-slate-500 mt-2">{error}</p><button onClick={loadDashboard} className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold">Retry</button></div></main>
        ) : data ? (
          <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Seller Dashboard</h1><p className="text-xs sm:text-sm text-slate-500 mt-0.5">Live business metrics from your connected SellerHub data.</p></div><div className="flex items-center gap-2"><div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span>{new Date(data.period_start).toLocaleDateString('en-IN')}</span><span className="text-slate-300">→</span><span>{new Date(data.period_end).toLocaleDateString('en-IN')}</span></div></div></div>
            <KpiCards kpis={data.kpis} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"><div className="lg:col-span-7"><NeedsAttentionCard items={data.needs_attention} onAction={handleAction} onAskAi={() => notify('AI Copilot will be connected during its dedicated migration step.')} onViewAll={() => notify('No separate issue feed is exposed by the dashboard API.')} /></div><div className="lg:col-span-5"><SalesTrendCard salesTrend={data.sales_trend} /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch"><TopProductsCard products={data.top_products} onViewAll={() => notify('Products workspace will be migrated in the next step.')} /><OrderStatusCard orderStatus={data.order_status} onViewAll={() => notify('Orders workspace will be migrated in the next step.')} /><MarketplaceHealthCard marketplaces={data.marketplace_health} onViewAll={() => notify('Marketplace workspace will be migrated in the next step.')} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch"><RecentActivityCard activities={data.recent_activity} onViewAll={() => notify('Activity feed is not exposed by the dashboard API.')} /><ProfitTrendCard profitTrend={data.profit_trend} /><InventoryHealthCard inventoryHealth={data.inventory_health} onViewAll={() => notify('Inventory workspace will be migrated in the next step.')} /></div>
          </main>
        ) : null}
      </div>
    </div>
  );
}
