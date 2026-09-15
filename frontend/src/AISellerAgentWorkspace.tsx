import React from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'seller-hub-ai-agent-conversation-v3';
const api = (path: string, init?: RequestInit) => fetch(`${API_BASE}/api/v1${path}`, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, ...init });

const FRIENDLY_SCOPE_MESSAGE = '😊 Main aapke Seller Hub ka AI Seller Agent hoon, isliye mera focus aapke business aur selling operations ko manage karne mein help karna hai. Is wajah se main general entertainment ya unrelated kaam mein help nahi kar paunga. ❤️\n\nLekin main products, listings, pricing, orders, inventory, sales, advertising, returns, finance ya Amazon/Flipkart se related kaam mein turant help kar sakta hoon.';
const SELLER_TERMS = [
  'seller', 'selling', 'amazon', 'flipkart', 'marketplace', 'product', 'products', 'listing', 'listings', 'title', 'bullet',
  'description', 'sku', 'asin', 'inventory', 'stock', 'reorder', 'order', 'orders', 'return', 'returns', 'refund', 'customer',
  'sales', 'sale', 'revenue', 'profit', 'margin', 'pricing', 'price', 'reprice', 'buy box', 'buybox', 'advertising', 'ads',
  'campaign', 'acos', 'roas', 'settlement', 'fee', 'fees', 'expense', 'gst', 'catalog', 'catalogue', 'business', 'dashboard',
  'analytics', 'report', 'reports', 'performance', 'supplier', 'shipping', 'fulfilment', 'fulfillment', 'dispatch', 'cancel',
  'cancellation', 'customer support', 'compliance', 'लिस्टिंग', 'प्रोडक्ट', 'उत्पाद', 'स्टॉक', 'इन्वेंटरी', 'ऑर्डर', 'रिटर्न',
  'रिफंड', 'बिक्री', 'सेल्स', 'कमाई', 'राजस्व', 'मुनाफा', 'कीमत', 'प्राइस', 'विज्ञापन', 'कैंपेन', 'ग्राहक', 'कस्टमर',
  'बिजनेस', 'व्यापार', 'अमेज़न', 'फ्लिपकार्ट'
];
const SELLER_ACTION_TERMS = [
  'optimize', 'optimise', 'analyze', 'analyse', 'improve', 'create listing', 'write title', 'write description',
  'rewrite listing', 'generate listing', 'reprice', 'forecast sales', 'find low stock', 'check orders', 'check inventory',
  'check sales', 'check returns', 'listing optimize', 'listing optimisation', 'लिस्टिंग बनाओ', 'टाइटल बनाओ', 'डिस्क्रिप्शन बनाओ',
  'प्रोडक्ट का', 'उत्पाद का', 'स्टॉक बताओ', 'ऑर्डर बताओ', 'बिक्री बताओ'
];
const OUT_OF_SCOPE_TERMS = [
  'love story', 'romantic story', 'poem', 'poetry', 'shayari', 'joke', 'movie', 'song lyrics', 'gaming', 'game cheat',
  'homework', 'exam', 'essay', 'relationship advice', 'dating advice', 'travel itinerary', 'recipe', 'cook', 'weather',
  'politics', 'news', 'general knowledge', 'kahani', 'कहानी', 'कविता', 'शायरी', 'चुटकुला', 'फिल्म', 'गाना', 'मौसम', 'राजनीति'
];
const CASUAL_MESSAGES: Record<string, string> = {
  hi: 'Namaste 😊 Main yahin hoon. Seller Hub mein kis kaam mein help chahiye?',
  hii: 'Hii 😊 Main yahin hoon. Seller Hub mein kis kaam mein help chahiye?',
  hello: 'Hello 😊 Batao, Seller Hub mein kya karna hai?',
  hey: 'Hey 😊 Batao, Seller Hub mein kis kaam mein help chahiye?',
  namaste: 'Namaste 😊 Batao, Seller Hub mein kya karna hai?',
  namaskar: 'Namaskar 😊 Batao, Seller Hub mein kya karna hai?',
  'kaise ho': 'Main badhiya hoon 😊 Aap batao, Seller Hub mein kis kaam mein help chahiye?',
  'kese ho': 'Main badhiya hoon 😊 Aap batao, Seller Hub mein kis kaam mein help chahiye?',
  'how are you': 'I am doing great 😊 Batao, Seller Hub mein kya help chahiye?',
  'good morning': 'Good morning 😊 Seller Hub ke kaam ke liye ready hoon. Batao kya karna hai?',
  'good afternoon': 'Good afternoon 😊 Batao, Seller Hub mein kis kaam mein help chahiye?',
  'good evening': 'Good evening 😊 Batao, Seller Hub mein kis kaam mein help chahiye?',
  help: 'Bilkul 😊 Main aapke Seller Hub mein products, listings, inventory, orders, pricing, sales aur advertising ke kaam mein help kar sakta hoon. Batao kya karna hai?',
  'help me': 'Bilkul 😊 Batao Seller Hub mein kya problem ya kaam hai, main help karta hoon.'
};
const CASUAL_PATTERNS = [
  /^(hi+|hello+|hey+|namaste|namaskar)[!. ]*(bhai|bro|dost)?[!. ]*$/i,
  /^(kaise|kese|kaisa|kesi) ho( bhai| bro| yaar| ji)?[!?., ]*$/i,
  /^how are you( bhai| bro)?[!?., ]*$/i,
  /^(good morning|good afternoon|good evening)( bhai| bro)?[!. ]*$/i,
  /^(bhai|bro|dost|yaar)[!. ]*$/i,
  /^(ok|okay|acha|achha|theek hai|thik hai|haan|han|yes|ji|hmm|hmmm|nice|great)[!. ]*$/i,
  /^(thanks|thank you|shukriya|dhanyavaad)( bhai| bro)?[!. ]*$/i,
  /^(bye|goodbye|see you|milte hain)( bhai| bro)?[!. ]*$/i,
  /^(help|help me|madad|madad karo)[!. ]*$/i,
];
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
const casualReply = (value: string) => {
  const text = normalize(value);
  if (CASUAL_MESSAGES[text]) return CASUAL_MESSAGES[text];
  if (CASUAL_PATTERNS.some(pattern => pattern.test(text))) {
    const replies = [
      'Haan bhai 😊 Main yahin hoon. Seller Hub mein kya karna hai?',
      'Bilkul bhai 😊 Batao, Seller Hub ka kaunsa kaam dekhna hai?',
      'Haan, bolo 😊 Products, listings, inventory ya orders—kis par kaam karein?',
      'Main ready hoon bhai 😊 Jo Seller Hub ka kaam hai, batao.'
    ];
    return replies[Array.from(text).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % replies.length];
  }
  return null;
};
const isSellerScoped = (value: string) => {
  const text = normalize(value);
  return SELLER_TERMS.some(term => text.includes(normalize(term))) || SELLER_ACTION_TERMS.some(term => text.includes(normalize(term)));
};
const shouldBlockLocally = (value: string) => {
  const text = normalize(value);
  if (!text || text.length > 4000) return true;
  if (casualReply(text)) return false;
  return (!isSellerScoped(text) && OUT_OF_SCOPE_TERMS.some(term => text.includes(normalize(term)))) || !isSellerScoped(text);
};

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

    const localCasual = casualReply(text);
    if (localCasual) {
      setMessages(prev => [...prev, { role: 'agent', text: localCasual, createdAt: new Date().toISOString() }]);
      setChatting(false);
      return;
    }

    if (shouldBlockLocally(text)) {
      setMessages(prev => [...prev, { role: 'agent', text: FRIENDLY_SCOPE_MESSAGE, createdAt: new Date().toISOString() }]);
      setChatting(false);
      return;
    }

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
