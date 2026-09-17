import React from 'react';
import MarketplaceWorkspace from './MarketplaceWorkspace';
import OperationsControlCenter from './OperationsControlCenter';
import ListingIntelligenceWorkspace from './ListingIntelligenceWorkspace';
import DiagnosticWorkspace from './DiagnosticWorkspace';
import { phase00Capabilities, SellerHubCapability } from './phase00';
import './phase00.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json', ...(init?.headers || {}) }, ...init });

type Dashboard = {
  period_start: string;
  period_end: string;
  kpis: { revenue: number; expenses: number; net_profit: number; orders: number; units: number; average_order_value: number; inventory_units: number; low_stock_items: number; returns: number; cancellations: number; active_listings: number; buy_box_rate: number };
  marketplaces: Array<{ marketplace: string; revenue: number; orders: number; units: number; net_profit: number; inventory_units: number; returns: number; cancellations: number }>;
  trends: Array<{ key: string; revenue: number; expenses: number; net_profit: number; orders: number; units: number }>;
  top_products: Array<{ product_id: number; sku: string; title: string; revenue: number; units: number; orders: number; net_profit: number }>;
  alerts: Array<{ type: string; severity: string; message: string; count: number }>;
};

type RecordRow = Record<string, unknown>;
const endpointFor: Record<string, string> = { orders:'/orders', products:'/catalog/products', listings:'/listing-operations/listings', inventory:'/inventory', returns:'/returns', pricing:'/pricing', advertising:'/advertising', analytics:'/advanced-analytics', finance:'/finance', automations:'/automation', notifications:'/notifications', marketplaces:'/marketplaces', diagnostics:'/diagnostics', reports:'/finance/reports' };
const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export default function Phase00App() {
  const [active, setActive] = React.useState('dashboard');
  const [dark, setDark] = React.useState(() => localStorage.getItem('seller_hub_theme') === 'dark');
  const [mobile, setMobile] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('');
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('seller_hub_theme', dark ? 'dark' : 'light'); }, [dark]);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = marketplace ? `?marketplace_account_id=${encodeURIComponent(marketplace)}` : '';
      const response = await api(`/dashboard${query}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.detail || `Dashboard API returned ${response.status}`));
      setDashboard(body as Dashboard);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load dashboard');
    } finally { setLoading(false); }
  }, [marketplace]);

  React.useEffect(() => { loadDashboard(); const timer = window.setInterval(loadDashboard, 30000); return () => window.clearInterval(timer); }, [loadDashboard]);

  const go = (id: string) => { setActive(id); setMobile(false); };
  const groups = ['SELL', 'GROW', 'AUTOMATE', 'SYSTEM'] as const;
  const visibleNav = phase00Capabilities.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));

  return <div className="seller-shell">
    <a className="skip-link" href="#seller-main">Skip to content</a>
    <aside className={mobile ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><div className="brand-mark">S</div><div><strong>SellerHub</strong><small>Your AI-Powered Seller OS</small></div><button className="sidebar-close" onClick={() => setMobile(false)}>×</button></div>
      <nav className="side-nav">
        <button className={active === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => go('dashboard')}><span className="nav-icon">⌂</span>Dashboard</button>
        {groups.map(group => <div className="nav-group" key={group}><small>{group}</small>{visibleNav.filter(c => c.group === group).map(c => <button key={c.id} className={active === c.id ? 'nav-item active' : 'nav-item'} onClick={() => go(c.id)}><span className="nav-icon">{c.icon}</span>{c.label}{c.ai && c.id === 'ai-seller-copilot' && <em>AI</em>}</button>)}</div>)}
      </nav>
      <div className="sidebar-footer"><div className="secure-dot"/><div><b>Private workspace</b><span>{error ? 'Attention required' : 'Live backend connected'}</span></div></div>
    </aside>
    <main id="seller-main" className="seller-main">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobile(true)}>☰</button><div className="global-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, orders, SKUs..."/><kbd>⌘ K</kbd></div><div className="top-actions"><button className="icon-btn">♢</button><button className="icon-btn">?</button><button className="icon-btn" onClick={() => setDark(v => !v)}>{dark ? '☀' : '◐'}</button><select value={marketplace} onChange={e => setMarketplace(e.target.value)}><option value="">All Marketplaces</option>{(dashboard?.marketplaces || []).map((m, i) => <option key={`${m.marketplace}-${i}`} value={String(m.marketplace)}>{m.marketplace}</option>)}</select><div className="avatar">S</div></div></header>
      {error && <div className="live-error" role="alert">Live data unavailable: {error}<button onClick={loadDashboard}>Retry</button></div>}
      {active === 'dashboard' ? <LiveDashboard data={dashboard} loading={loading} go={go} onRefresh={loadDashboard} /> : <CapabilityPage capability={phase00Capabilities.find(c => c.id === active)} />}
    </main>
  </div>;
}

function LiveDashboard({ data, loading, go, onRefresh }: { data: Dashboard | null; loading: boolean; go: (id: string) => void; onRefresh: () => void }) {
  const k = data?.kpis;
  const trends = data?.trends || [];
  const maxRevenue = Math.max(...trends.map(t => t.revenue), 1);
  return <section className="dashboard-page">
    <div className="page-heading"><div><span className="eyebrow">OVERVIEW</span><h1>Business Overview</h1><p>{data ? `${dateLabel(data.period_start)} – ${dateLabel(data.period_end)}` : 'Loading live business data…'}</p></div><div className="heading-actions"><button className="date-btn" onClick={onRefresh}>↻ Refresh</button><button className="copilot-btn" onClick={() => go('ai-seller-copilot')}>✦ Ask AI</button></div></div>
    <div className="kpi-grid">
      <Kpi title="Revenue" value={k ? money(k.revenue) : '—'} icon="₹" loading={loading}/><Kpi title="Orders" value={k ? k.orders.toLocaleString('en-IN') : '—'} icon="▣" loading={loading}/><Kpi title="Net Profit" value={k ? money(k.net_profit) : '—'} icon="◈" loading={loading}/><Kpi title="Profit Margin" value={k && k.revenue ? `${((k.net_profit / k.revenue) * 100).toFixed(1)}%` : '—'} icon="%" loading={loading}/><Kpi title="Returns" value={k ? k.returns.toLocaleString('en-IN') : '—'} icon="↩" loading={loading}/><Kpi title="Inventory Value" value={k ? `${k.inventory_units.toLocaleString('en-IN')} units` : '—'} icon="▥" loading={loading}/>
    </div>
    <section className="attention-card"><div className="section-title"><div><h2>Needs Attention</h2><p>{data ? `${data.alerts.length} live alert${data.alerts.length === 1 ? '' : 's'}` : 'Checking live alerts…'}</p></div><button onClick={onRefresh}>Refresh <span>↻</span></button></div><div className="attention-list">{loading ? <EmptyState text="Loading live alerts…"/> : data?.alerts.length ? data.alerts.slice(0, 4).map((a, i) => <AlertCard key={`${a.type}-${i}`} alert={a} go={go}/>) : <EmptyState text="No active alerts"/>}</div></section>
    <div className="dashboard-grid two-col">
      <section className="panel chart-panel"><PanelHeader title="Revenue Trend" sub="Backend-reported revenue by period"/><div className="trend-chart">{loading ? <EmptyState text="Loading trend…"/> : trends.length ? trends.slice(-14).map(t => <div className="trend-col" key={t.key} title={`${dateLabel(t.key)} · ${money(t.revenue)}`}><div className="trend-bar" style={{ height: `${Math.max(4, (t.revenue / maxRevenue) * 170)}px` }}/><span>{dateLabel(t.key)}</span></div>) : <EmptyState text="No revenue trend data"/>}</div></section>
      <section className="panel"><PanelHeader title="Marketplace Performance" sub="Live connected-account results" action="Manage →" onAction={() => go('marketplaces')}/>{loading ? <EmptyState text="Loading marketplace data…"/> : data?.marketplaces.length ? data.marketplaces.slice(0, 5).map(m => <div className="market-card" key={m.marketplace}><div className="market-logo">{String(m.marketplace).slice(0, 1).toUpperCase()}</div><div className="market-info"><b>{m.marketplace}</b><span>{m.orders.toLocaleString('en-IN')} orders · {m.units.toLocaleString('en-IN')} units</span></div><strong>{money(m.revenue)}</strong></div>) : <EmptyState text="No marketplace data"/>}</section>
    </div>
    <div className="dashboard-grid two-col">
      <section className="panel products-panel"><PanelHeader title="Top Products" sub="Highest revenue in selected period" action="View all →" onAction={() => go('products')}/>{loading ? <EmptyState text="Loading products…"/> : data?.top_products.length ? <div className="product-table"><div className="table-head"><span>PRODUCT</span><span>REVENUE</span><span>ORDERS</span><span>PROFIT</span></div>{data.top_products.slice(0, 6).map(p => <div className="product-row" key={p.product_id}><div><span className="product-thumb">{p.title.slice(0, 1)}</span><div><b>{p.title || 'Untitled product'}</b><small>{p.sku || 'No SKU'}</small></div></div><span>{money(p.revenue)}</span><span>{p.orders}</span><strong>{money(p.net_profit)}</strong></div>)}</div> : <EmptyState text="No product sales data"/>}</section>
      <section className="panel inventory-health"><PanelHeader title="Inventory Health" sub="Current live inventory position" action="Manage inventory →" onAction={() => go('inventory')}/>{loading ? <EmptyState text="Loading inventory…"/> : <div className="inventory-bars"><StockBar label="Available units" value={k?.inventory_units || 0} meta="Current available stock"/><StockBar label="Low stock items" value={k?.low_stock_items || 0} meta="At or below reorder level" warning/><StockBar label="Active listings" value={k?.active_listings || 0} meta="Currently active"/></div>}</section>
    </div>
    <div className="activity-strip panel"><PanelHeader title="Business Metrics" sub="Live operational summary"/><div className="activity-list"><Metric label="Units sold" value={k ? k.units.toLocaleString('en-IN') : '—'}/><Metric label="Average order value" value={k ? money(k.average_order_value) : '—'}/><Metric label="Cancellations" value={k ? k.cancellations.toLocaleString('en-IN') : '—'}/><Metric label="Buy Box rate" value={k ? `${k.buy_box_rate.toFixed(1)}%` : '—'}/></div></div>
  </section>;
}

function Kpi({ title, value, icon, loading }: { title: string; value: string; icon: string; loading: boolean }) { return <article className="kpi-card"><div className="kpi-top"><span>{title}</span><i>{icon}</i></div><strong>{loading ? '…' : value}</strong><div><span>Live backend value</span></div></article>; }
function AlertCard({ alert, go }: { alert: Dashboard['alerts'][number]; go: (id: string) => void }) { const target = alert.type === 'inventory' ? 'inventory' : alert.type === 'returns' ? 'returns' : alert.type === 'listings' ? 'listings' : 'orders'; return <div className={`attention-item ${alert.severity || 'warning'}`}><span className="attention-icon">{alert.severity === 'critical' ? '!' : '△'}</span><div><b>{alert.message}</b><small>{alert.count} affected item{alert.count === 1 ? '' : 's'}</small><button onClick={() => go(target)}>Open {target} →</button></div></div>; }
function StockBar({ label, value, meta, warning }: { label: string; value: number; meta: string; warning?: boolean }) { const width = Math.min(100, Math.max(0, value)); return <div className="stock-row"><div><span>{label}</span><b>{meta}</b></div><div className="stock-track"><i className={warning ? 'warning' : ''} style={{ width: `${width}%` }}/></div><strong>{value.toLocaleString('en-IN')}</strong></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="activity"><span className="activity-icon">•</span><div><b>{label}</b><small>{value}</small></div></div>; }
function PanelHeader({ title, sub, action, onAction }: { title: string; sub: string; action?: string; onAction?: () => void }) { return <div className="panel-header"><div><h2>{title}</h2><p>{sub}</p></div>{action && <button onClick={onAction}>{action}</button>}</div>; }
function EmptyState({ text }: { text: string }) { return <div className="empty"><strong>{text}</strong></div>; }

function CapabilityPage({ capability }: { capability?: SellerHubCapability }) {
  const [rows, setRows] = React.useState<RecordRow[]>([]); const [loading, setLoading] = React.useState(true); const [error, setError] = React.useState('');
  const id = capability?.id || '';
  React.useEffect(() => { let alive = true; const load = async () => { setLoading(true); try { if (id === 'marketplaces') return; const endpoint = endpointFor[id]; if (!endpoint) { setRows([]); return; } const response = await api(endpoint); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(String(body.detail || `API returned ${response.status}`)); const next = Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : Array.isArray(body.data) ? body.data : []; if (alive) { setRows(next); setError(''); } } catch (e) { if (alive) setError(e instanceof Error ? e.message : 'Unable to load module data'); } finally { if (alive) setLoading(false); } }; load(); return () => { alive = false; }; }, [id]);
  if (!capability) return <section className="workspace-page"><h1>Not found</h1></section>;
  if (id === 'marketplaces') return <MarketplaceWorkspace />;
  if (id === 'control-center') return <OperationsControlCenter />;
  if (id === 'listings') return <ListingIntelligenceWorkspace />;
  if (id === 'diagnostics') return <DiagnosticWorkspace />;
  return <section className="workspace-page"><div className="workspace-head"><div><span>{capability.group}</span><h1>{capability.label}</h1><p>{capability.description}</p></div></div>{error && <div className="live-error">{error}</div>}<section className="panel"><PanelHeader title="Live records" sub="Loaded from the existing SellerHub backend"/>{loading ? <EmptyState text="Loading…"/> : rows.length ? <div className="rows">{rows.slice(0, 50).map((row, index) => <div key={String(row.id ?? row.sku ?? index)}><b>{String(row.name ?? row.title ?? row.sku ?? row.id ?? 'Record')}</b><span>{Object.entries(row).filter(([key]) => !['id','name','title','sku'].includes(key)).slice(0, 3).map(([key, value]) => `${key}: ${String(value)}`).join(' · ')}</span></div>)}</div> : <EmptyState text="No records returned by the backend"/>}</section></section>;
}
