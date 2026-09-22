import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  AlertTriangle,
  ChevronRight,
  Send,
  Zap,
  Tag,
  Megaphone,
  CheckCircle2,
  Package,
  Bot
} from 'lucide-react';
import { CopilotInsight } from '../types';

interface AiSellerCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  copilotInsight: CopilotInsight;
  onCreatePurchasePlan: () => void;
  onIgnoreInsight: () => void;
  onSelectSecondaryInsight: (type: string) => void;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionRequired?: string;
}

export default function AiSellerCopilotDrawer({
  isOpen,
  onClose,
  copilotInsight,
  onCreatePurchasePlan,
  onIgnoreInsight,
  onSelectSecondaryInsight,
  externalPrompt,
  onClearExternalPrompt,
}: AiSellerCopilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<'Insight' | 'Ask' | 'Actions'>('Insight');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (externalPrompt) {
      setActiveTab('Ask');
      handleSendMessage(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  useEffect(() => {
    if (activeTab === 'Ask') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/v1/personal/ai/seller-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation: chatMessages.slice(-6),
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'Analysis completed for your current inventory and sales metrics.',
        timestamp: 'Just now',
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'I ran into an issue connecting to the seller engine. Please try again in a moment.',
        timestamp: 'Just now',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Top Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 leading-tight">
              AI Seller Copilot
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 px-5 text-xs font-semibold">
        {(['Insight', 'Ask', 'Actions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-3 -mb-px border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {activeTab === 'Insight' && (
          <>
            {copilotInsight.status !== 'dismissed' ? (
              <div className="border border-rose-200/90 bg-rose-50/40 rounded-xl p-4 space-y-3 shadow-2xs">
                {/* Alert title banner */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                      {copilotInsight.alert.title}
                    </div>
                    <div className="text-[13px] font-bold text-slate-900 mt-0.5 leading-tight">
                      {copilotInsight.alert.subtitle}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 pt-1 border-t border-rose-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Context: </span>
                    <span className="text-slate-600">{copilotInsight.context}</span>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900">
                      Finding:{' '}
                      <span className="font-normal text-slate-700">
                        {copilotInsight.finding}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 mb-1">Why:</div>
                    <ul className="space-y-1 text-slate-600 list-disc pl-4 text-[11.5px]">
                      {copilotInsight.why.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-1">
                    <div className="font-bold text-slate-900 mb-0.5">Recommendation:</div>
                    <div className="font-extrabold text-slate-900 text-[13px]">
                      {copilotInsight.recommendation.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {copilotInsight.recommendation.cover}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={onCreatePurchasePlan}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors text-center"
                  >
                    Create Purchase Plan
                  </button>
                  <button
                    onClick={onIgnoreInsight}
                    className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Primary insight dismissed.
              </div>
            )}

            {/* Secondary Insights list */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setActiveTab('Ask');
                  handleSendMessage('Show pricing opportunities and how to increase margins by 3-6%');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 flex items-center justify-between transition-all text-left shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-yellow-50 text-yellow-600 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Pricing Opportunity
                    </div>
                    <div className="text-[11px] text-slate-500">
                      5 SKUs can increase margin by 3–6%
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('Ask');
                  handleSendMessage('Analyze current advertising spend and suggest campaign optimizations');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 flex items-center justify-between transition-all text-left shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Megaphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Ad Optimization
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Review current advertising spend and conversion data
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>
            </div>
          </>
        )}

        {activeTab === 'Ask' && (
          <div className="space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/70 whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI is analyzing your SellerHub metrics...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'Actions' && (
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                1-Click Inventory Reorder
              </div>
              <p className="text-slate-600 text-[11px]">
                Create a purchase order from the stockout recommendation and current inventory data.
              </p>
              <button
                onClick={onCreatePurchasePlan}
                className="w-full mt-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold"
              >
                Execute Reorder
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Sync Suppressed Listings
              </div>
              <p className="text-slate-600 text-[11px]">
                Auto-fix 3 Amazon suppressed listings with validated HSN codes and image tags.
              </p>
              <button
                onClick={() => onSelectSecondaryInsight('fix_listings')}
                className="w-full mt-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold"
              >
                Auto-Fix Listings
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                Apply Dynamic Pricing
              </div>
              <p className="text-slate-600 text-[11px]">
                Raise prices by 3–6% on 5 products with 100% buy box dominance.
              </p>
              <button
                onClick={() => onSelectSecondaryInsight('review_pricing')}
                className="w-full mt-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
              >
                Apply Optimal Margins
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Chat Input */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your business..."
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isSending}
            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 -mr-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
