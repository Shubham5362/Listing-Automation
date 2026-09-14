import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = (path: string, options?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(options?.headers || {}) } });
const time = (value: string | null) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

type Job = { id: number; name: string; status: string; attempts: number; max_attempts: number; error: string | null; created_at: string | null; started_at: string | null; finished_at: string | null };
type Action = { id: number; action: string; risk: string; status: string; reason: string | null; job_id: number | null; error: string | null; created_at: string | null; approved_at: string | null; completed_at: string | null };

export default function OperationsControlCenter() {
  const [tab, setTab] = React.useState<'control' | 'jobs' | 'approvals' | 'audit'>('control');
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [actions, setActions] = React.useState<Action[]>([]);
  const [audit, setAudit] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [jobsResponse, actionsResponse, auditResponse] = await Promise.all([api('/operations/jobs'), api('/operations/actions'), api('/operations/audit')]);
      if (!jobsResponse.ok || !actionsResponse.ok || !auditResponse.ok) throw new Error('Operations API unavailable');
      setJobs((await jobsResponse.json()).jobs || []);
      setActions((await actionsResponse.json()).actions || []);
      setAudit(await auditResponse.json());
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load operations');
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, [load]);

  const approve = async (id: number) => { const response = await api(`/operations/actions/${id}/approve`, { method: 'POST' }); if (!response.ok) { setMessage(await response.text()); return; } setMessage('Action approved and queued.'); await load(); };
  const reject = async (id: number) => { const response = await api(`/operations/actions/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason: 'Rejected from Operations Center' }) }); if (!response.ok) { setMessage(await response.text()); return; } setMessage('Action rejected.'); await load(); };
  const retry = async (id: number) => { const response = await api(`/operations/jobs/${id}/retry`, { method: 'POST' }); if (!response.ok) { setMessage(await response.text()); return; } setMessage('Job re-queued.'); await load(); };

  const pending = actions.filter(item => item.status === 'pending').length;
  const running = jobs.filter(item => item.status === 'running').length;
  const failed = jobs.filter(item => item.status === 'failed').length;
  const completed = jobs.filter(item => item.status === 'completed').length;

  return <section className="module-page">
    <div className="module-hero ai"><div className="module-mark">⚡</div><div><p className="eyebrow">OPERATIONS CONTROL</p><h2>Control Center</h2><p>Approve, execute, monitor and recover real Seller Hub operations from one place.</p></div><span className="connection">● {loading ? 'Refreshing' : 'Live'}</span></div>
    {message && <div className="errorbar" role="status">{message}<button onClick={() => setMessage('')}>×</button></div>}
    <div className="cards">
      <article className="card"><span>Pending approvals</span><strong>{pending}</strong><small>Require owner decision</small></article>
      <article className="card"><span>Running jobs</span><strong>{running}</strong><small>Worker execution</small></article>
      <article className="card"><span>Failed jobs</span><strong>{failed}</strong><small>Recovery available</small></article>
      <article className="card"><span>Completed jobs</span><strong>{completed}</strong><small>Successful operations</small></article>
    </div>
    <div className="screen-shortcuts control-tabs">
      {([['control','Overview'],['jobs','Job Center'],['approvals',`Approvals${pending ? ` (${pending})` : ''}`],['audit','Audit Log']] as const).map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
      <button onClick={load}>↻ Refresh</button>
    </div>

    {tab === 'control' && <div className="grid module-grid">
      <article className="panel"><PanelHead title="Operational pipeline" sub="Every sensitive action follows a controlled lifecycle"/><div className="pipeline"><Step n="01" title="Request" text="Action is recorded with risk and payload."/><Step n="02" title="Validate" text="Seller ownership and supported action are checked."/><Step n="03" title="Approve" text="Medium and high-risk actions wait for you."/><Step n="04" title="Queue" text="Approved actions become background jobs."/><Step n="05" title="Execute" text="Worker calls the marketplace adapter."/><Step n="06" title="Verify & audit" text="Result is stored and lifecycle is recorded."/></div></article>
      <article className="panel"><PanelHead title="Safety policy" sub="Current Phase 3 execution gates"/><Check text="Low-risk sync can queue automatically"/><Check text="Medium-risk changes require approval"/><Check text="High-risk listing publish requires approval"/><Check text="Every action is seller-scoped"/><Check text="Marketplace credentials stay server-side"/><Check text="Failed jobs can be recovered"/></article>
    </div>}

    {tab === 'jobs' && <article className="panel"><PanelHead title="Job Center" sub="Background execution queue and recovery"/><JobRows jobs={jobs} retry={retry}/></article>}
    {tab === 'approvals' && <article className="panel"><PanelHead title="Approval Center" sub="Only pending owner decisions are actionable"/>{actions.filter(item => item.status === 'pending').length ? <div className="rows">{actions.filter(item => item.status === 'pending').map(item => <div className="action-row" key={item.id}><b>#{item.id} · {item.action}</b><strong>{item.risk} risk</strong><em>{item.reason || 'No reason supplied'} · {time(item.created_at)}</em><span><button onClick={() => approve(item.id)}>Approve</button><button onClick={() => reject(item.id)}>Reject</button></span></div>)}</div> : <Empty text="No approvals waiting" sub="The approval queue is clear."/>}</article>}
    {tab === 'audit' && <article className="panel"><PanelHead title="Audit Log" sub="Traceable action decisions and execution events"/><div className="rows">{audit.length ? audit.map(row => <div key={row.id}><b>{row.action}</b><strong>#{row.resource_id || row.id}</strong><em>{time(row.created_at)} · {JSON.stringify(row.details)}</em></div>) : <Empty text="No action audit entries yet"/>}</div></article>}

    <article className="panel"><PanelHead title="Recent actions" sub="Full action lifecycle"/><div className="rows">{actions.slice(0, 8).map(item => <div key={item.id}><b>#{item.id} · {item.action}</b><strong>{item.status}</strong><em>{item.risk} risk · job {item.job_id ?? '—'} · {time(item.created_at)}</em></div>)}{!actions.length && <Empty text="No actions created yet"/>}</div></article>
  </section>;
}

function JobRows({ jobs, retry }: { jobs: Job[]; retry: (id: number) => void }) { return jobs.length ? <div className="rows">{jobs.map(job => <div key={job.id}><b>#{job.id} · {job.name}</b><strong>{job.status}</strong><em>{job.attempts}/{job.max_attempts} attempts · created {time(job.created_at)}{job.error ? ` · ${job.error}` : ''}</em>{job.status === 'failed' && <button onClick={() => retry(job.id)}>Retry</button>}</div>)}</div> : <Empty text="No jobs yet" sub="Background operations will appear here when work is queued."/>; }
function Step({ n, title, text }: { n: string; title: string; text: string }) { return <div className="pipeline-step"><b>{n}</b><div><strong>{title}</strong><span>{text}</span></div></div>; }
function Check({ text }: { text: string }) { return <div className="check"><b>✓</b><span>{text}</span></div>; }
function PanelHead({ title, sub }: { title: string; sub: string }) { return <div className="panelhead"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
function Empty({ text, sub }: { text: string; sub?: string }) { return <div className="empty"><strong>{text}</strong>{sub && <small>{sub}</small>}</div>; }
