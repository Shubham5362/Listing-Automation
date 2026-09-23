import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const request = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, {
  ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers || {}) },
});

type Template = { id:number; marketplace:string; category:string; name:string; version:number; status:string; field_count:number; source:string; updated_at:string };

export default function MasterListingCenter() {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [productId, setProductId] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('amazon');
  const [category, setCategory] = React.useState('generic');
  const [session, setSession] = React.useState<any>(null);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    const res = await request('/master-listing/templates');
    if (res.ok) setTemplates((await res.json()).templates || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const start = async () => {
    setMessage('');
    const res = await request('/master-listing/teach/sessions', {
      method:'POST', body:JSON.stringify({product_id:Number(productId), marketplace, category}),
    });
    const body = await res.json();
    if (!res.ok) { setMessage(body.detail || 'Unable to start Teach AI'); return; }
    setSession(body);
    setMessage('Teach session started. Review the detected fields and map anything the AI cannot understand.');
  };

  const complete = async () => {
    if (!session) return;
    const fields = (session.observed_fields || []).map((f:any) => ({
      ...f,
      canonical: f.canonical || '',
    }));
    const res = await request(`/master-listing/teach/sessions/${session.id}/fields`, {
      method:'POST', body:JSON.stringify({fields}),
    });
    const body = await res.json();
    if (!res.ok) { setMessage(body.detail || 'Unable to save taught fields'); return; }
    setSession(body);
    if (body.state === 'needs_clarification') {
      setMessage('Some fields are still unclear. Add their canonical mapping before completing.');
      return;
    }
    const done = await request(`/master-listing/teach/sessions/${session.id}/complete`, {method:'POST',body:'{}'});
    const result = await done.json();
    if (!done.ok) { setMessage(result.detail || 'Unable to complete Master Listing'); return; }
    setMessage(`Master Listing saved: ${result.name} v${result.version}`);
    setSession(null);
    await load();
  };

  return <section className="module-page" style={{marginTop:18}}>
    <div className="module-hero violet">
      <div className="module-mark">✦</div>
      <div><p className="eyebrow">PHASE 2 · TEACH AI</p><h2>Master Listing</h2>
      <p>Teach the marketplace form once. The mapping is reused by future autofill instead of asking you every time.</p></div>
    </div>
    {message && <div className="errorbar" role="status">{message}</div>}
    <article className="panel" style={{marginTop:18}}>
      <div className="panelhead"><div><h2>Teach a marketplace</h2><p>Use one real product/category as the teaching example.</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,padding:16}}>
        <input placeholder="Product ID" value={productId} onChange={e=>setProductId(e.target.value)} />
        <select value={marketplace} onChange={e=>setMarketplace(e.target.value)}><option value="amazon">Amazon</option><option value="flipkart">Flipkart</option></select>
        <input placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} />
      </div>
      <div style={{padding:'0 16px 16px'}}><button disabled={!productId} onClick={start}>Start Teach AI</button></div>
    </article>

    {session && <article className="panel" style={{marginTop:18}}>
      <div className="panelhead"><div><h2>Field mapping</h2><p>AI keeps the marketplace field name separate from the canonical Product Brain field.</p></div><button onClick={complete}>Save & Learn</button></div>
      <div className="rows">{(session.observed_fields || []).map((field:any, i:number)=><div key={i}>
        <b>{field.label || field.name}<small> · {field.name}</small></b>
        <strong>{field.canonical || 'Needs mapping'}</strong>
        <em>{field.required ? 'Required' : 'Optional'}{field.unit ? ` · ${field.unit}` : ''}</em>
      </div>)}</div>
    </article>}

    <article className="panel" style={{marginTop:18}}>
      <div className="panelhead"><div><h2>Learned templates</h2><p>These mappings become reusable Master Listings.</p></div></div>
      <div className="rows">{templates.map(t=><div key={t.id}>
        <b>{t.name}<small> · {t.marketplace} / {t.category}</small></b>
        <strong>v{t.version}</strong><em>{t.field_count} fields · {t.source}</em>
      </div>)}</div>
    </article>
  </section>;
}
