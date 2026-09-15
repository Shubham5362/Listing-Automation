import React from 'react';
import MarketplaceWorkspace from './MarketplaceWorkspace';
import MarketplaceChangeWorkspace from './MarketplaceChangeWorkspace';
import OperationsControlCenter from './OperationsControlCenter';
import AISellerAgentWorkspace from './AISellerAgentWorkspace';
import AutofillWorkspace from './AutofillWorkspace';
import ListingIntelligenceWorkspace from './ListingIntelligenceWorkspace';
import DiagnosticWorkspace from './DiagnosticWorkspace';
import { phase00Capabilities, phase00GlobalUX, PHASE_00_NAME, SellerHubCapability } from './phase00';
import './phase00.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json', ...(init?.headers || {}) }, ...init });

type Overview = { kpis?: Record<string, number>; inventory?: Record<string, number>; catalog?: Record<string, number>; orders?: { by_status?: Record<string, number> }; marketplaces?: any[]; alerts?: any[]; jobs?: any; activity?: any[] };
type RecordRow = Record<string, unknown>;

const endpointFor: Record<string, string> = {
  orders: '/orders', products: '/catalog/products', listings: '/listing-operations/listings', inventory: '/inventory', returns: '/returns', pricing: '/pricing', advertising: '/advertising', analytics: '/advanced-analytics', finance: '/finance', automations: '/automation', notifications: '/notifications', marketplaces: '/marketplaces', diagnostics: '/diagnostics', reports: '/finance/reports',
};

export default function Phase00App() {
  const [active, setActive] = React.useState('dashboard');
  const [dark, setDark] = React.useState(() => localStorage.getItem('seller_hub_theme') === 'dark');
  const [mobile, setMobile] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [command, setCommand] = React.useState('');
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('seller_hub_theme', dark ? 'dark' : 'light'); }, [dark]);
  const loadOverview = React.useCallback(async () => { try { const r = await api('/operations/overview'); if (!r.ok) throw new Error(`API ${r.status}`); setOverview(await r.json()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Seller Hub'); } }, []);
  React.useEffect(() => { loadOverview(); const t = window.setInterval(loadOverview, 30000); return () => window.clearInterval(t); }, [loadOverview]);

  const go = (id: string) => { setActive(id); setMobile(false); };
  const cap = phase00Capabilities.find(c => c.id === active);
  const groups = ['SELL', 'GROW', 'AUTOMATE', 'SYSTEM'] as const;

  return <div className="p00-shell">
    <a className="p00-skip" href="#p00-main">Skip to content</a>
    <aside className={mobile ? 'open' : ''}>
      <div className="p00-brand"><span>◆</span><div><strong>Seller Hub</strong><small>Personal AI Operations</small></div><button onClick={() => setMobile(false)}>×</button></div>
      <nav>{<button className={active === 'dashboard' ? 'active' : ''} onClick={() => go('dashboard')}><i>⌂</i>Dashboard</button>}{groups.map(group => <div className="p00-group" key={group}><small>{group}</small>{phase00Capabilities.filter(c => c.group === group).map(c => <button key={c.id} className={active === c.id ? 'active' : ''} onClick={() => go(c.id)}><i>{c.icon}</i>{c.label}</button>)}</div>)}</nav>
      <div className="p00-side-status"><small>PHASE 00</small><b>Unified Foundation</b><span>● Private workspace</span></div>
    </aside>
    <main id="p00-main">
      <header className="p00-topbar"><button className="p00-mobile" onClick={() => setMobile(true)}>☰</button><div><small>{cap ? `${cap.group} · SELLER HUB` : 'OVERVIEW · SELLER HUB'}</small><h1>{cap?.label || 'Dashboard'}</h1><p>{cap?.description || PHASE_00_NAME}</p></div><div className="p00-actions"><span>● Live</span><button onClick={() => setDark(v => !v)}>{dark ? '☀' : '◐'}</button><button className="p00-ai" onClick={() => setAiOpen(true)}>✦ Ask AI</button></div></header>
      {error && <div className="p00-error" role="alert">Live data unavailable: {error}<button onClick={loadOverview}>Retry</button></div>}
      {active === 'dashboard' ? <Dashboard overview={overview} go={go} onAI={() => setAiOpen(true)} /> : <CapabilityPage capability={cap!} overview={overview} onAI={() => setAiOpen(true)} />}
    </main>
    {aiOpen && <AISellerAgentWorkspace onClose={() => setAiOpen(false)} />}
  </div>;
}

function Dashboard({ overview, go, onAI }: { overview: Overview | null; go: (id: string) => void; onAI: () => void }) {
  const k = overview?.kpis || {}; const inv = overview?.inventory || {}; const cat = overview?.catalog || {};
  const cards = [['Revenue / GMV', '—', 'Marketplace settlement data'], ['Orders', k.orders ?? 0, 'Unified orders'], ['Units', inv.units ?? 0, 'Sellable + tracked'], ['Listings', k.listings ?? cat.listings ?? 0, `${cat.active_listings ?? 0} active`], ['Returns', k.returns ?? 0, 'Return requests'], ['Approvals', k.pending_approvals ?? 0, 'Awaiting decision']];
  return <section className="p00-page">
    <div className="p00-hero"><div><span>✦ PHASE 00 · COMMAND CENTER</span><h2>Your complete seller operating system.</h2><p>One workspace for selling, growth, automation and system control across Amazon and Flipkart.</p><div className="p00-hero-actions"><button className="primary" onClick={onAI}>✦ Talk to Seller Copilot</button><button onClick={() => go('orders')}>Open orders →</button><button onClick={() => go('inventory')}>Check inventory →</button></div></div><div className="p00-health"><strong>{Math.max(0, 100 - Math.min(80, (inv.low_stock || 0) * 5 + (inv.out_of_stock || 0) * 8))}</strong><span>Operational health</span></div></div>
    <div className="p00-kpis">{cards.map(([a,b,c]) => <article key={a}><small>{a}</small><strong>{b}</strong><span>{c}</span></article>)}</div>
    <div className="p00-grid2"><section className="p00-panel"><PanelTitle title="Order performance" sub="Live order-state distribution" />{Object.entries(overview?.orders?.by_status || {}).map(([s,v]) => <div className="p00-meter" key={s}><span>{s.replaceAll('_',' ')}</span><b>{v}</b><i style={{width:`${Math.max(5, Math.min(100, Number(v) * 8))}%`}} /></div>)}{!Object.keys(overview?.orders?.by_status || {}).length && <Empty text="Waiting for marketplace orders" />}</section><section className="p00-panel"><PanelTitle title="Marketplace pulse" sub="Connection and sync health" />{(overview?.marketplaces || []).map((m:any) => <div className="p00-row" key={m.id}><b>{m.marketplace}</b><span>{m.status}</span><small>{m.last_sync_at ? new Date(m.last_sync_at).toLocaleString('en-IN') : 'Never synced'}</small></div>)}{!(overview?.marketplaces || []).length && <Empty text="Connect Amazon or Flipkart" />}</section></div>
    <section className="p00-panel"><PanelTitle title="All Phase 00 capabilities" sub={`${phase00Capabilities.length} first-class workspaces · ${phase00GlobalUX.length} global UX primitives`} /><div className="p00-cap-grid">{phase00Capabilities.map(c => <button key={c.id} onClick={() => go(c.id)}><i>{c.icon}</i><div><b>{c.label}</b><small>{c.description}</small></div><em>{c.capabilities.length} features →</em></button>)}</div></section>
  </section>;
}

function CapabilityPage({ capability, overview, onAI }: { capability: SellerHubCapability; overview: Overview | null; onAI: () => void }) {
  const [query, setQuery] = React.useState(''); const [tab, setTab] = React.useState('All'); const [rows, setRows] = React.useState<RecordRow[]>([]); const [selected, setSelected] = React.useState<number[]>([]); const [detail, setDetail] = React.useState<RecordRow | null>(null); const [loading, setLoading] = React.useState(false); const [apiNote, setApiNote] = React.useState('');
  const specialized: Record<string, React.ReactNode> = { marketplaces: <MarketplaceWorkspace />, 'control-center': <OperationsControlCenter />, 'ai-listing-studio': <ListingIntelligenceWorkspace />, diagnostics: <DiagnosticWorkspace />, 'ai-seller-copilot': <div className="p00-ai-page"><button className="primary" onClick={onAI}>Open AI Seller Copilot</button><p>Ask questions, analyze anomalies, plan actions and execute approved seller operations.</p></div>, 'automations': null };
  React.useEffect(() => { let live = true; const load = async () => { const endpoint = endpointFor[capability.id]; if (!endpoint) return; setLoading(true); try { const r = await api(endpoint); const body = await r.json(); if (!r.ok) throw new Error(body?.detail || `API ${r.status}`); const list = Array.isArray(body) ? body : body.items || body.data || body.results || []; if (live && Array.isArray(list)) { setRows(list); setApiNote('Live API connected'); } else if (live) setApiNote('Live API connected · summary response'); } catch (e) { if (live) setApiNote(e instanceof Error ? e.message : 'Using overview data'); } finally { if (live) setLoading(false); } }; load(); return () => { live = false; }; }, [capability.id]);
  const fallback = capability.id === 'orders' ? Object.entries(overview?.orders?.by_status || {}).map(([status,count]) => ({status,count})) : capability.id === 'inventory' ? [{metric:'Available units',value:overview?.inventory?.units||0},{metric:'Low stock',value:overview?.inventory?.low_stock||0},{metric:'Out of stock',value:overview?.inventory?.out_of_stock||0}] : capability.id === 'notifications' ? (overview?.alerts || []) : capability.id === 'marketplaces' ? (overview?.marketplaces || []) : [];
  const data = rows.length ? rows : fallback as RecordRow[]; const filtered = data.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()) && (tab === 'All' || Object.values(row).some(v => String(v).toLowerCase().includes(tab.toLowerCase()))));
  const tabs = ['All', ...Array.from(new Set(data.slice(0,30).map(r => String(r.status || r.severity || '').trim()).filter(Boolean))).slice(0,5)];
  const toggle = (i:number) => setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);
  const exportRows = () => { const text = JSON.stringify(filtered, null, 2); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'application/json'})); a.download = `${capability.id}-export.json`; a.click(); URL.revokeObjectURL(a.href); };
  if (specialized[capability.id]) return <section className="p00-page"><div className="p00-feature-head"><div><span>{capability.group}</span><h2>{capability.label}</h2><p>{capability.description}</p></div><button onClick={onAI}>✦ AI Assist</button></div>{specialized[capability.id]}</section>;
  return <section className="p00-page"><div className="p00-feature-head"><div><span>{capability.group} · PHASE 00</span><h2>{capability.label}</h2><p>{capability.description}</p></div><div><button onClick={onAI}>✦ AI Assist</button></div></div>
    <div className="p00-feature-cards">{capability.capabilities.slice(0,6).map((x,i)=><article key={x}><small>{i+1}</small><b>{x}</b><span>{capability.ai ? 'AI-ready workflow' : 'Core configuration'}</span></article>)}</div>
    <section className="p00-panel p00-table-panel"><div className="p00-toolbar"><div className="p00-tabs">{tabs.map(t => <button className={tab===t?'active':''} key={t} onClick={()=>setTab(t)}>{t || 'Status'}</button>)}</div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${capability.label.toLowerCase()}…`} /><button onClick={exportRows}>Export</button><button onClick={()=>window.location.reload()}>Refresh</button></div>{selected.length>0 && <div className="p00-bulk">{selected.length} selected <button onClick={()=>setSelected([])}>Clear</button><button>Bulk action</button></div>}<div className="p00-table-wrap"><table><thead><tr><th><input type="checkbox" checked={selected.length===filtered.length && filtered.length>0} onChange={e=>setSelected(e.target.checked ? filtered.map((_,i)=>i) : [])}/></th><th>Record</th><th>Value</th><th>Status / Meta</th><th>Action</th></tr></thead><tbody>{filtered.map((row,i)=>{ const entries=Object.entries(row); return <tr key={i}><td><input type="checkbox" checked={selected.includes(i)} onChange={()=>toggle(i)}/></td><td><b>{String(row.name || row.title || row.sku || row.id || entries[0]?.[1] || `Record ${i+1}`)}</b><small>{String(row.id || row.sku || entries[1]?.[1] || '')}</small></td><td>{String(row.value ?? row.count ?? entries[1]?.[1] ?? '—')}</td><td><span className="p00-status">{String(row.status || row.severity || entries[2]?.[1] || 'Ready')}</span></td><td><button onClick={()=>setDetail(row)}>View →</button></td></tr>})}</tbody></table>{!filtered.length && <Empty text={loading ? 'Loading live data…' : 'No records available yet'} sub={apiNote || 'Connect a marketplace or import data to populate this workspace.'} />}</div></section>
    <div className="p00-capabilities"><b>Complete capability set</b><div>{capability.capabilities.map(x=><span key={x}>{x}</span>)}</div></div>
    {detail && <div className="p00-drawer-backdrop" onClick={()=>setDetail(null)}><aside className="p00-drawer" onClick={e=>e.stopPropagation()}><button onClick={()=>setDetail(null)}>×</button><h3>Record detail</h3>{Object.entries(detail).map(([k,v])=><div key={k}><small>{k}</small><p>{typeof v === 'object' ? JSON.stringify(v,null,2) : String(v)}</p></div>)}<button className="primary" onClick={onAI}>✦ Analyze with AI</button></aside></div>}
  </section>;
}
function PanelTitle({title,sub}:{title:string;sub:string}){return <div className="p00-panel-title"><div><h3>{title}</h3><p>{sub}</p></div></div>}
function Empty({text,sub}:{text:string;sub?:string}){return <div className="p00-empty"><b>{text}</b>{sub&&<small>{sub}</small>}</div>}
