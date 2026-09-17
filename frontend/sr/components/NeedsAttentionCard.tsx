import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { AttentionItem } from '../types';

interface NeedsAttentionCardProps {
  items: AttentionItem[];
  onAction: (actionType: string, item: AttentionItem) => void;
  onAskAi: (prompt: string) => void;
  onViewAll?: () => void;
}

export default function NeedsAttentionCard({
  items,
  onAction,
  onAskAi,
  onViewAll,
}: NeedsAttentionCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleExecuteAction = async (actionType: string, item: AttentionItem) => {
    setLoadingAction(`${actionType}-${item.id}`);
    try {
      await onAction(actionType, item);
    } finally {
      setLoadingAction(null);
    }
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'WARNING':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'OPPORTUNITY':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'OPTIMIZATION':
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  const getBadgePrefix = (badge: string) => {
    switch (badge.toUpperCase()) {
      case 'CRITICAL':
        return '!';
      case 'WARNING':
        return '⚠';
      case 'OPPORTUNITY':
        return '⚡';
      case 'OPTIMIZATION':
      default:
        return '★';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-full">
      {/* Card Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold text-slate-900">Needs Attention</h3>
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          View all →
        </button>
      </div>

      {/* Item List */}
      <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-between">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <span>All priority issues resolved! Your catalog and inventory are healthy.</span>
          </div>
        ) : (
          items.map((item) => {
            const isLoading = loadingAction === `${item.actionType}-${item.id}`;

            return (
              <div
                key={item.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                {/* Left side: Badge + Title + Subtitle */}
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${getBadgeStyle(
                      item.badge
                    )}`}
                  >
                    <span>{getBadgePrefix(item.badge)}</span>
                    <span>{item.badge}</span>
                  </span>

                  <div>
                    <div className="text-[13px] font-bold text-slate-900 leading-tight">
                      {item.title}
                    </div>
                    <div className="text-[12px] text-slate-500 mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {/* Right side: Risk value + Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.riskText && (
                    <span className="text-xs font-bold text-rose-600 mr-1">
                      {item.riskText}
                    </span>
                  )}

                  {/* Primary Action Button */}
                  <button
                    disabled={isLoading}
                    onClick={() => handleExecuteAction(item.actionType, item)}
                    className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : item.primaryAction}
                  </button>

                  {/* Secondary Action Button */}
                  {item.secondaryAction && (
                    <button
                      onClick={() => {
                        if (item.secondaryAction === 'Ask AI') {
                          onAskAi(`What should I do about: ${item.title}? ${item.subtitle}`);
                        } else {
                          onAction(item.actionType, item);
                        }
                      }}
                      className="px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
                    >
                      {item.secondaryAction}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
