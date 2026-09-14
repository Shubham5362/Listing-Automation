import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const request = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init?.headers || {}) } });

type Product = { id: number; sku: string; title: string; brand: string | null; category: string | null; has_images: boolean };
type Marketplace = { id: number; marketplace: string; display_name: string; credentials_configured: boolean; connected: boolean };
type Draft = { id: number; product_id: number; marketplace_account_id: number; version: number; title: string; bullets: string[]; description: string; keywords: string[]; attributes: Record<string, unknown>; quality_score: number; validation_errors: string[]; status: string; created_at: string; updated_at: string };
type Workspace = { products: Product[]; marketplaces: Marketplace[]; drafts: Draft[] };

const statusTone = (status: string) => status === 'approved' || status === 'published' ? 'good' : status === 'rejected' ? 'bad' : 'neutral';

export default function ListingAutomationWorkspace() {
  const [data, setData] = React.useState<Workspace | null>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<number | ''>('');
  const [selectedMarketplace, setSelectedMarketplace] = React.useState<number | ''>('');
  const [language, setLanguage] = React.useState('en');
  const [selectedDraft, setSelectedDraft] = React.useState<Draft | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    try { const response = await request('/personal/listing-automation/workspace'); if (!response.ok) throw new Error(`Listing API returned ${response.status}`); const body = await response.json() as Workspace; setData(body); if (!selectedMarketplace && body.marketplaces[0]) setSelectedMarketplace(body.marketplaces[0].id); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load listing workspace'); }
  }, [selectedMarketplace]);
  React.useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!selectedProduct || !selectedMarketplace) { setMessage('Select a product and marketplace first.'); return; }
    setBusy(true); setMessage('Generating and validating listing draft…');
    try { const response = await request('/personal/listing-automation/generate', { method: 'POST', body: JSON.stringify({ product_id: selectedProduct, marketplace_account_id: selectedMarketplace, language }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(String(body.detail || `Generation failed (${response.status})`)); setSelectedDraft(body); setMessage(`Draft #${body.id} created. Review it before approval.`); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Generation failed'); } finally { setBusy(false); }
  };

  const changeStatus = async (draft: Draft, status: string) => {
    setBusy(true); setMessage(`${status === 'review' ? 'Sending to review' : status === 'approved' ? 'Approving' : 'Rejecting'} draft #${draft.id}…`);
    try { const response = await request(`/personal/listing-automation/drafts/${draft.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(String(body.detail || `Status update failed (${response.status})`)); setSelectedDraft(body); setMessage(`Draft #${draft.id} is now ${body.status}.`); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Status update failed'); } finally { setBusy(false); }
  };

  const publish = async (draft: Draft) => {
    const marketplace = data?.marketplaces.find(item => item.id === draft.marketplace_account_id);
    if (!marketplace) return;
    const productType = window.prompt(`Marketplace product type for ${marketplace.display_name}:`, data?.products.find(item => item.id === draft.product_id)?.category || 'PRODUCT');
    if (!productType) return;
    setBusy(true); setMessage(`Queueing approved draft #${draft.id} for ${marketplace.display_name}…`);
    try { const response = await request(`/personal/listing-automation/drafts/${draft.id}/publish`, { method: 'POST', body: JSON.stringify({ product_type: productType }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(String(body.detail || `Publish queue failed (${response.status})`)); setMessage(`Publish job #${body.job_id} queued. Marketplace write will run in the background.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'Publish queue failed'); } finally { setBusy(false); }
  };

  const marketplace = selectedMarketplace ? data?.marketplaces.find(item => item.id === selectedMarketplace) : undefined;
  const ready = data?.drafts.filter(draft => draft.status === 'approved').length || 0;
  const review = data?.drafts.filter(draft => draft.status === 'review').length || 0;
  const published = data?.drafts.filter(draft => draft.status === 'published').length || 0;

  return <section className="module-page">
    <div className="module-hero violet"><div className="module-mark">▤</div><div><p className="eyebrow">FINAL PHASE · LISTING AUTOMATION</p><h2>AI Listing Studio</h2><p>Create marketplace-ready drafts from your live catalog, validate them, approve them and queue controlled publishing.</p></div><span className="connection">● Personal workspace</span></div>
    {message && <div className="errorbar" role="status">{message}<button onClick={load}>Refresh</button></div>}
    <section className="cards"><article className="card"><span>Catalog products</span><strong>{data?.products.length ?? '—'}</strong><small>Active source products</small></article><article className="card"><span>Review queue</span><strong>{review}</strong><small>Drafts awaiting review</small></article><article className="card"><span>Approved</span><strong>{ready}</strong><small>Ready to publish</small></article><article className="card"><span>Published drafts</span><strong>{published}</strong><small>Completed listing lifecycle</small></article></section>
    <div className="grid module-grid">
      <article className="panel"><PanelHead title="Create listing draft" sub="The generator uses the product catalog as its source; it does not invent marketplace facts."/>
        <label>Product<select value={selectedProduct} onChange={event => setSelectedProduct(event.target.value ? Number(event.target.value) : '')}><option value="">Select product</option>{data?.products.map(product => <option key={product.id} value={product.id}>{product.sku} · {product.title}</option>)}</select></label>
        <label>Marketplace<select value={selectedMarketplace} onChange={event => setSelectedMarketplace(event.target.value ? Number(event.target.value) : '')}><option value="">Select marketplace</option>{data?.marketplaces.map(item => <option key={item.id} value={item.id}>{item.display_name} · {item.connected ? 'connected' : item.credentials_configured ? 'ready to test' : 'not configured'}</option>)}</select></label>
        <label>Language<select value={language} onChange={event => setLanguage(event.target.value)}><option value="en">English</option><option value="hi">Hindi</option></select></label>
        <div className="check"><b>✓</b><span><strong>{marketplace?.display_name || 'Marketplace not selected'}</strong><small>{marketplace?.connected ? 'Connection verified' : 'Publishing requires a verified marketplace connection.'}</small></span></div>
        <span className="screen-shortcuts"><button onClick={generate} disabled={busy || !selectedProduct || !selectedMarketplace}>✦ Generate draft</button><button onClick={() => setSelectedDraft(null)} disabled={busy}>Clear</button></span>
      </article>
      <article className="panel"><PanelHead title="Draft preview" sub={selectedDraft ? `Draft #${selectedDraft.id} · v${selectedDraft.version}` : 'Select a draft below or generate a new one.'}/>{selectedDraft ? <DraftPreview draft={selectedDraft} marketplace={data?.marketplaces.find(item => item.id === selectedDraft.marketplace_account_id)?.display_name || 'Marketplace'} onStatus={changeStatus} onPublish={publish} busy={busy}/> : <Empty text="No draft selected" sub="Generated drafts appear here for review before approval."/>}</article>
      <article className="panel"><PanelHead title="Listing pipeline" sub="Every marketplace write remains approval-gated and job-backed."/>{data?.drafts.length ? <div className="rows">{data.drafts.slice(0, 20).map(draft => <div key={draft.id} onClick={() => setSelectedDraft(draft)} style={{ cursor: 'pointer' }}><b>#{draft.id} · {data.products.find(product => product.id === draft.product_id)?.sku || `Product ${draft.product_id}`}</b><strong>{draft.status}</strong><em>Quality {draft.quality_score} · v{draft.version}</em></div>)}</div> : <Empty text="No listing drafts yet" sub="Choose a product and generate the first marketplace draft."/>}</article>
    </div>
  </section>;
}

function DraftPreview({ draft, marketplace, onStatus, onPublish, busy }: { draft: Draft; marketplace: string; onStatus: (draft: Draft, status: string) => void; onPublish: (draft: Draft) => void; busy: boolean }) {
  return <div>
    <div className="check"><b>{draft.quality_score >= 80 && !draft.validation_errors.length ? '✓' : '!'}</b><span><strong>Quality score {draft.quality_score}</strong><small>{marketplace} · {draft.validation_errors.length ? `${draft.validation_errors.length} validation issue(s)` : 'Validation passed'}</small></span></div>
    {draft.validation_errors.length > 0 && <div className="errorbar">{draft.validation_errors.join(' · ')}</div>}
    <h3>{draft.title}</h3><p className="muted">{draft.description}</p>
    <h4>Bullets</h4><ul>{draft.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>
    <h4>Keywords</h4><p className="muted">{draft.keywords.join(' · ')}</p>
    <div className="screen-shortcuts">
      {draft.status === 'draft' && <button disabled={busy} onClick={() => onStatus(draft, 'review')}>Send to review</button>}
      {draft.status === 'review' && <><button disabled={busy} onClick={() => onStatus(draft, 'approved')}>Approve</button><button disabled={busy} onClick={() => onStatus(draft, 'draft')}>Return to draft</button><button disabled={busy} onClick={() => onStatus(draft, 'rejected')}>Reject</button></>}
      {draft.status === 'approved' && <><button disabled={busy} onClick={() => onPublish(draft)}>Queue publish</button><button disabled={busy} onClick={() => onStatus(draft, 'review')}>Back to review</button></>}
      {draft.status === 'published' && <span className={`status-pill ${statusTone(draft.status)}`}>Published</span>}
    </div>
  </div>;
}
function PanelHead({ title, sub }: { title: string; sub: string }) { return <div className="panelhead"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
function Empty({ text, sub }: { text: string; sub?: string }) { return <div className="empty"><strong>{text}</strong>{sub && <small>{sub}</small>}</div>; }
