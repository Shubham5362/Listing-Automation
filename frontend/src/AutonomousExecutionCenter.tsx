import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function AutonomousExecutionCenter({ sellerAccountId = 1 }: { sellerAccountId?: number }) {
  const [dashboard, setDashboard] = React.useState<any>(null);
  const [opportunities, setOpportunities] = React.useState<any[]>([]);
  const [error, setError] = React.useState('');
  const load = React.useCallback(async () => {
    try {
      const [d, o] = await Promise.all([
        fetch(`${API_BASE}/api/v1/autonomous-execution/dashboard?seller_account_id=${sellerAccountId}`),
        fetch(`${API_BASE}/api/v1/autonomous-execution/opportunities?seller_account_id=${sellerAccountId}`),
      ]);
      if (!d.ok || !o.ok) throw new Error('Unable to load autonomous execution data');
      setDashboard(await d.json()); setOpportunities(await o.json()); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load data'); }
  }, [sellerAccountId]);
  React.useEffect(() => { load(); }, [load]);
  return <section className="module-page">
    <div className="module-hero ai"><div className="module-mark">⚡</div><div><p className="eyebrow">AUTONOMOUS OPERATIONS</p><h2>Execution & Business Intelligence</h2><p>One control surface for cross-marketplace plans, approvals and ranked business opportunities.</p></div><span className="connection">● Safety gated</span></div>
    {error && <div className="errorbar" role="alert">{error} <button onClick={load}>Retry</button></div>}
    <section className="cards">
      <article className="card"><span>Open opportunities</span><strong>{dashboard?.open_opportunities ?? '—'}</strong><small>Ranked seller actions</small></article>
      <article className="card"><span>Active marketplace jobs</span><strong>{dashboard?.active_marketplace_jobs ?? '—'}</strong><small>Queued / running</small></article>
      <article className="card"><span>Plans</span><strong>{dashboard?.plans?.length ?? '—'}</strong><small>Recent execution plans</small></article>
    </section>
    <section className="panel"><div className="panelhead"><div><h2>Execution plans</h2><p>High-risk or low-confidence actions remain approval-gated.</p></div></div><div className="rows">{(dashboard?.plans || []).map((p: any) => <div key={p.id}><b>{p.intent}</b><strong>{p.status}</strong><em>{p.risk} · {(p.confidence * 100).toFixed(0)}% confidence</em></div>)}</div></section>
    <section className="panel"><div className="panelhead"><div><h2>Top opportunities</h2><p>Business intelligence converted into actionable priorities.</p></div></div><div className="rows">{opportunities.slice(0, 10).map((o: any) => <div key={o.id}><b>{o.title}</b><strong>{o.score.toFixed(0)}</strong><em>{o.priority} · {o.area} · {o.reason || 'Review recommended'}</em></div>)}</div></section>
  </section>;
}
