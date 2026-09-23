import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const request = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, {
  ...init,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers || {}) },
});

type CatalogItem = { marketplace: string; adapter_version: string; categories: string[] };
type KnowledgeItem = { id: number; marketplace: string; category: string; adapter_version: string; schema_version: string; field_count: number; status: string; source: string; updated_at: string };

export default function MarketplaceFormKnowledgeCenter() {
  const [catalog, setCatalog] = React.useState<CatalogItem[]>([]);
  const [knowledge, setKnowledge] = React.useState<KnowledgeItem[]>([]);
  const [details, setDetails] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const response = await request('/marketplace-form-knowledge');
      if (!response.ok) throw new Error(`Knowledge API returned ${response.status}`);
      const body = await response.json();
      setCatalog(body.catalog || []);
      setKnowledge(body.knowledge || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load marketplace form knowledge');
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const sync = async (marketplace: string) => {
    setBusy(true);
    setMessage(`Saving ${marketplace} form knowledge…`);
    try {
      const response = await request(`/marketplace-form-knowledge/${marketplace}/sync`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || `Sync failed (${response.status})`);
      setMessage(`${marketplace} form knowledge saved.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save form knowledge');
    } finally { setBusy(false); }
  };

  const inspect = async (marketplace: string) => {
    try {
      const response = await request(`/marketplace-form-knowledge/${marketplace}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || `Inspect failed (${response.status})`);
      setDetails(body);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect form knowledge');
    }
  };

  return <section className="module-page">
    <div className="module-hero violet"><div className="module-mark">⌘</div><div><p className="eyebrow">PHASE 1 · MARKETPLACE KNOWLEDGE</p><h2>Marketplace Form Knowledge</h2><p>Save each marketplace field schema once so the listing engine can reuse it instead of rediscovering the form every time.</p></div></div>
    {message && <div className="errorbar" role="status">{message}</div>}
    <article className="panel" style={{ marginTop: 18 }}>
      <div className="panelhead"><div><h2>Marketplace catalog</h2><p>Each registered adapter is stored independently for the seller account.</p></div></div>
      <div className="rows">{catalog.map(item => {
        const saved = knowledge.filter(k => k.marketplace === item.marketplace);
        return <div key={item.marketplace}>
          <b>{item.marketplace}<small> · Adapter v{item.adapter_version}</small></b>
          <strong>{saved.length ? 'Saved' : 'Not saved'}</strong>
          <em>{item.categories.length} schema(s) · {saved.reduce((n, k) => n + k.field_count, 0)} stored fields</em>
          <span className="screen-shortcuts"><button disabled={busy} onClick={() => sync(item.marketplace)}>Save / Refresh</button><button onClick={() => inspect(item.marketplace)}>View fields</button></span>
        </div>;
      })}</div>
    </article>
    {details && <article className="panel" style={{ marginTop: 18 }}>
      <div className="panelhead"><div><h2>{details.marketplace} · {details.category}</h2><p>Canonical mappings are preserved for the future AI form-filling engine.</p></div><button onClick={() => setDetails(null)}>Close</button></div>
      <div className="rows">{(details.fields || []).map((field: any) => <div key={field.name}>
        <b>{field.name}<small> · {field.canonical}</small></b>
        <strong>{field.required ? 'Required' : 'Optional'}</strong>
        <em>{field.field_type}{field.unit ? ` · ${field.unit}` : ''}{field.enum?.length ? ` · ${field.enum.length} options` : ''}</em>
      </div>)}</div>
    </article>}
  </section>;
}
