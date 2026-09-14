import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const request = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { ...init, headers: { Accept: 'application/json', ...(init?.headers || {}) } });

type MarketplaceAccount = {
  id: number;
  marketplace: string;
  display_name: string;
  external_account_id: string | null;
  credentials_configured: boolean;
  connected: boolean;
  connection_error: string | null;
  last_connected_at: string | null;
  last_sync_at: string | null;
};

type SyncRun = {
  id: number;
  status: string;
  result: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
};

const time = (value: string | null) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function MarketplaceWorkspace() {
  const [accounts, setAccounts] = React.useState<MarketplaceAccount[]>([]);
  const [runs, setRuns] = React.useState<Record<number, SyncRun[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await request('/personal/marketplaces');
      if (!response.ok) throw new Error(`Marketplace API returned ${response.status}`);
      const next = await response.json() as MarketplaceAccount[];
      setAccounts(next);
      const runEntries = await Promise.all(next.map(async account => {
        const runResponse = await request(`/personal/marketplaces/${account.id}/sync-runs`);
        return [account.id, runResponse.ok ? await runResponse.json() as SyncRun[] : []] as const;
      }));
      setRuns(Object.fromEntries(runEntries));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load marketplace status');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const test = async (account: MarketplaceAccount) => {
    setBusy(account.id);
    setMessage(`Testing ${account.display_name} connection…`);
    try {
      const response = await request(`/personal/marketplaces/${account.id}/test`, { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.detail || `Connection test failed (${response.status})`));
      setMessage(`${account.display_name} connection verified.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Connection test failed');
      await load();
    } finally {
      setBusy(null);
    }
  };

  const sync = async (account: MarketplaceAccount) => {
    setBusy(account.id);
    setMessage(`Queueing ${account.display_name} full sync…`);
    try {
      const response = await request(`/personal/marketplaces/${account.id}/sync`, { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.detail || `Unable to queue sync (${response.status})`));
      setMessage(`${account.display_name} sync queued as job #${body.job_id}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to queue sync');
    } finally {
      setBusy(null);
    }
  };

  return <section className="module-page">
    <div className="module-hero teal"><div className="module-mark">◇</div><div><p className="eyebrow">CONFIGURATION CENTER</p><h2>Marketplaces</h2><p>Real Amazon and Flipkart connections with encrypted server-side credentials and background synchronization.</p></div><span className="connection">● Direct personal workspace</span></div>
    {message && <div className="errorbar" role="status">{message} <button onClick={load}>Refresh</button></div>}
    <section className="cards">
      <article className="card"><span>Configured</span><strong>{loading ? '—' : accounts.length}</strong><small>Marketplace accounts</small></article>
      <article className="card"><span>Connected</span><strong>{loading ? '—' : accounts.filter(account => account.connected).length}</strong><small>Verified connections</small></article>
      <article className="card"><span>Syncing</span><strong>{loading ? '—' : Object.values(runs).flat().filter(run => ['queued', 'running'].includes(run.status)).length}</strong><small>Active sync runs</small></article>
      <article className="card"><span>Last sync</span><strong>{loading ? '—' : time(accounts.map(account => account.last_sync_at).filter(Boolean).sort().at(-1) || null)}</strong><small>Most recent marketplace sync</small></article>
    </section>
    <div className="grid module-grid">
      <article className="panel"><PanelHead title="Marketplace connections" sub="Credentials are supplied server-side; secrets are never shown here."/>
        {accounts.length ? <div className="rows">{accounts.map(account => <div key={account.id}>
          <b>{account.display_name}<small>{account.external_account_id ? ` · ${account.external_account_id}` : ''}</small></b>
          <strong>{account.connected ? 'connected' : account.credentials_configured ? 'ready to test' : 'not configured'}</strong>
          <em>{account.connection_error || `Last sync: ${time(account.last_sync_at)}`}</em>
          <span className="screen-shortcuts"><button disabled={busy === account.id || !account.credentials_configured} onClick={() => test(account)}>Test</button><button disabled={busy === account.id || !account.credentials_configured} onClick={() => sync(account)}>Sync</button></span>
        </div>)}</div> : <Empty text="No marketplace accounts configured" sub="Set the personal marketplace environment variables on the backend, then refresh this workspace."/>}
      </article>
      <article className="panel"><PanelHead title="Recent sync runs" sub="Products, inventory, orders and prices"/>
        {accounts.flatMap(account => (runs[account.id] || []).slice(0, 5).map(run => <div className="check" key={`${account.id}-${run.id}`}><b>{run.status === 'completed' ? '✓' : run.status === 'failed' ? '!' : '•'}</b><span><strong>{account.display_name} · #{run.id}</strong><small>{run.status} · {time(run.finished_at || run.started_at)}{run.error ? ` · ${run.error}` : ''}</small></span></div>)).length ? accounts.flatMap(account => (runs[account.id] || []).slice(0, 5).map(run => <div className="check" key={`run-${account.id}-${run.id}`}><b>{run.status === 'completed' ? '✓' : run.status === 'failed' ? '!' : '•'}</b><span><strong>{account.display_name} · Sync #{run.id}</strong><small>{run.status} · {time(run.finished_at || run.started_at)}{run.error ? ` · ${run.error}` : ''}</small></span></div>)) : <Empty text="No sync runs yet" sub="Use Sync to queue the first marketplace synchronization."/>}
      </article>
    </div>
    <div className="screen-shortcuts"><button onClick={load}>↻ Refresh marketplace status</button></div>
  </section>;
}

function PanelHead({ title, sub }: { title: string; sub: string }) { return <div className="panelhead"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
function Empty({ text, sub }: { text: string; sub?: string }) { return <div className="empty"><strong>{text}</strong>{sub && <small>{sub}</small>}</div>; }
