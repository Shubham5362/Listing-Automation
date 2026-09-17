import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const request = (path: string) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json' } });

type Adapter = { marketplace: string; adapter_version: string; capabilities: { key: string; enabled: boolean; risk: string }[]; categories: string[] };

export default function MarketplaceAdapterCenter() {
  const [items, setItems] = React.useState<Adapter[]>([]);
  const [selected, setSelected] = React.useState<Adapter | null>(null);
  const [message, setMessage] = React.useState('');
  React.useEffect(() => { request('/marketplace-adapters').then(async r => r.ok ? setItems(await r.json()) : setMessage(`Adapter API returned ${r.status}`)).catch(() => setMessage('Unable to load adapter registry')); }, []);
  const inspect = async (name: string) => { try { const r = await request(`/marketplace-adapters/${name}`); if (!r.ok) throw new Error(`Adapter API returned ${r.status}`); setSelected(await r.json()); } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to load adapter'); } };
  return <article className="panel"><div className="panelhead"><div><h2>Universal Marketplace Adapters</h2><p>Provider-neutral schemas, capabilities and validation foundation for every marketplace.</p></div></div>{message && <div className="errorbar" role="status">{message}</div>}<div className="rows">{items.map(item => <div key={item.marketplace}><b>{item.marketplace}<small> · Adapter v{item.adapter_version}</small></b><strong>● Ready</strong><em>{item.categories.length} schema(s) · {item.capabilities.filter(c => c.enabled).length} capabilities</em><span className="screen-shortcuts"><button onClick={() => inspect(item.marketplace)}>Inspect schema</button></span></div>)}</div>{selected && <div className="panel" style={{ marginTop: 12 }}><div className="panelhead"><div><h2>{selected.marketplace} adapter</h2><p>Schema and capability contract. Publishing remains approval-gated.</p></div><button onClick={() => setSelected(null)}>Close</button></div><div className="rows">{selected.capabilities.map(c => <div key={c.key}><b>{c.key.replaceAll('_', ' ')}</b><strong>{c.enabled ? 'enabled' : 'disabled'}</strong><em>risk: {c.risk}</em></div>)}</div></div>}</article>;
}
