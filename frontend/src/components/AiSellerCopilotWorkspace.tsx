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
    fetch('/api/v1/personal/products')
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
      const response = await fetch('/api/v1/personal/ai/seller-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversation: messages.slice(-5)
        })
      });
      const data = await response.json();

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
        text: 'Seller Hub agent is temporarily unavailable. No action was executed.'
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
      const response = await fetch('/api/v1/personal/listing-automation/runs', {
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
    <div className="flex-1 bg-slate-50/60 min-h-screen flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-5">
        {/* Top Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              AI Seller Copilot
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Your AI partner to plan, analyze, and execute across your seller business.
            </p>
          </div>
        </div>

        {/* 4 Feature Capability Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Ask Anything */}
          <div
            onClick={() => handleQuickPrompt('How is my overall seller health and sales performance today?')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100/80 flex items-center justify-center shrink-0 text-amber-600 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4 text-amber-600 fill-amber-600/20" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                Ask Anything
              </div>
              <div className="text-[11px] text-slate-400 truncate">Get instant answers</div>
            </div>
          </div>

          {/* Card 2: Take Action */}
          <div
            onClick={() => handleQuickPrompt('Create listings, update prices, and sync catalog now')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 text-emerald-600 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                Take Action
              </div>
              <div className="text-[11px] text-slate-400 truncate">Create listings, update prices, etc.</div>
            </div>
          </div>

          {/* Card 3: Get Insights */}
          <div
            onClick={() => handleQuickPrompt('Find high ROI sales opportunities and solve low conversion items')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center shrink-0 text-purple-600 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-purple-600 fill-purple-600/20" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                Get Insights
              </div>
              <div className="text-[11px] text-slate-400 truncate">Find opportunities & solve issues</div>
            </div>
          </div>

          {/* Card 4: Automate */}
          <div
            onClick={() => handleQuickPrompt('Set up a recurring automation to optimize listing keywords daily')}
            className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                Automate
              </div>
              <div className="text-[11px] text-slate-400 truncate">Turn your ideas into automation</div>
            </div>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================
              LEFT COLUMN: Chat & Action Plan Workspace (8 cols)
          ======================================================== */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {/* Conversation Box */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs min-h-[560px] flex flex-col justify-between">
              {/* Chat Thread */}
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                {messages.map(msg => (
                  <div key={msg.id} className="space-y-2">
                    {/* Message Sender Header + Bubble */}
                    {msg.sender === 'user' ? (
                      /* USER MESSAGE: Right aligned */
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                        </div>
                        <div className="flex items-start gap-2.5 max-w-[85%]">
                          <div className="bg-indigo-50/80 border border-indigo-100/80 text-slate-800 text-xs sm:text-[13px] font-medium p-3.5 rounded-2xl rounded-tr-xs leading-relaxed shadow-2xs">
                            {msg.text}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            S
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ASSISTANT MESSAGE: Left aligned */
                      <div className="flex flex-col items-start space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                        </div>
                        <div className="flex items-start gap-2.5 w-full">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            <Bot className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="space-y-3 flex-1">
                            {/* Text part */}
                            <div className="text-xs sm:text-[13px] text-slate-800 font-normal leading-relaxed whitespace-pre-line">
                              {msg.text}
                            </div>

                            {/* Plan Card embedded in message if present */}
                            {msg.plan && (
                              <div className="border border-slate-200/90 rounded-xl bg-white shadow-2xs overflow-hidden">
                                {/* Plan Header */}
                                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/40">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                      <Zap className="w-4 h-4 fill-indigo-600/20 text-indigo-600" />
                                    </div>
                                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {activePlan.title}
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      {activePlan.status}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setIsEditPlanModalOpen(true)}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                                  >
                                    <Edit3 className="w-3 h-3 text-slate-500" />
                                    <span>Edit Plan</span>
                                  </button>
                                </div>

                                {/* Plan Key-Value Specifications */}
                                <div className="p-3.5 sm:p-4 text-xs space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Package className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Total Products</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.totalProducts} products
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Marketplaces</span>
                                    </span>
                                    <div className="sm:col-span-8 flex items-center gap-1.5 font-semibold text-slate-800">
                                      <span>{activePlan.marketplaces.join(', ')}</span>
                                      <div className="flex items-center gap-1 ml-1">
                                        <AmazonBadgeIcon />
                                        <FlipkartBadgeIcon />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Daily Limit</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.dailyLimit}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Estimated Duration</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.estimatedDuration}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Product Selection</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.productSelection}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Keyword Strategy</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.keywordStrategy}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Content</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.content}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Images</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.images}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1 border-b border-slate-100/80">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Schedule</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.schedule}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 py-1">
                                    <span className="sm:col-span-4 text-slate-500 font-medium flex items-center gap-2">
                                      <Zap className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Automation</span>
                                    </span>
                                    <span className="sm:col-span-8 font-semibold text-slate-800">
                                      {activePlan.automation}
                                    </span>
                                  </div>
                                </div>

                                {/* Next Step Notification Subcard */}
                                <div className="mx-3.5 mb-3.5 sm:mx-4 sm:mb-4 p-3 bg-indigo-50/50 border border-indigo-100/90 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
                                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="font-bold text-[11px]">i</span>
                                  </div>
                                  <div>
                                    <div className="font-bold text-indigo-900 text-xs">Next Step</div>
                                    <div className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                                      {activePlan.nextStep}
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons Bar */}
                                <div className="p-3.5 sm:p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleApprovePlan}
                                    disabled={activePlan.status === 'Approved'}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-[0.99]"
                                  >
                                    <Zap className="w-3.5 h-3.5 fill-white" />
                                    <span>
                                      {activePlan.status === 'Approved'
                                        ? 'Plan Approved & Active'
                                        : 'Approve & Create Automation'}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsEditPlanModalOpen(true)}
                                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Modify Plan</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsAffectedProductsOpen(true)}
                                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                                    <span>View Affected Products ({activePlan.totalProducts})</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsAskChangesOpen(true)}
                                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Ask Changes</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Live Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl px-4 py-2.5 text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150" />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-300" />
                      <span className="ml-1 text-[11px]">Analyzing catalog data & seller rules...</span>
                    </div>
                  </div>
                )}
                <div ref={chatScrollRef} />
              </div>

              {/* Quick Suggestion Pills matching screenshot */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Show me low stock products')}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50/60 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[11px] font-medium rounded-full shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Show me low stock products</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Find best selling products in last 30 days')}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50/60 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[11px] font-medium rounded-full shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Find best selling products in last 30 days</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Analyze my competitors')}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50/60 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[11px] font-medium rounded-full shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Analyze my competitors</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Suggest new product opportunities')}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50/60 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[11px] font-medium rounded-full shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Suggest new product opportunities</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Show me failed listings')}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50/60 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-[11px] font-medium rounded-full shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Show me failed listings</span>
                  </button>
                </div>

                {/* Natural Language Prompt Input Bar */}
                <div className="relative flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
                    title="Upload catalog or Excel sheet"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask me anything... (e.g. create listings, update prices, analyze sales, fix errors, etc.)"
                    className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:outline-hidden px-1"
                  />

                  {/* Mic action */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsListeningMic(!isListeningMic);
                      if (!isListeningMic) {
                        showToast('Voice input activated. Speak now...');
                      }
                    }}
                    className={`p-2 rounded-xl transition-colors ${
                      isListeningMic
                        ? 'bg-rose-100 text-rose-600 animate-pulse'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                    }`}
                    title="Voice search"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl transition-colors shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer Tagline */}
                <div className="text-center pt-1">
                  <span className="text-[11px] text-slate-400 inline-flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-500/20" />
                    <span>Powered by SellerHub AI</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: Sidebar Action Hub Widgets (4 cols)
          ======================================================== */}
          <div className="lg:col-span-4 space-y-4">
            {/* Widget 1: Suggested for You */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Suggested for You</h3>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt('Show all prioritized suggestions and opportunities')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Item 1: List Pending Products */}
                <div className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate">List Pending Products</div>
                      <div className="text-[10px] text-slate-400 truncate">You have 28 products ready to list.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt('List my 28 pending products across Amazon and Flipkart with AI content')
                    }
                    className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors"
                  >
                    List Now
                  </button>
                </div>

                {/* Item 2: Improve Low Performing Listings */}
                <div className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate">Improve Low Performing Listings</div>
                      <div className="text-[10px] text-slate-400 truncate">15 listings have low conversion.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt('Optimize titles and search terms for my 15 low performing listings')
                    }
                    className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors"
                  >
                    Optimize
                  </button>
                </div>

                {/* Item 3: Update Prices */}
                <div className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate">Update Prices</div>
                      <div className="text-[10px] text-slate-400 truncate">7 products can be repriced for better Buy Box chance.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt('Review repricing strategy for 7 products to win the Buy Box')
                    }
                    className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors"
                  >
                    Review
                  </button>
                </div>

                {/* Item 4: Create Seasonal Campaign */}
                <div className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <PartyPopper className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate">Create Seasonal Campaign</div>
                      <div className="text-[10px] text-slate-400 truncate">Prepare listings for upcoming festival season.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt('Create seasonal festival campaign discounts and bundle recommendations')
                    }
                    className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors"
                  >
                    Plan Now
                  </button>
                </div>

                {/* Item 5: Fix Listing Errors */}
                <div className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate">Fix Listing Errors</div>
                      <div className="text-[10px] text-slate-400 truncate">5 listings need your attention.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPrompt('Help me fix the 5 listing rejection errors on Flipkart and Amazon')
                    }
                    className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors"
                  >
                    Fix Now
                  </button>
                </div>
              </div>
            </div>

            {/* Widget 2: Quick Actions (6 Grid Buttons) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('AI Listing Studio')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors shadow-2xs text-left"
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate text-[11px]">Create Listings</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Pricing')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors shadow-2xs text-left"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate text-[11px]">Update Prices</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Inventory')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors shadow-2xs text-left"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate text-[11px]">Check Inventory</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Analytics')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors shadow-2xs text-left"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate text-[11px]">Analyze Sales</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPrompt('Find high-growth category product opportunities')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors shadow-2xs text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate text-[11px]">Find Opportunities</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Automations')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition-colors shadow-2xs text-left"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate text-[11px]">Create Automation</span>
                </button>
              </div>
            </div>

            {/* Widget 3: Recent Conversations */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Recent Conversations</h3>
                <button
                  type="button"
                  onClick={() => showToast('Displaying 5 recent conversations')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Conv 1 */}
                <div
                  onClick={() =>
                    handleQuickPrompt('Review progress on the automation for 50 listings daily')
                  }
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer group transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                      Create automation for 50 listings daily
                    </div>
                    <div className="text-[10px] text-slate-400">Today, 10:24 AM</div>
                  </div>
                </div>

                {/* Conv 2 */}
                <div
                  onClick={() =>
                    handleQuickPrompt('Why is my listing not live on Flipkart? Check catalog sync logs.')
                  }
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer group transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                      Why my listing is not live on Flipkart?
                    </div>
                    <div className="text-[10px] text-slate-400">Today, 09:18 AM</div>
                  </div>
                </div>

                {/* Conv 3 */}
                <div
                  onClick={() =>
                    handleQuickPrompt('Suggest high search volume keywords for stainless steel water bottles')
                  }
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer group transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                      Suggest keywords for water bottles
                    </div>
                    <div className="text-[10px] text-slate-400">Yesterday, 06:45 PM</div>
                  </div>
                </div>

                {/* Conv 4 */}
                <div
                  onClick={() =>
                    handleQuickPrompt('Analyze last month sales performance across Amazon and Flipkart')
                  }
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer group transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                      Analyze last month's sales performance
                    </div>
                    <div className="text-[10px] text-slate-400">Yesterday, 12:30 PM</div>
                  </div>
                </div>

                {/* Conv 5 */}
                <div
                  onClick={() =>
                    handleQuickPrompt('Find trending products in kitchen and dining category')
                  }
                  className="p-2 rounded-lg hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer group transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                      Find trending products in kitchen category
                    </div>
                    <div className="text-[10px] text-slate-400">Sep 14, 2024, 04:20 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 4: Pro Tip Box */}
            <div className="bg-indigo-50/40 border border-indigo-100/90 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Pro Tip</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    You can also upload a file (Excel/CSV) and ask me to create listings from it.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        </div>
      </main>

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
