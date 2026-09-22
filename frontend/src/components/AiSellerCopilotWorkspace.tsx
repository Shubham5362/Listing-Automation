import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Edit3,
  FileText,
  Eye,
  Send,
  Paperclip,
  Mic,
  Plus,
  X,
  ChevronRight,
  Upload,
  ShoppingBag,
  Flame,
  DollarSign,
  PartyPopper,
  AlertTriangle,
  RefreshCw,
  Search,
  Package,
  Check,
  CheckSquare,
  Filter,
  Lightbulb,
  ExternalLink,
  Sliders,
  Play
} from 'lucide-react';
import { AmazonBadgeIcon, FlipkartBadgeIcon } from './AutomationsWorkspace';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  plan?: PlanData;
}

interface PlanData {
  id: string;
  title: string;
  status: 'Ready for Approval' | 'Approved' | 'In Progress' | 'Completed';
  totalProducts: number;
  marketplaces: string[];
  dailyLimit: string;
  estimatedDuration: string;
  productSelection: string;
  keywordStrategy: string;
  content: string;
  images: string;
  schedule: string;
  automation: string;
  nextStep: string;
}

interface AffectedProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  marketplaces: string[];
  selected: boolean;
}

interface AiSellerCopilotWorkspaceProps {
  onNavigateTab?: (tab: string) => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

export default function AiSellerCopilotWorkspace({
  onNavigateTab,
  selectedMarketplaceFilter,
  onSelectMarketplaceFilter,
}: AiSellerCopilotWorkspaceProps) {
  // Input state
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat message thread
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: 'Just now',
      text: 'AI Seller Copilot is ready. Ask me to analyze your Seller Hub, plan an operation, or prepare an approved action.'
    }
  ]);

  // Modals & Panels
  const [isAffectedProductsOpen, setIsAffectedProductsOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAskChangesOpen, setIsAskChangesOpen] = useState(false);
  const [askChangesText, setAskChangesText] = useState('');
  const [isListeningMic, setIsListeningMic] = useState(false);

  // Current active plan state
  const [activePlan, setActivePlan] = useState<PlanData>({
    id: '',
    title: 'Plan: Catalog Marketplace Sync & Optimization',
    status: 'Ready for Approval',
    totalProducts: 0,
    marketplaces: ['Amazon', 'Flipkart'],
    dailyLimit: 'Not configured',
    estimatedDuration: 'Not available',
    productSelection: 'Active catalog products',
    keywordStrategy: 'Niche-based variation (AI keyword optimization)',
    content: 'AI optimized titles, bullets, description, attributes',
    images: 'Use existing product images (auto-enhance if needed)',
    schedule: 'Not configured',
    automation: 'Will create and activate automation after your approval',
    nextStep:
      'Please review the plan and confirm to proceed.'
  });

  // Affected Products loaded dynamically from live catalog
  const [affectedProducts, setAffectedProducts] = useState<AffectedProduct[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/personal/products`, { headers: { Accept: 'application/json' } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.products) {
          const items: AffectedProduct[] = data.products.map((p: any) => ({
            id: p.id,
            sku: p.sku || `SKU-${p.id}`,
            name: p.title || p.name || 'Catalog Item',
            category: p.category || 'General',
            price: p.price || 0,
            stock: p.stock ?? p.quantity ?? 0,
            marketplaces: ['Amazon', 'Flipkart'],
            selected: true,
          }));
          setAffectedProducts(items);
          setActivePlan(prev => ({
            ...prev,
            totalProducts: items.length,
            productSelection: `All ${items.length} products from your catalog`
          }));
        }
      })
      .catch(err => console.error('Failed to load products for copilot:', err));
  }, []);

  const [affectedSearch, setAffectedSearch] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Natural Language Chat Submission
  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputText;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/personal/ai/seller-agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversation: messages.slice(-5).map(message => ({
            role: message.sender === 'assistant' ? 'assistant' : 'user',
            content: message.text
          }))
        })
      });
      const raw = await response.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`AI endpoint returned a non-JSON response (HTTP ${response.status}). Check VITE_API_BASE_URL.`);
      }
      if (!response.ok) {
        throw new Error(data.detail || data.message || `AI request failed (HTTP ${response.status})`);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.answer || data.reply || 'No response was returned by the Seller Hub agent.'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const fallbackMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: error instanceof Error
          ? `Seller Hub agent unavailable: ${error.message}. No action was executed.`
          : 'Seller Hub agent is temporarily unavailable. No action was executed.'
      };
      setMessages(prev => [...prev, fallbackMessage]);
      console.error('Seller agent request failed:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // Quick Action / Suggested Prompt click
  const handleQuickPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Approve & Create Automation
  const handleApprovePlan = async () => {
    setActivePlan(prev => ({
      ...prev,
      status: 'Approved'
    }));

    showToast('Plan approved! Creating listing automation in SellerHub...');

    try {
      const response = await fetch(`${API_BASE}/api/v1/personal/listing-automation/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'ai-copilot-bulk-listing',
          marketplaces: activePlan.marketplaces,
          totalProducts: activePlan.totalProducts,
          dailyLimit: Number.parseInt(activePlan.dailyLimit, 10) || 0
        })
      });
      if (!response.ok) throw new Error('Automation request failed');
      const result = await response.json();
      setMessages(prev => [...prev, {
        id: `msg-approved-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Automation request accepted by Seller Hub (job #${result.id}). The worker will report the actual execution status.`
      }]);
      showToast('Automation request queued.');
    } catch (error) {
      setActivePlan(prev => ({ ...prev, status: 'Ready for Approval' }));
      setMessages(prev => [...prev, {
        id: `msg-approval-error-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Automation was not activated. No execution was claimed.'
      }]);
      console.error('Automation approval failed:', error);
    }
  };

  // Submit modification
  const handleApplyPlanEdit = () => {
    setIsEditPlanModalOpen(false);
    showToast('Plan parameters updated successfully!');
    const updateNote: ChatMessage = {
      id: `msg-edit-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Updated parameters for **${activePlan.title}**:\n- Daily limit: ${activePlan.dailyLimit}\n- Schedule: ${activePlan.schedule}\n- Marketplaces: ${activePlan.marketplaces.join(', ')}`
    };
    setMessages(prev => [...prev, updateNote]);
  };

  // Submit ask changes from chat
  const handleAskChangesSubmit = () => {
    if (!askChangesText.trim()) return;
    setIsAskChangesOpen(false);
    handleSendMessage(`Plan change request: ${askChangesText}`);
    setAskChangesText('');
  };

  // Filter affected products
  const filteredAffectedProducts = affectedProducts.filter(
    p =>
      p.name.toLowerCase().includes(affectedSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(affectedSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(affectedSearch.toLowerCase())
  );

  const selectedAffectedCount = affectedProducts.filter(p => p.selected).length;

  return (
    <div className="flex-1 min-h-screen bg-slate-50/60 flex flex-col">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[70] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex-1 min-h-0 max-w-[1500px] w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div className="h-[calc(100vh-110px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* SellerHub-branded WhatsApp-style header */}
          <header className="h-16 shrink-0 px-4 sm:px-5 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">AI Seller Copilot</h1>
                <p className="text-[11px] text-emerald-600 font-medium">Online • SellerHub AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" title="Search chat" className="p-2 rounded-full text-slate-500 hover:bg-slate-100"><Search className="w-4 h-4" /></button>
              <button type="button" title="Chat options" className="p-2 rounded-full text-slate-500 hover:bg-slate-100"><Sliders className="w-4 h-4" /></button>
            </div>
          </header>

          {/* Chat body */}
          <div className="flex-1 min-h-0 relative bg-slate-50/60 overflow-y-auto">
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.07),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(15,23,42,0.035),transparent_30%)]" />
            <div className="relative max-w-4xl mx-auto px-3 sm:px-6 py-5">
              <div className="flex justify-center mb-5">
                <span className="px-3 py-1 rounded-lg bg-white/90 border border-slate-200 text-[10px] font-semibold text-slate-500 shadow-sm">Today</span>
              </div>

              {messages.map(msg => (
                <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm border ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white border-indigo-600 rounded-2xl rounded-br-md'
                        : 'bg-white text-slate-800 border-slate-200 rounded-2xl rounded-bl-md'}`}>
                        <div className="whitespace-pre-line">{msg.text}</div>
                      </div>
                      <div className={`mt-1 text-[9px] text-slate-400 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}{msg.sender === 'user' ? '  ✓✓' : ''}
                      </div>
                      {msg.plan && (
                        <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-sm p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">{activePlan.title}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                            <span>Products: <b>{activePlan.totalProducts}</b></span>
                            <span>Status: <b>{activePlan.status}</b></span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button type="button" onClick={handleApprovePlan} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold">Approve</button>
                            <button type="button" onClick={() => setIsAskChangesOpen(true)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold">Ask changes</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-end gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-indigo-600" /></div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" /><span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" /></div>
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>
          </div>

          {/* WhatsApp-style Add section + composer */}
          <div className="shrink-0 border-t border-slate-200 bg-white">
            <div className="max-w-4xl mx-auto px-3 sm:px-5 pt-2.5">
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
                <button type="button" onClick={() => setIsAffectedProductsOpen(true)} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"><Plus className="w-3 h-3" /> Add Product</button>
                <button type="button" onClick={() => handleSendMessage('Use my current listing context and help me with this listing.')} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"><Layers className="w-3 h-3" /> Listing</button>
                <button type="button" onClick={() => setIsUploadModalOpen(true)} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"><Paperclip className="w-3 h-3" /> File</button>
                <button type="button" onClick={() => setIsUploadModalOpen(true)} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"><Upload className="w-3 h-3" /> Image / CSV</button>
                <button type="button" onClick={() => handleSendMessage('Give me the latest SellerHub business report and key issues.')} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"><FileText className="w-3 h-3" /> Report</button>
              </div>

              <div className="flex items-end gap-2 pb-3">
                <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 flex items-end gap-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    rows={1}
                    placeholder="Type a message"
                    className="flex-1 bg-transparent resize-none outline-none text-[13px] text-slate-800 placeholder:text-slate-400 max-h-28"
                  />
                  <button type="button" onClick={() => setIsListeningMic(v => !v)} title="Voice input" className={`w-8 h-8 rounded-full flex items-center justify-center ${isListeningMic ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-200'}`}><Mic className="w-4 h-4" /></button>
                </div>
                <button type="button" disabled={!inputText.trim() || isTyping} onClick={() => handleSendMessage()} className="w-10 h-10 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: View Affected Products (100)
      ======================================================== */}
      {isAffectedProductsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Affected Catalog Products ({selectedAffectedCount}/{affectedProducts.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These 100 products will be staged and listed at 20 products/day per marketplace.
                </p>
              </div>
              <button
                onClick={() => setIsAffectedProductsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search SKU, product title, category..."
                  value={affectedSearch}
                  onChange={e => setAffectedSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAffectedProducts(affectedProducts.map(p => ({ ...p, selected: true })))
                  }
                  className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded-md font-semibold"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAffectedProducts(affectedProducts.map(p => ({ ...p, selected: false })))
                  }
                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-md font-semibold"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Products List Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold">
                    <th className="pb-2 pl-2 w-8">#</th>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Stock</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2 pr-2">Target Channels</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAffectedProducts.map((prod, idx) => (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pl-2">
                        <input
                          type="checkbox"
                          checked={prod.selected}
                          onChange={() => {
                            setAffectedProducts(
                              affectedProducts.map(p =>
                                p.id === prod.id ? { ...p, selected: !p.selected } : p
                              )
                            );
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-2.5 font-mono font-semibold text-slate-700">{prod.sku}</td>
                      <td className="py-2.5 font-medium text-slate-900 max-w-xs truncate">{prod.name}</td>
                      <td className="py-2.5 text-slate-500">{prod.category}</td>
                      <td className="py-2.5 font-bold text-slate-700">{prod.stock}</td>
                      <td className="py-2.5 font-bold text-slate-900">₹{prod.price}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1">
                          <AmazonBadgeIcon />
                          <FlipkartBadgeIcon />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="text-xs text-slate-600 font-medium">
                Selected: <span className="font-bold text-indigo-600">{selectedAffectedCount}</span> items
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAffectedProductsOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAffectedProductsOpen(false);
                    showToast(`Updated target list to ${selectedAffectedCount} products.`);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Confirm Selected ({selectedAffectedCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: Modify / Edit Plan
      ======================================================== */}
      {isEditPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Edit Plan Parameters</h3>
              </div>
              <button
                onClick={() => setIsEditPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Plan Title</label>
                <input
                  type="text"
                  value={activePlan.title}
                  onChange={e => setActivePlan({ ...activePlan, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Daily Listing Limit</label>
                  <input
                    type="text"
                    value={activePlan.dailyLimit}
                    onChange={e => setActivePlan({ ...activePlan, dailyLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Schedule Time</label>
                  <input
                    type="text"
                    value={activePlan.schedule}
                    onChange={e => setActivePlan({ ...activePlan, schedule: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Keyword Strategy</label>
                <textarea
                  rows={2}
                  value={activePlan.keywordStrategy}
                  onChange={e => setActivePlan({ ...activePlan, keywordStrategy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditPlanModalOpen(false)}
                className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPlanEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: Ask Changes
      ======================================================== */}
      {isAskChangesOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Request Plan Changes</h3>
              </div>
              <button onClick={() => setIsAskChangesOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-slate-600">
                Describe the changes you want Copilot to apply to this plan:
              </p>
              <textarea
                rows={3}
                value={askChangesText}
                onChange={e => setAskChangesText(e.target.value)}
                placeholder="e.g. Schedule it for 2:00 PM instead, limit to 10 products per day, and include Meesho too."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAskChangesOpen(false)}
                className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAskChangesSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: Upload File (Excel / CSV)
      ======================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Upload Catalog or Batch File</h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="border-2 border-dashed border-indigo-200/90 rounded-xl p-6 bg-indigo-50/20 text-center flex flex-col items-center justify-center hover:bg-indigo-50/40 cursor-pointer transition-colors group">
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsUploadModalOpen(false);
                    handleSendMessage(`Uploaded catalog file "${file.name}". Please analyze the SKUs and create a listing plan.`);
                    showToast(`File ${file.name} uploaded successfully.`);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform mb-2">
                <Upload className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-xs font-semibold text-slate-700">Click to upload or drag & drop</div>
              <div className="text-[11px] text-slate-400 mt-1">Supports Excel (.xlsx, .xls) and CSV files</div>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
