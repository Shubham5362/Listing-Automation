import React from 'react';
import './autofill.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function AutofillWorkspace() {
  const [productId, setProductId] = React.useState('');
  const [marketplace, setMarketplace] = React.useState('amazon');
  const [mode, setMode] = React.useState('review');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const plan = async () => {
    if (!productId) return setError('Enter a product ID.');
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/api/v1/autofill/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ product_id: Number(productId), marketplace, mode }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || `API returned ${response.status}`);
      setResult(body);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to prepare autofill.'); }
    finally { setLoading(false); }
  };

  return <section className="module-page"><div className="module-hero ai"><div className="module-mark">✦</div><div><p className="eyebrow">AI AUTOMATION CENTER</p><h2>Adaptive Autofill</h2><p>Understand marketplace fields, map them to verified Product Brain facts, and stop safely when evidence is missing.</p></div><span className="connection">● Safety-first</span></div><article className="panel" style={{ marginTop: 18 }}><div className="panelhead"><div><h2>Prepare an Autofill Session</h2><p>No marketplace submission or publishing is performed by this planner.</p></div></div><div className="form-grid"><label>Product ID<input value={productId} onChange={e => setProductId(e.target.value)} placeholder="e.g. 101" inputMode="numeric" /></label><label>Marketplace<select value={marketplace} onChange={e => setMarketplace(e.target.value)}><option value="amazon">Amazon</option><option value="flipkart">Flipkart</option></select></label><label>Mode<select value={mode} onChange={e => setMode(e.target.value)}><option value="draft">Draft</option><option value="review">Review</option><option value="auto">Auto</option><option value="strict">Strict</option></select></label><button className="primary-action" onClick={plan} disabled={loading}>{loading ? 'Analyzing…' : 'Analyze & Prepare'}</button></div>{error && <div className="errorbar" role="alert">{error}</div>}</article>{result && <div className="grid" style={{ marginTop: 18 }}><article className="panel"><div className="panelhead"><div><h2>{result.ready ? 'Ready for safe execution' : 'Review required'}</h2><p>{result.decisions?.length || 0} marketplace fields analyzed</p></div></div><div className="rows">{(result.decisions || []).map((item: any, index: number) => <div key={`${item.field}-${index}`}><b>{item.field}</b><strong>{item.status}</strong><em>{item.value == null ? 'No verified value' : `${String(item.value)} · ${item.confidence}% confidence`}</em></div>)}</div></article><article className="panel"><div className="panelhead"><div><h2>Safety report</h2><p>Required data and protected actions</p></div></div><div className="rows"><div><b>Missing required</b><strong>{result.missing_required?.length || 0}</strong><em>{(result.missing_required || []).join(', ') || 'None'}</em></div><div><b>High-risk actions</b><strong>Blocked</strong><em>Publish, submit, delete, price and inventory changes</em></div><div><b>Schema</b><strong>{result.schema_version}</strong><em>Adapter {result.adapter_version}</em></div></div></article></div>}</section>;
}
