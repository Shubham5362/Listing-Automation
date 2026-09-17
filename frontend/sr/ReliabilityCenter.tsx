import React from 'react';

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function ReliabilityCenter() {
  const [health, setHealth] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => {
    const r = await fetch(`${API}/api/v1/reliability/health`, { headers: { Accept: 'application/json' } });
    if (r.ok) setHealth(await r.json());
  }, []);
  React.useEffect(() => { void load(); }, [load]);
  const toggle = async () => {
    setBusy(true);
    try {
      await fetch(`${API}/api/v1/reliability/autonomous/kill-switch`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ enabled: !health?.autonomous_execution_paused, reason: 'Seller safety control' }) });
      await load();
    } finally { setBusy(false); }
  };
  return <section className="module-panel">
    <div className="module-header"><div><h2>System Reliability Center</h2><p>Production health, dependencies and autonomous safety controls.</p></div></div>
    <div className="stats-grid">
      <div className="stat-card"><span>Status</span><strong>{health?.status || 'Loading…'}</strong></div>
      <div className="stat-card"><span>Failed Jobs</span><strong>{health?.failed_jobs ?? '—'}</strong></div>
      <div className="stat-card"><span>Dead Letters</span><strong>{health?.dead_letter_jobs ?? '—'}</strong></div>
      <div className="stat-card"><span>Autonomous Success</span><strong>{health ? `${(health.autonomous_success_rate * 100).toFixed(1)}%` : '—'}</strong></div>
    </div>
    <div className="module-panel" style={{marginTop:16}}><h3>Dependencies</h3>{health && Object.entries(health.dependencies).map(([name, item]: any) => <div key={name} className="list-row"><span>{name}</span><strong>{item.status}</strong></div>)}</div>
    <button type="button" onClick={toggle} disabled={busy || !health}>{health?.autonomous_execution_paused ? 'Resume Autonomous Execution' : 'Pause Autonomous Execution'}</button>
  </section>;
}
