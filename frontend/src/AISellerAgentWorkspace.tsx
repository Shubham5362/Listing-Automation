import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'seller-hub-ai-agent-conversation-v5';
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, ...init });

type ChatMessage = { role: 'user' | 'agent'; text: string; createdAt: string };
type ConversationItem = { role: 'user' | 'assistant'; content: string };
type Props = { onClose: () => void };

const quickPrompts = [
  { label: 'Business overview', text: 'Aaj mere business mein kya attention chahiye?' },
  { label: 'Inventory health', text: 'Mera inventory health batao' },
  { label: 'Sales insights', text: 'Meri sales mein kya important trend hai?' },
  { label: 'Listing help', text: 'Meri listing improve karne mein help karo' },
];

export default function AISellerAgentWorkspace({ onClose }: Props) {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [chatting, setChatting] = React.useState(false);
  const [error, setError] = React.useState('');
  const endRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setMessages(saved.slice(-60));
    } catch { /* ignore malformed history */ }
    window.setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, chatting]);

  async function ask(textOverride?: string) {
    const text = (textOverride ?? message).trim();
    if (!text || chatting) return;
    const priorConversation: ConversationItem[] = messages.slice(-12).map(item => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.text }));
    setMessages(prev => [...prev, { role: 'user', text, createdAt: new Date().toISOString() }]);
    setMessage('');
    setChatting(true);
    setError('');

    try {
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
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function clearChat() {
    setMessages([]);
    setError('');
    localStorage.removeItem(STORAGE_KEY);
    window.setTimeout(() => inputRef.current?.focus(), 50);
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
        <div className="ai-chat-brand">
          <div className="ai-chat-avatar" aria-hidden="true"><span>✦</span></div>
          <div className="ai-chat-title">
            <strong>AI Seller Agent</strong>
            <span><i /> Personal Seller Hub assistant</span>
          </div>
        </div>
        <div className="ai-chat-header-actions">
          <button className="chat-clear" aria-label="Clear conversation" title="Clear conversation" onClick={clearChat}><span aria-hidden="true">↺</span><em>Clear</em></button>
          <button className="chat-close" aria-label="Close AI chat" title="Close" onClick={onClose}><span aria-hidden="true">×</span></button>
        </div>
      </header>

      <div className="ai-chat-body" aria-live="polite">
        {!messages.length && <div className="ai-chat-welcome">
          <div className="welcome-icon" aria-hidden="true">✦</div>
          <p className="welcome-kicker">YOUR PERSONAL SELLER COPILOT</p>
          <h2>What can I help you with?</h2>
          <p className="welcome-copy">Ask about your products, listings, inventory, orders, pricing, sales or marketplace operations. I’ll use the Seller Hub context to help you take the next step.</p>
          <div className="ai-chat-suggestions">
            {quickPrompts.map(prompt => <button key={prompt.label} onClick={() => ask(prompt.text)}><span>{prompt.label}</span><b>›</b></button>)}
          </div>
        </div>}

        {messages.length > 0 && <div className="chat-day-label"><span>Conversation</span></div>}
        {messages.map((item, i) => <div className={`wa-message-row ${item.role}`} key={`${item.createdAt}-${i}`}>
          {item.role === 'agent' && <div className="message-agent-mark" aria-hidden="true">✦</div>}
          <div className="wa-bubble">
            <p>{item.text}</p>
            <time>{new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</time>
          </div>
        </div>)}
        {chatting && <div className="wa-message-row agent"><div className="message-agent-mark" aria-hidden="true">✦</div><div className="wa-bubble typing" aria-label="AI is typing"><i /><i /><i /></div></div>}
        <div ref={endRef} />
      </div>

      {error && <div className="ai-chat-error"><span>!</span>{error}</div>}
      <footer className="ai-chat-composer">
        <div className="composer-box">
          <textarea ref={inputRef} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your Seller Hub…" rows={1} disabled={chatting} aria-label="Message AI Seller Agent" />
          <div className="composer-meta"><span>Enter to send · Shift + Enter for new line</span><span>{message.length > 0 ? `${message.length}` : ''}</span></div>
        </div>
        <button className="send-button" aria-label="Send message" onClick={() => ask()} disabled={chatting || !message.trim()}><span aria-hidden="true">↑</span></button>
      </footer>
      <div className="ai-chat-footer-note"><span>●</span> Marketplace changes always require your approval</div>
    </section>
  </div>;
}
