import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'seller-hub-ai-agent-conversation-v5';
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, ...init });

type ChatMessage = { role: 'user' | 'agent'; text: string; createdAt: string };
type ConversationItem = { role: 'user' | 'assistant'; content: string };
type Props = { onClose: () => void };
type Analytics = {
  kpis?: { revenue?: number; net_profit?: number; orders?: number; units?: number; returns?: number; inventory_units?: number; margin_percent?: number };
  marketplaces?: Array<{ marketplace: string; revenue: number; net_profit: number; orders: number; units: number }>;
  products?: Array<{ sku: string; title: string; revenue: number; units: number }>;
  forecasts?: { inventory_days?: number | null; daily_unit_velocity?: number; next_7_day_revenue?: number };
  insights?: Array<{ type: string; severity: string; message: string }>;
};

const money = (value = 0) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;
const number = (value = 0) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

function Metric({ label, value, detail, tone = '' }: { label: string; value: string; detail?: string; tone?: string }) {
  return <div className={`seller-metric ${tone}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

export default function AISellerAgentWorkspace({ onClose }: Props) {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [chatting, setChatting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(true);
  const [insightsOpen, setInsightsOpen] = React.useState(true);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (Array.isArray(saved)) setMessages(saved.slice(-60)); } catch { /* ignore malformed history */ }
    let cancelled = false;
    setAnalyticsLoading(true);
    api('/analytics/advanced').then(async r => r.ok ? r.json() : null).then(data => { if (!cancelled && data) setAnalytics(data); }).catch(() => { /* enhancement-only */ }).finally(() => { if (!cancelled) setAnalyticsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60))); endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, chatting]);

  async function ask(prefilled?: string) {
    const text = (prefilled ?? message).trim();
    if (!text || chatting) return;
    const priorConversation: ConversationItem[] = messages.slice(-12).map(item => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.text }));
    setMessages(prev => [...prev, { role: 'user', text, createdAt: new Date().toISOString() }]); setMessage(''); setChatting(true); setError('');
    try {
      const r = await api('/personal/ai/seller-agent/chat', { method: 'POST', body: JSON.stringify({ message: text, create_plan: false, conversation: priorConversation }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.detail || `AI Agent API returned ${r.status}`);
      setMessages(prev => [...prev, { role: 'agent', text: data.answer || 'No answer returned.', createdAt: new Date().toISOString() }]);
    } catch (err) { setError(err instanceof Error ? err.message : 'AI request failed'); setMessages(prev => prev.slice(0, -1)); } finally { setChatting(false); }
  }

  function clearChat() { setMessages([]); localStorage.removeItem(STORAGE_KEY); }
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }

  const k = analytics?.kpis || {};
  const topProducts = (analytics?.products || []).slice(0, 6);
  const marketData = analytics?.marketplaces || [];
  const insights = analytics?.insights || [];
  const inventoryDays = analytics?.forecasts?.inventory_days;

  return <div className="ai-chat-overlay" role="dialog" aria-modal="true" aria-label="AI Seller Agent">
    <section className="ai-chat-window seller-os-window">
      <header className="ai-chat-header seller-os-header">
        <div className="ai-chat-avatar">✦</div>
        <div className="ai-chat-title"><strong>AI Seller Agent</strong><span><b className="live-dot">●</b> Seller OS · Online</span></div>
        <div className="seller-os-header-status"><span>LIVE INTELLIGENCE</span>{analyticsLoading ? 'Syncing…' : 'Synced'}</div>
        <div className="ai-chat-header-actions"><button aria-label="Toggle insights" title="Toggle insights" onClick={() => setInsightsOpen(v => !v)}>{insightsOpen ? '⌃' : '⌄'}</button><button aria-label="Clear chat" title="Clear chat" onClick={clearChat}>⌫</button><button aria-label="Close AI chat" title="Close" onClick={onClose}>×</button></div>
      </header>

      {insightsOpen && <section className="seller-command-strip">
        <div className="seller-command-head"><div><span className="eyebrow">SELLER COMMAND CENTER</span><h2>Business pulse</h2></div><button onClick={() => ask('Give me a complete health report of my Seller Hub and tell me what needs attention today.')}>✦ Ask AI</button></div>
        <div className="seller-metrics">
          <Metric label="Revenue" value={analyticsLoading ? '—' : money(k.revenue)} detail={k.margin_percent !== undefined ? `${k.margin_percent}% margin` : undefined} />
          <Metric label="Net profit" value={analyticsLoading ? '—' : money(k.net_profit)} tone="profit" />
          <Metric label="Orders" value={analyticsLoading ? '—' : number(k.orders)} detail={k.units !== undefined ? `${number(k.units)} units` : undefined} />
          <Metric label="Inventory" value={analyticsLoading ? '—' : number(k.inventory_units)} detail={inventoryDays != null ? `${inventoryDays} days cover` : undefined} tone={inventoryDays != null && inventoryDays < 7 ? 'danger' : ''} />
        </div>
        {(marketData.length > 0 || topProducts.length > 0) && <div className="seller-visual-grid">
          {marketData.length > 0 && <div className="seller-chart-card"><div className="seller-chart-title"><div><b>Marketplace performance</b><span>Revenue by channel</span></div><button onClick={() => ask('Compare my marketplace performance and explain the biggest difference.')}>Explain</button></div><div className="seller-chart"><ResponsiveContainer width="100%" height={180}><BarChart data={marketData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="marketplace" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} /><Tooltip formatter={(v) => money(Number(v))} /><Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>}
          {topProducts.length > 0 && <div className="seller-chart-card"><div className="seller-chart-title"><div><b>Top products</b><span>Revenue leaders</span></div><button onClick={() => ask('Analyze my top products and tell me which ones deserve attention.')}>Analyze</button></div><div className="seller-chart"><ResponsiveContainer width="100%" height={180}><LineChart data={topProducts} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="sku" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} /><Tooltip formatter={(v) => money(Number(v))} /><Line type="monotone" dataKey="revenue" name="Revenue" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div></div>}
        </div>}
        {insights.length > 0 && <div className="seller-insight-row">{insights.slice(0, 3).map((item, i) => <button key={`${item.type}-${i}`} className={`seller-insight ${item.severity}`} onClick={() => ask(`Explain this seller insight and tell me the best next action: ${item.message}`)}><span>{item.severity === 'critical' || item.severity === 'high' ? '!' : '✦'}</span><div><b>{item.severity === 'critical' ? 'Attention needed' : 'AI insight'}</b><small>{item.message}</small></div><strong>›</strong></button>)}</div>}
      </section>}

      <div className="ai-chat-body seller-chat-body" aria-live="polite">
        {!messages.length && <div className="ai-chat-welcome seller-welcome"><div className="welcome-orbit"><div className="welcome-icon">✦</div></div><span className="eyebrow">PERSONAL SELLER COPILOT</span><h2>What should we work on?</h2><p>Ask naturally about sales, orders, inventory, listings, pricing, advertising or business performance. I’ll use your Seller Hub context to help.</p><div className="ai-chat-suggestions"><button onClick={() => ask('Aaj mere business mein kya attention chahiye?')}>⚡ Aaj kya attention chahiye?</button><button onClick={() => ask('Mera inventory health batao')}>📦 Inventory health</button><button onClick={() => ask('Mere profitable products kaun se hain?')}>💰 Profitable products</button><button onClick={() => ask('Meri sales performance analyze karo')}>📈 Sales analysis</button></div></div>}
        {messages.map((item, i) => <div className={`wa-message-row ${item.role}`} key={`${item.createdAt}-${i}`}><div className="wa-bubble"><p>{item.text}</p><time>{new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</time></div></div>)}
        {chatting && <div className="wa-message-row agent"><div className="wa-bubble typing"><i></i><i></i><i></i><span>AI is thinking</span></div></div>}
        <div ref={endRef} />
      </div>
      {error && <div className="ai-chat-error">{error}</div>}
      <footer className="ai-chat-composer seller-composer"><button className="composer-icon" aria-label="Emoji">☺</button><textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask your Seller Agent…" rows={1} disabled={chatting} /><button className="send-button" aria-label="Send" onClick={() => ask()} disabled={chatting || !message.trim()}>➤</button></footer>
      <div className="ai-chat-footer-note">AI Seller Agent · Live insights are based on available Seller Hub data · Marketplace actions always require your approval</div>
    </section>
  </div>;
}
