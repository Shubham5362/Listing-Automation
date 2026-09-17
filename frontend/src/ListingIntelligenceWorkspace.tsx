import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers || {}) } });

type Generation = { id:number; product_id:number; marketplace_account_id:number; version:number; language:string; mode:string; title:string; bullets:string[]; description:string; keywords:string[]; attributes:Record<string,unknown>; variation:Record<string,unknown>; compliance:{status:string;issues:string[]}; quality_score:number; confidence_score:number; source_knowledge_version:number|null; source_schema_version:string|null; status:string };

export default function ListingIntelligenceWorkspace() {
  const [productId, setProductId] = React.useState('');
  const [accountId, setAccountId] = React.useState('');
  const [mode, setMode] = React.useState('review');
  const [language, setLanguage] = React.useState('en');
  const [generation, setGeneration] = React.useState<Generation|null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const generate = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await api('/listing-intelligence/generate', { method:'POST', body:JSON.stringify({product_id:Number(productId), marketplace_account_id:Number(accountId), mode, language}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
      setGeneration(data);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to generate listing'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status:string) => {
    if (!generation) return;
    const res = await api(`/listing-intelligence/${generation.id}/status`, { method:'PATCH', body:JSON.stringify({status}) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.detail || 'Status update failed'); return; }
    setGeneration(data); setMessage(`Listing ${status}.`);
  };

  const apply = async () => {
    if (!generation) return;
    const res = await api(`/listing-intelligence/${generation.id}/apply`, { method:'POST' });
    const data = await res.json();
    if (!res.ok) { setMessage(data.detail || 'Apply failed'); return; }
    setGeneration(data); setMessage('Listing applied to the marketplace-ready catalog record.');
  };

  return <section className="module-page">
    <div className="module-hero ai"><div className="module-mark">✦</div><div><p className="eyebrow">CATALOG INTELLIGENCE CENTER</p><h2>AI Listing Studio</h2><p>Knowledge-driven, marketplace-aware listing generation with contextual variants, quality scoring and compliance gates.</p></div><span className="connection">● Ready</span></div>
    <section className="panel" style={{padding:20, marginBottom:16}}><div className="panelhead"><div><h2>Generate listing</h2><p>Use Product Knowledge as the source of truth. Unsupported claims are blocked.</p></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
      <label>Product ID<input value={productId} onChange={e=>setProductId(e.target.value)} placeholder="e.g. 101" /></label>
      <label>Marketplace Account ID<input value={accountId} onChange={e=>setAccountId(e.target.value)} placeholder="e.g. 3" /></label>
      <label>Language<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">Hindi</option></select></label>
      <label>Mode<select value={mode} onChange={e=>setMode(e.target.value)}><option value="draft">Draft</option><option value="review">Review</option><option value="auto">Auto</option><option value="strict">Strict</option></select></label>
    </div><button className="ai-button" style={{marginTop:14}} disabled={loading || !productId || !accountId} onClick={generate}>{loading ? 'Generating…' : '✦ Generate Listing'}</button>{message && <div className="errorbar" style={{marginTop:12}}>{message}</div>}</section>
    {generation && <>
      <section className="cards"><article className="card"><span>Quality</span><strong>{generation.quality_score}</strong><small>/100</small></article><article className="card"><span>Confidence</span><strong>{generation.confidence_score}%</strong><small>knowledge-backed</small></article><article className="card"><span>Compliance</span><strong>{generation.compliance.status.toUpperCase()}</strong><small>{generation.compliance.issues.length} issue(s)</small></article><article className="card"><span>Variation</span><strong>{generation.variation.is_variant ? 'Variant' : 'Parent'}</strong><small>{String(generation.variation.sibling_count || 0)} siblings</small></article></section>
      <section className="grid bottom"><article className="panel" style={{padding:20}}><div className="panelhead"><div><h2>Title</h2><p>Marketplace-constrained</p></div></div><p>{generation.title}</p><h3>Bullets</h3><ul>{generation.bullets.map((b,i)=><li key={i}>{b}</li>)}</ul></article><article className="panel" style={{padding:20}}><div className="panelhead"><div><h2>SEO keywords</h2><p>{generation.keywords.length} contextual terms</p></div></div><p>{generation.keywords.join(' · ')}</p><h3>Compliance</h3>{generation.compliance.issues.length ? <ul>{generation.compliance.issues.map((x,i)=><li key={i}>{x}</li>)}</ul> : <p>✓ No detected compliance issues</p>}</article></section>
      <section className="panel" style={{padding:20}}><div className="panelhead"><div><h2>Description</h2><p>Fact-grounded content</p></div></div><p>{generation.description}</p><h3>Variant context</h3><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(generation.variation,null,2)}</pre><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{generation.status === 'review' && <><button onClick={()=>updateStatus('approved')}>Approve</button><button onClick={()=>updateStatus('rejected')}>Reject</button></>}{generation.status === 'approved' && <button className="ai-button" onClick={apply}>Apply to Listing</button>}</div></section>
    </>}
  </section>;
}
