import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'seller-hub-ai-agent-conversation-v4';
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, ...init });

type ChatMessage = { role: 'user' | 'agent'; text: string; createdAt: string };
type ConversationItem = { role: 'user' | 'assistant'; content: string };
type Props = { onClose: () => void };

export default function AISellerAgentWorkspace({ onClose }: Props) {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [chatting, setChatting] = React.useState(false);
  const [error, setError] = React.useState('');
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setMessages(saved.slice(-60));
    } catch { /* ignore malformed history */ }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatting]);

  async function ask() {
    const text = message.trim();
    if (!text || chatting) return;
    const priorConversation: ConversationItem[] = messages.slice(-12).map(item => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.text }));
    setMessages(prev => [...prev, { role: 'user', text, createdAt: new Date().toISOString() }]);
    setMessage('');
    setChatting(true);
    setError('');

    try {
      // Semantic scope is intentionally not decided in the browser. The conversational
      // agent receives the message and uses its model/context to decide how to respond.
      const r = await api('/personal/ai/seller-agent/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, create_plan: false, conversation: priorConversation })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || `AI Agent API returned ${r.status}`);
      setMessages(prev => [...prev, { role: 'agent', text: data.answer || 'No answer returned.', createdAt: new Date().toISOString() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setChatting(false);
    }
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }

  return <div className="ai-chat-overlay" role="dialog" aria-modal="true" aria-label="AI Seller Agent">
    <section className="ai-chat-window">
      <header className="ai-chat-header">
        <div className="ai-chat-avatar">✦</div>
        <div className="ai-chat-title"><strong>AI Seller Agent</strong><span>● Online</span></div>
        <div className="ai-chat-header-actions">
          <button aria-label="Clear chat" title="Clear chat" onClick={clearChat}>⌫</button>
          <button aria-label="Close AI chat" title="Close" onClick={onClose}>×</button>
        </div>
      </header>

      <div className="ai-chat-body" aria-live="polite">
        {!messages.length && <div className="ai-chat-welcome"><div className="welcome-icon">✦</div><h2>AI Seller Agent</h2><p>Namaste 👋 Main aapke Seller Hub ka personal AI assistant hoon. Inventory, orders, pricing, advertising, listings aur business operations ke baare mein poochhiye.</p><div className="ai-chat-suggestions"><button onClick={() => setMessage('Aaj mere business mein kya attention chahiye?')}>Aaj kya attention chahiye?</button><button onClick={() => setMessage('Mera inventory health batao')}>Inventory health</button><button onClick={() => setMessage('Mere profitable products kaun se hain?')}>Profitable products</button></div></div>}
        {messages.map((item, i) => <div className={`wa-message-row ${item.role}`} key={`${item.createdAt}-${i}`}><div className="wa-bubble"><p>{item.text}</p><time>{new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</time></div></div>)}
        {chatting && <div className="wa-message-row agent"><div className="wa-bubble typing"><i></i><i></i><i></i></div></div>}
        <div ref={endRef} />
      </div>

      {error && <div className="ai-chat-error">{error}</div>}
      <footer className="ai-chat-composer">
        <button className="composer-icon" aria-label="Emoji">☺</button>
        <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message AI Seller Agent…" rows={1} disabled={chatting} />
        <button className="send-button" aria-label="Send" onClick={ask} disabled={chatting || !message.trim()}>➤</button>
      </footer>
      <div className="ai-chat-footer-note">AI Seller Agent · Marketplace actions always require your approval</div>
    </section>
  </div>;
}
