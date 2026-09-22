import React from 'react';

type Prediction = { type: string; horizon_days: number; score: number; confidence: number; title: string; reason: string; action: string };
type Report = { seller_account_id: number; generated_at: string; health_score: number; predictions: Prediction[]; kpis: Record<string, unknown>; forecasts: Record<string, unknown>; advertising: Record<string, unknown> };

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function PredictiveBusinessCenter({ sellerAccountId }: { sellerAccountId: number }) {
  const [report, setReport] = React.useState<Report | null>(null);
  const [mode, setMode] = React.useState('recommend');
  const [message, setMessage] = React.useState('');
  const load = React.useCallback(async () => {
    const response = await fetch(`${API_BASE}/api/v1/predictive/report`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Predictive API returned ${response.status}`);
    setReport(await response.json());
  }, []);
  React.useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to load predictions')); }, [load]);
  const run = async () => {
    setMessage('Running AI Business Autopilot…');
    const response = await fetch(`${API_BASE}/api/v1/predictive/autopilot/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
    const data = await response.json();
    setMessage(response.ok ? `Run #${data.run_id} completed · ${data.approval_count} decision(s) remain approval-gated.` : data.detail || 'Autopilot run failed');
  };
  const health = report?.health_score ?? 0;
  return <section className="module-page">
    <div className="module-hero ai"><div className="module-mark">◈</div><div><p className="eyebrow">INTELLIGENCE CENTER</p><h2>AI Business Autopilot</h2><p>Predictive risks, business health and controlled autonomous decisions.</p></div><span className="connection">● Predictive</span></div>
    <section className="cards">
      <article className="card"><span>Business health</span><strong>{health.toFixed(0)}</strong><small>0–100 operating score</small></article>
      <article className="card"><span>Predictions</span><strong>{report?.predictions.length ?? 0}</strong><small>Current forward signals</small></article>
      <article className="card"><span>Inventory horizon</span><strong>{String(report?.forecasts.inventory_days ?? '—')}</strong><small>Estimated coverage days</small></article>
      <article className="card"><span>Margin</span><strong>{String(report?.kpis.margin_percent ?? '—')}</strong><small>Current net margin %</small></article>
    </section>
    <div className="module-data"><article className="panel"><div className="panelhead"><div><h2>Predicted risks & opportunities</h2><p>Ranked using existing business-intelligence signals.</p></div></div>{report?.predictions.length ? <div className="rows">{report.predictions.map((item, index) => <div key={`${item.type}-${index}`}><b>{item.title}</b><strong>{item.score}</strong><em>{item.reason} · {Math.round(item.confidence * 100)}% confidence · {item.horizon_days}d</em></div>)}</div> : <p>No predictions available yet.</p>}</article></div>
    <div className="panel" style={{ marginTop: 16 }}><div className="panelhead"><div><h2>Autopilot policy</h2><p>High-risk and low-confidence actions never bypass approval.</p></div></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['observe','recommend','approval','auto','strict'].map(value => <button key={value} onClick={() => setMode(value)} aria-pressed={mode === value}>{value}</button>)}<button onClick={run}>Run Autopilot</button></div>{message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}<small>Seller account: {sellerAccountId}</small></div>
  </section>;
}
