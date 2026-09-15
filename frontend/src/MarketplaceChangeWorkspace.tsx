import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function MarketplaceChangeWorkspace() {
  const [changes, setChanges] = React.useState<any[]>([]);
  const [marketplace, setMarketplace] = React.useState('amazon');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/marketplace-changes?marketplace=${encodeURIComponent(marketplace)}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`API ${response.status}`);
      setChanges(await response.json());
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load marketplace changes');
    } finally { setLoading(false); }
  }, [marketplace]);

  const scan = async () => {
    setLoading(true); setMessage('Scanning adapter schema…');
    try {
      const response = await fetch(`${API_BASE}/api/v1/marketplace-changes/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ marketplace }) });
      if (!response.ok) throw new Error(`Scan failed (${response.status})`);
      const result = await response.json();
      setMessage(`${result.changes?.length || 0} schema changes detected.`);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Scan failed'); setLoading(false); }
  };

  React.useEffect(() => { load(); }, [load]);

  return <section className="module-page"><div className="module-hero ai"><div className="module-mark">↻</div><div><p className="eyebrow">INTELLIGENCE CENTER</p><h2>Marketplace Changes</h2><p>Detect schema changes, assess impact and safely adapt marketplace mappings.</p></div><span className="connection">● {loading ? 'Working' : 'Ready'}</span></div><div className="panel" style={{ marginBottom: 16 }}><div className="panelhead"><div><h2>Schema Watcher</h2><p>Compare the current adapter schema with the latest stored snapshot.</p></div><div className="top-actions"><select value={marketplace} onChange={e => setMarketplace(e.target.value)}><option value="amazon">Amazon</option><option value="flipkart">Flipkart</option></select><button onClick={scan} disabled={loading}>↻ Scan now</button></div></div>{message && <p className="muted">{message}</p>}</div><div className="panel"><div className="panelhead"><div><h2>Detected changes</h2><p>High-risk changes stay review-only; safe mappings can be adapted with audit history.</p></div></div>{changes.length ? <div className="rows">{changes.map(change => <div key={change.id}><b>{change.field_name || change.change_type}</b><strong>{change.confidence}%</strong><em>{change.category} · {change.severity} · {change.status}{change.auto_adaptable ? ' · safe adaptation' : ' · review'}</em></div>)}</div> : <div className="empty"><strong>No schema changes detected</strong><small>Run a scan to compare the marketplace adapter snapshot.</small></div>}</div></section>;
}
