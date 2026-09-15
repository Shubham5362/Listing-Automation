import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './ai-chat-fullscreen.css';
import MarketplaceWorkspace from './MarketplaceWorkspace';
import MarketplaceChangeWorkspace from './MarketplaceChangeWorkspace';
import OperationsControlCenter from './OperationsControlCenter';
import AISellerAgentWorkspace from './AISellerAgentWorkspace';
import AutofillWorkspace from './AutofillWorkspace';
import ListingIntelligenceWorkspace from './ListingIntelligenceWorkspace';
import DiagnosticWorkspace from './DiagnosticWorkspace';

type Module = { name: string; icon: string; group: string; description: string; tone: string };
const modules: Module[] = [
  { name: 'Dashboard', icon: '⌂', group: 'Overview', description: 'Business command center', tone: 'core' },
  { name: 'Orders', icon: '▣', group: 'Operations', description: 'Unified order operations', tone: 'blue' },
  { name: 'Inventory', icon: '▥', group: 'Operations', description: 'Stock health and availability', tone: 'green' },
  { name: 'Returns', icon: '↩', group: 'Operations', description: 'Returns and customer issues', tone: 'rose' },
  { name: 'Control Center', icon: '⚡', group: 'Operations', description: 'Actions, jobs, approvals and recovery', tone: 'ai' },
  { name: 'Products', icon: '◫', group: 'Catalog', description: 'Central product catalog', tone: 'violet' },
  { name: 'Listings', icon: '▤', group: 'Catalog', description: 'Listing lifecycle', tone: 'violet' },
  { name: 'AI Listing Studio', icon: '✦', group: 'Catalog', description: 'Intelligent generation and contextual variations', tone: 'ai' },
  { name: 'Adaptive Autofill', icon: '✦', group: 'Catalog', description: 'AI marketplace form preparation', tone: 'ai' },
  { name: 'Marketplace Changes', icon: '↻', group: 'Intelligence', description: 'Schema changes and safe adapter updates', tone: 'ai' },
  { name: 'AI Diagnostics', icon: '⌁', group: 'Intelligence', description: 'Root cause analysis and safe fixes', tone: 'ai' },
  { name: 'Pricing', icon: '₹', group: 'Growth', description: 'Pricing intelligence', tone: 'amber' },
  { name: 'Advertising', icon: '◒', group: 'Growth', description: 'Campaign performance', tone: 'orange' },
  { name: 'Finance', icon: '◈', group: 'Finance', description: 'Revenue and profitability', tone: 'cyan' },
  { name: 'Analytics', icon: '⌁', group: 'Intelligence', description: 'Business intelligence', tone: 'indigo' },
  { name: 'Automations', icon: '⚙', group: 'Automation', description: 'Automated workflows', tone: 'slate' },
  { name: 'Notifications', icon: '♢', group: 'Automation', description: 'Alerts and activity', tone: 'slate' },
  { name: 'Marketplaces', icon: '◇', group: 'Configuration', description: 'Amazon and Flipkart status', tone: 'teal' },
];
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = (path: string) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json' } });
const time = (value: string | null) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

type Overview = {
  kpis: { orders: number; products: number; listings: number; inventory_units: number; low_stock: number; returns: number; pending_jobs: number; pending_approvals?: number };
  orders: { by_status: Record<string, number> };
  inventory: { total_items: number; units: number; low_stock: number; out_of_stock: number };
  catalog: { products: number; listings: number; active_listings: number };
  jobs: { by_status: Record<string, number>; recent: { title: string; status: string; created_at: string | null }[] };
  approvals?: { pending: number };
  marketplaces: { id: number; marketplace: string; status: string; last_sync_at: string | null; last_error: string | null }[];
  alerts: { type: string; severity: string; message: string; count: number }[];
  activity: { title: string; status: string; created_at: string | null }[];
};

function App() {
  const [active, setActive] = React.useState('Dashboard');
  const [dark, setDark] = React.useState(() => localStorage.getItem('seller_hub_theme') === 'dark');
  const [mobile, setMobile] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [data, setData] = React.useState<Overview | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [updated, setUpdated] = React.useState<Date | null>(null);
  const [command, setCommand] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const response = await api('/operations/overview');
      if (!response.ok) throw new Error(`Seller Hub API returned ${response.status}`);
      setData(await response.json());
      setUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Seller Hub data');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('seller_hub_theme', dark ? 'dark' : 'light'); }, [dark]);
  React.useEffect(() => { load(); const timer = window.setInterval(load, 30000); return () => window.clearInterval(timer); }, [load]);
  React.useEffect(() => { document.body.style.overflow = aiOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [aiOpen]);

  const current = modules.find(module => module.name === active) || modules[0];
  const go = (name: string) => { setActive(name); setMobile(false); };
  const ask = () => { if (command.trim()) { setAiOpen(true); setCommand(''); } else setAiOpen(true); };

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className={mobile ? 'open' : ''}>
      <div className="brand"><span>◆</span><div><b>Seller Hub</b><small>Personal AI Operations</small></div><button className="mobile-close" onClick={() => setMobile(false)}>×</button></div>
      <nav className="nav-scroll">{['Overview','Operations','Catalog','Growth','Finance','Intelligence','Automation','Configuration'].map(group => <div className="nav-group" key={group}><small>{group}</small>{modules.filter(module => module.group === group).map(module => <button key={module.name} className={active === module.name ? 'active' : ''} aria-current={active === module.name ? 'page' : undefined} onClick={() => go(module.name)}><i>{module.icon}</i>{module.name}</button>)}</div>)}</nav>
      <div className="seller"><small>PERSONAL WORKSPACE</small><strong>My Business</strong><span>● Direct access enabled</span></div>
    </aside>
    <main id="main" tabIndex={-1}>
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobile(true)}>☰</button>
        <div><p className="eyebrow">{current.group.toUpperCase()} · SELLER HUB</p><h1>{active}</h1><p className="muted">{current.description}</p></div>
        <div className="top-actions"><span className="live-status">● Live</span><button onClick={() => setDark(!dark)}>{dark ? '☀' : '◐'}</button><button className="ai-button" onClick={() => setAiOpen(true)}>✦ Ask AI</button></div>
      </header>
      {active === 'Dashboard' && <div className="global-command"><span>⌕</span><input value={command} onChange={e => setCommand(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Ask Seller OS anything — sales, stock, listings, orders…"/><kbd>Enter ↵</kbd><button onClick={ask}>Ask AI</button></div>}
      {error && <div className="errorbar" role="alert">{error} <button onClick={load}>Retry</button></div>}
      {active === 'Dashboard' ? <Dashboard data={data} loading={loading} updated={updated} go={go} onAsk={() => setAiOpen(true)} /> : active === 'Marketplaces' ? <MarketplaceWorkspace /> : active === 'Control Center' ? <OperationsControlCenter /> : active === 'Adaptive Autofill' ? <AutofillWorkspace /> : active === 'Marketplace Changes' ? <MarketplaceChangeWorkspace /> : active === 'AI Listing Studio' ? <ListingIntelligenceWorkspace /> : active === 'AI Diagnostics' ? <DiagnosticWorkspace /> : <ModulePage module={current} data={data} loading={loading} updated={updated} />}
    </main>
    {aiOpen && <AISellerAgentWorkspace onClose={() => setAiOpen(false)} />}
  </div>;
}

function Dashboard({ data, loading, updated, go, onAsk }: { data: Overview | null; loading: boolean; updated: Date | null; go: (name: string) => void; onAsk: () => void }) {
  const k = data?.kpis;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const totalOrders = k?.orders ?? 0;
  const lowStock = data?.inventory.low_stock ?? 0;
  const outOfStock = data?.inventory.out_of_stock ?? 0;
  const pending = k?.pending_approvals ?? data?.approvals?.pending ?? 0;
  const attention = (data?.alerts || []).reduce((sum, item) => sum + item.count, 0);
  const health = loading ? 0 : Math.max(0, Math.min(100, 100 - Math.min(45, lowStock * 5) - Math.min(30, outOfStock * 8) - Math.min(20, pending * 5) - Math.min(5, attention)));
  const statusEntries = Object.entries(data?.orders.by_status || {});
  const statusTotal = statusEntries.reduce((sum, [, value]) => sum + value, 0);
  const inventoryParts = [['Healthy stock', Math.max(0, (data?.inventory.units ?? 0) - lowStock - outOfStock)], ['Low stock', lowStock], ['Out of stock', outOfStock]] as [string, number][];

  return <section className="dashboard">
    <section className="dashboard-welcome">
      <div className="welcome-copy"><span className="ai-pulse">✦ AI COMMAND CENTER · LIVE</span><h2>{greeting} 👋</h2><p>Your business command center is ready. Ask the AI, review what needs attention, or jump straight into operations.</p><div className="welcome-actions"><button className="primary-action" onClick={onAsk}>✦ Talk to Seller Agent</button><button onClick={() => go('Analytics')}>View analytics →</button><button onClick={() => go('Inventory')}>Check inventory →</button></div></div>
      <div className="health-orb"><div className="health-ring" style={{ '--health': `${health}%` } as React.CSSProperties}><strong>{loading ? '—' : health}</strong><span>Health</span></div><small>{updated ? `Synced ${updated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Syncing data'}</small></div>
    </section>

    <section className="kpi-strip">
      <Kpi title="Revenue intelligence" value="—" meta="Connect marketplace data" icon="₹" tone="violet" />
      <Kpi title="Orders" value={loading ? '—' : totalOrders} meta="All imported orders" icon="▣" tone="blue" />
      <Kpi title="Inventory" value={loading ? '—' : data?.inventory.units ?? 0} meta={`${lowStock} low stock · ${outOfStock} OOS`} icon="▥" tone="green" />
      <Kpi title="Listings" value={loading ? '—' : k?.listings ?? 0} meta={`${data?.catalog.active_listings ?? 0} active`} icon="▤" tone="amber" />
      <Kpi title="Returns" value={loading ? '—' : k?.returns ?? 0} meta="Return requests" icon="↩" tone="rose" />
      <Kpi title="Approvals" value={loading ? '—' : pending} meta="Awaiting decision" icon="✓" tone="ai" />
    </section>

    <section className="ai-insight-row">
      <article className="insight-card ai-insight"><div className="insight-icon">✦</div><div><span>AI INSIGHT</span><h3>{attention ? `${attention} item${attention === 1 ? '' : 's'} need attention` : 'Your workspace is clear'}</h3><p>{attention ? 'I found operational signals worth reviewing. Open the agent for a guided action plan.' : 'No active alerts right now. Connect your marketplaces to unlock proactive intelligence.'}</p></div><button onClick={onAsk}>Analyze →</button></article>
      <article className="insight-card"><div className="insight-icon green">✓</div><div><span>OPERATIONS</span><h3>{data?.marketplaces.length ? `${data.marketplaces.length} marketplace${data.marketplaces.length > 1 ? 's' : ''} connected` : 'Connect your marketplaces'}</h3><p>{data?.marketplaces.length ? 'Sync status is available below.' : 'Amazon and Flipkart data will power charts, insights and AI recommendations.'}</p></div><button onClick={() => go('Marketplaces')}>{data?.marketplaces.length ? 'Manage →' : 'Connect →'}</button></article>
    </section>

    <section className="analytics-grid">
      <article className="panel chart-panel"><PanelHead title="Order performance" sub="Live marketplace order mix" action={<button onClick={() => go('Analytics')}>Full analytics →</button>} />
        {statusEntries.length ? <div className="bar-chart">{statusEntries.map(([status, count]) => <div className="bar-item" key={status}><div className="bar-label"><span>{status.replaceAll('_', ' ')}</span><b>{count}</b></div><div className="bar-track"><i style={{ width: `${statusTotal ? Math.max(4, (count / statusTotal) * 100) : 0}%` }} /></div></div>)}</div> : <ChartPlaceholder title="Order performance" sub="Charts will populate automatically when marketplace orders are imported." />}
      </article>
      <article className="panel chart-panel"><PanelHead title="Inventory health" sub="Current stock composition" action={<button onClick={() => go('Inventory')}>Open inventory →</button>} />
        <div className="inventory-chart"><div className="donut" style={{ '--p1': `${(inventoryParts[0][1] / Math.max(1, inventoryParts.reduce((s, [, v]) => s + v, 0))) * 100}%`, '--p2': `${(inventoryParts[1][1] / Math.max(1, inventoryParts.reduce((s, [, v]) => s + v, 0))) * 100}%` } as React.CSSProperties}><div><strong>{loading ? '—' : data?.inventory.units ?? 0}</strong><span>units</span></div></div><div className="legend">{inventoryParts.map(([label, value], index) => <div key={label}><i className={`legend-dot d${index}`} /><span>{label}</span><b>{loading ? '—' : value}</b></div>)}</div></div>
      </article>
    </section>

    <section className="lower-grid">
      <article className="panel"><PanelHead title="Needs attention" sub="AI-prioritized operational signals" action={<button onClick={onAsk}>Ask AI →</button>} />
        {(data?.alerts || []).length ? <div className="attention-list">{data!.alerts.slice(0, 5).map((alert, i) => <div className={`attention-item ${alert.severity}`} key={`${alert.message}-${i}`}><span>{alert.severity === 'critical' ? '!' : alert.severity === 'warning' ? '!' : '•'}</span><div><strong>{alert.message}</strong><small>{alert.count} item{alert.count === 1 ? '' : 's'} · {alert.type}</small></div><button onClick={onAsk}>Review</button></div>)}</div> : <Empty text="No active alerts" sub="Seller OS will surface stock, order, listing and operational anomalies here." />}
      </article>
      <article className="panel"><PanelHead title="Quick actions" sub="Jump into the workflows you use most" /><div className="command-actions">{[['✦','AI Seller Agent','Analyze anything'],['▣','Orders','Manage orders'],['▥','Inventory','Stock health'],['◫','Products','Catalog'],['▤','Listings','Listing lifecycle'],['₹','Pricing','Pricing intelligence']].map(([icon,title,sub]) => <button key={title} onClick={() => title === 'AI Seller Agent' ? onAsk() : go(title)}><i>{icon}</i><span><b>{title}</b><small>{sub}</small></span><em>→</em></button>)}</div></article>
    </section>

    <section className="bottom-intelligence"><article className="panel"><PanelHead title="Marketplace pulse" sub="Connection and sync health" />{data?.marketplaces.length ? <div className="market-pulse">{data.marketplaces.map(market => <div key={market.id}><span className="market-logo">{market.marketplace.slice(0,1).toUpperCase()}</span><div><b>{market.marketplace}</b><small>{market.status} · Last sync {time(market.last_sync_at)}</small></div><span className="sync-ok">●</span></div>)}</div> : <Empty text="No marketplace accounts configured" sub="Connect Amazon or Flipkart to unlock live commerce intelligence." />}</article><article className="panel"><PanelHead title="Recent activity" sub="What Seller OS has been doing" />{(data?.activity || []).length ? <Rows items={data!.activity.slice(0, 5).map(item => ({ a: item.title, b: item.status, c: time(item.created_at) }))} /> : <Empty text="Ready for your first sync" sub="Background jobs and AI actions will appear here." />}</article></section>

    <div className="screen-shortcuts">{['Control Center','Orders','Inventory','Products','Listings','AI Listing Studio','Marketplaces','Adaptive Autofill','Marketplace Changes','AI Diagnostics'].map(name => <button key={name} onClick={() => go(name)}>{name} →</button>)}</div>
  </section>;
}

function Kpi({ title, value, meta, icon, tone }: { title: string; value: unknown; meta: string; icon: string; tone: string }) { return <article className={`kpi-card ${tone}`}><span className="kpi-icon">{icon}</span><small>{title}</small><strong>{String(value)}</strong><em>{meta}</em></article>; }
function ChartPlaceholder({ title, sub }: { title: string; sub: string }) { return <div className="chart-placeholder"><div className="ghost-bars"><i/><i/><i/><i/><i/><i/><i/></div><div><strong>Waiting for live data</strong><span>{sub}</span></div></div>; }

function ModulePage({ module, data, loading, updated }: { module: Module; data: Overview | null; loading: boolean; updated: Date | null }) {
  const k = data?.kpis;
  const cards: Record<string, [string, unknown, string][]> = { Orders: [['Total orders', k?.orders || 0, 'Imported orders'], ...Object.entries(data?.orders.by_status || {}).slice(0, 5).map(([status, count]): [string, unknown, string] => [status.replaceAll('_', ' '), count, 'orders'])], Inventory: [['Available units', data?.inventory.units || 0, 'Sellable stock'], ['Inventory items', data?.inventory.total_items || 0, 'Tracked SKUs'], ['Low stock', data?.inventory.low_stock || 0, 'At reorder level'], ['Out of stock', data?.inventory.out_of_stock || 0, 'Needs replenishment']], Products: [['Products', k?.products || 0, 'Catalog'], ['Listings', k?.listings || 0, 'All listings'], ['Active listings', data?.catalog.active_listings || 0, 'Published active']], Listings: [['Listings', k?.listings || 0, 'All listings'], ['Active', data?.catalog.active_listings || 0, 'Published']], Returns: [['Returns', k?.returns || 0, 'Return requests']], Automations: [['Pending jobs', k?.pending_jobs || 0, 'Queued / running']], Notifications: [['Active alerts', data?.alerts.length || 0, 'Current issues']], Pricing: [['Products', k?.products || 0, 'Pricing scope']], Advertising: [['Products', k?.products || 0, 'Advertising scope']], Finance: [['Orders', k?.orders || 0, 'Finance source']], Analytics: [['Orders', k?.orders || 0, 'Analytics source']] };
  const moduleCards = cards[module.name] || [['Seller Hub', 1, 'Workspace']];
  return <section className="module-page"><div className={`module-hero ${module.tone}`}><div className="module-mark">{module.icon}</div><div><p className="eyebrow">{module.group.toUpperCase()} CENTER</p><h2>{module.name}</h2><p>{module.description}. This workspace is connected to the live Seller Hub overview.</p></div><span className="connection">● {loading ? 'Refreshing' : `Live · ${updated ? updated.toLocaleTimeString('en-IN') : 'ready'}`}</span></div><section className="cards">{moduleCards.map(([title, value, sub]) => <article className="card" key={title}><span>{title}</span><strong>{loading ? '—' : String(value)}</strong><small>{sub}</small></article>)}</section><div className="module-data"><article className="panel"><PanelHead title="Live workspace data" sub="Read from the central operations API"/>{module.name === 'Notifications' ? <Rows items={(data?.alerts || []).map(alert => ({ a: alert.message, b: alert.count, c: alert.severity }))} empty="No active alerts" /> : module.name === 'Automations' ? <Rows items={(data?.jobs.recent || []).map(job => ({ a: job.title, b: job.status, c: time(job.created_at) }))} empty="No jobs yet" /> : <Rows items={genericRows(module.name, data)} empty="No records available yet" />}</article></div></section>;
}
function genericRows(name: string, data: Overview | null) { if (name === 'Inventory') return [['Available units', data?.inventory.units || 0, 'sellable units'], ['Low stock', data?.inventory.low_stock || 0, 'reorder attention'], ['Out of stock', data?.inventory.out_of_stock || 0, 'critical attention']].map(([a,b,c]) => ({a,b,c})); if (name === 'Listings') return [['All listings', data?.catalog.listings || 0, 'records'], ['Active listings', data?.catalog.active_listings || 0, 'published']].map(([a,b,c]) => ({a,b,c})); if (name === 'Orders') return Object.entries(data?.orders.by_status || {}).map(([a,b]) => ({a, b, c: 'orders'})); if (name === 'Returns') return [{a:'Return requests', b:data?.kpis.returns || 0, c:'records'}]; return [{a:'Products in catalog', b:data?.kpis.products || 0, c:'available for this workspace'}]; }
function PanelHead({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) { return <div className="panelhead"><div><h2>{title}</h2><p>{sub}</p></div>{action}</div>; }
function Rows({ items, empty = 'No data available yet' }: { items: { a: unknown; b: unknown; c: unknown }[]; empty?: string }) { return items.length ? <div className="rows">{items.map((item, index) => <div key={`${String(item.a)}-${index}`}><b>{String(item.a)}</b><strong>{String(item.b)}</strong><em>{String(item.c)}</em></div>)}</div> : <Empty text={empty} />; }
function Empty({ text, sub }: { text: string; sub?: string }) { return <div className="empty"><strong>{text}</strong>{sub && <small>{sub}</small>}</div>; }
createRoot(document.getElementById('root')!).render(<App />);