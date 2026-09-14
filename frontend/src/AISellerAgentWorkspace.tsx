import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, ...init });

type Recommendation = { type: string; priority: string; title: string; reason: string; suggested_action: string; confidence: number; data: Record<string, unknown> };
type Brief = { summary: string; context: { marketplaces: { marketplace: string; connected: boolean; last_sync_at: string | null }[]; products: number; listings: number; active_listings: number; inventory_items: number; inventory_units: number; low_stock: number; out_of_stock: number; campaigns: number }; recommendations: Recommendation[]; approval_required_for_writes: boolean };

export default function AISellerAgentWorkspace() {
  const [brief, setBrief] = React.useState<Brief | null>(null);
  const [message, setMessage] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [chatting, setChatting] = React.useState(false);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const response = await api('/personal/ai/seller-agent/brief');
      if (!response.ok) throw new Error(`AI Agent API returned ${response.status}`);
      const data = await response.json();
      setBrief(data);
      setRecommendations(data.recommendations || []);
      setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load AI Seller Agent'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function ask(createPlan = false) {
    if (!message.trim()) return;
    setChatting(true); setError('');
    try {
      const response = await api('/personal/ai/seller-agent/chat', { method: 'POST', body: JSON.stringify({ message: message.trim(), create_plan: createPlan }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `AI Agent API returned ${response.status}`);
      setAnswer(data.answer || 'No answer returned.');
      if (data.recommendations) setRecommendations(data.recommendations);
      setMessage('');
    } catch (err) { setError(err instanceof Error ? err.message : 'AI request failed'); }
    finally { setChatting(false); }
  }

  const c = brief?.context;
  return <section className="module-page">
    <div className="module-hero ai"><div className="module-mark">✦</div><div><p className="eyebrow">INTELLIGENCE CENTER</p><h2>AI Seller Agent</h2><p>Supervised business analysis, planning and approval-gated operations.</p></div><span className="connection">● {loading ? 'Analyzing' : 'Live'}</span></div>
    {error && <div className="errorbar" role="alert">{error} <button onClick={load}>Retry</button></div>}
    <section className="cards">
      {[["Products", c?.products ?? 0, 'catalog'], ["Inventory", c?.inventory_units ?? 0, 'available units'], ["Low stock", c?.low_stock ?? 0, 'needs attention'], ["Out of stock", c?.out_of_stock ?? 0, 'critical'], ["Campaigns", c?.campaigns ?? 0, 'advertising']].map(([title, value, sub]) => <article className="card" key={title}><span>{title}</span><strong>{loading ? '—' : String(value)}</strong><small>{sub}</small></article>)}
    </section>
    <div className="grid module-grid">
      <article className="panel"><PanelHead title="Ask your seller agent" sub="Natural-language commands use verified Seller Hub data."/><div className="agent-chat"><textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') ask(); }} placeholder="e.g. What needs attention today? Which inventory is at risk?" rows={4}/><div className="chat-actions"><button onClick={() => ask()} disabled={chatting || !message.trim()}>{chatting ? 'Analyzing…' : 'Ask Agent'}</button><button onClick={() => ask(true)} disabled={chatting || !message.trim()}>Create Approval Plan</button></div>{answer && <div className="agent-answer"><strong>Agent</strong><p>{answer}</p></div>}</div></article>
      <article className="panel"><PanelHead title="Business brief" sub="Prioritized live signals"/><p className="brief-summary">{brief?.summary || (loading ? 'Analyzing current workspace…' : 'No summary available.')}</p>{brief?.approval_required_for_writes && <div className="safety-note">✓ Marketplace writes remain approval-gated. The agent does not execute unapproved actions.</div>}</article>
    </div>
    <article className="panel"><PanelHead title="Priority recommendations" sub="Explainable actions from current business data"/>{recommendations.length ? <div className="rows">{recommendations.map((item, index) => <div key={`${item.type}-${index}`}><b>{item.title}</b><strong>{item.priority} · {Math.round(item.confidence * 100)}%</strong><em>{item.reason}</em></div>)}</div> : <div className="empty"><strong>No priority recommendations</strong><small>There is no current live data requiring agent attention.</small></div>}</article>
    <div className="screen-shortcuts"><button onClick={load}>↻ Refresh analysis</button><button onClick={() => { setMessage('What needs attention today?'); }}>Ask what needs attention →</button></div>
  </section>;
}

function PanelHead({ title, sub }: { title: string; sub: string }) { return <div className="panelhead"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
