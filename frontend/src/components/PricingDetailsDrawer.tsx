import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Settings,
  Edit2,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Target,
  History,
  Ban,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Award,
  Users,
  Eye,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import { PricingRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';

interface PricingDetailsDrawerProps {
  item: PricingRecord | null;
  onClose: () => void;
  onApplyPrice?: (id: number, price: number) => void;
  onUpdatePrice?: (id: number, price: number) => void;
  onExcludeProduct?: (id: number) => void;
}

export default function PricingDetailsDrawer({
  item,
  onClose,
  onApplyPrice,
  onUpdatePrice,
  onExcludeProduct,
}: PricingDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'Pricing' | 'Competitors' | 'Price History' | 'Rules' | 'AI Insights'>('Pricing');
  const [copiedSku, setCopiedSku] = useState(false);
  const [copiedAsin, setCopiedAsin] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState<number>(item?.currentPrice ?? 0);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [isTracked, setIsTracked] = useState(false);
  const [isExcluded, setIsExcluded] = useState(false);

  if (!item) return null;

  const handleCopySku = () => {
    navigator.clipboard?.writeText(item.sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleCopyAsin = () => {
    navigator.clipboard?.writeText(item.asin);
    setCopiedAsin(true);
    setTimeout(() => setCopiedAsin(false), 2000);
  };

  const handleApplySuggested = () => {
    if (onApplyPrice) {
      onApplyPrice(item.id, item.suggestedPrice);
    }
    setAppliedNotice(`Price updated to ₹${item.suggestedPrice}`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const handleSaveEditedPrice = () => {
    if (onUpdatePrice) {
      onUpdatePrice(item.id, editedPrice);
    }
    setIsEditingPrice(false);
    setAppliedNotice(`Current price saved as ₹${editedPrice}`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const getStatusBadge = (status: PricingRecord['priceStatus']) => {
    switch (status) {
      case 'Optimal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Optimal
          </span>
        );
      case 'Reprice':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Reprice
          </span>
        );
      case 'Overpriced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Overpriced
          </span>
        );
      case 'Underpriced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Underpriced
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Toast Notification */}
      {appliedNotice && (
        <div className="bg-emerald-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{appliedNotice}</span>
          </div>
          <button onClick={() => setAppliedNotice(null)} className="text-emerald-100 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-start gap-3">
          <ProductCatalogGraphic
            type={item.imageType}
            className="w-12 h-12 rounded-lg border border-slate-200/80 bg-slate-50/50 p-1 shrink-0"
          />

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">
                {item.name}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {getStatusBadge(item.priceStatus)}
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-0.5"
                  title="Close details drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SKU and ASIN meta lines */}
            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span>SKU:</span>
                <span className="font-medium text-slate-700">{item.sku}</span>
                <button
                  onClick={handleCopySku}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  title="Copy SKU"
                >
                  {copiedSku ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>ASIN:</span>
                <span className="font-medium text-slate-700">{item.asin}</span>
                <button
                  onClick={handleCopyAsin}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  title="Copy ASIN"
                >
                  {copiedAsin ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => {
                    setAppliedNotice('Syncing marketplace prices...');
                    setTimeout(() => setAppliedNotice(null), 2000);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 ml-0.5"
                  title="Sync price with Amazon & Flipkart"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  title="Item pricing settings"
                >
                  <Settings className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span>Marketplace</span>
                <div className="flex items-center gap-1.5">
                  <span title="Amazon">
                    <AmazonLogo className="w-4 h-4" />
                  </span>
                  <span title="Flipkart">
                    <FlipkartLogo className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 px-4 bg-white text-xs font-medium text-slate-500 overflow-x-auto no-scrollbar">
        {(['Pricing', 'Competitors', 'Price History', 'Rules', 'AI Insights'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-2.5 relative whitespace-nowrap transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'hover:text-slate-800'
              }`}
            >
              {tab}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 text-xs">
        {activeTab === 'Pricing' ? (
          <>
            {/* Card 1: Current Pricing */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <Target className="w-4 h-4 text-slate-600" />
                <span>Current Pricing</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Current Price */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Current Price</span>
                  <div className="flex items-center gap-2">
                    {isEditingPrice ? (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(Number(e.target.value))}
                          className="w-16 px-1.5 py-0.5 border border-indigo-400 rounded text-xs font-bold text-slate-900 text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleSaveEditedPrice}
                          className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingPrice(false)}
                          className="px-1 text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900 text-sm">₹{item.currentPrice}</span>
                        <button
                          onClick={() => {
                            setEditedPrice(item.currentPrice);
                            setIsEditingPrice(true);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Suggested Price */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Suggested Price</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">₹{item.suggestedPrice}</span>
                    <button
                      onClick={handleApplySuggested}
                      className="px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-semibold transition-colors shadow-2xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Min Price */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Min Price</span>
                  <span className="font-semibold text-slate-900">₹{item.minPrice}</span>
                </div>

                {/* Max Price */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Max Price</span>
                  <span className="font-semibold text-slate-900">₹{item.maxPrice}</span>
                </div>

                {/* Cost Price */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Cost Price</span>
                  <span className="font-semibold text-slate-900">₹{item.costPrice}</span>
                </div>

                {/* Your Margin */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Your Margin</span>
                  <span className="font-semibold text-slate-900">
                    {item.marginPercent}% (₹{item.marginAmount})
                  </span>
                </div>

                {/* Market Price (Avg.) */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Market Price (Avg.)</span>
                  <span className="font-semibold text-slate-900">₹{item.marketPriceAvg}</span>
                </div>

                {/* Price Status */}
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Price Status</span>
                  {getStatusBadge(item.priceStatus)}
                </div>
              </div>
            </div>

            {/* Card 2: Buy Box & Competition */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <Award className="w-4 h-4 text-slate-600" />
                <span>Buy Box & Competition</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Buy Box Status</span>
                  {item.buyBoxWon ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Won ({item.buyBox})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      Lost ({item.buyBox})
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Your Price Rank</span>
                  <span className="font-semibold text-slate-900">{item.priceRank}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Lowest Competitor Price</span>
                  <span className="font-semibold text-slate-900">₹{item.lowestCompetitorPrice}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Total Competitors</span>
                  <span className="font-semibold text-slate-900">{item.totalCompetitors}</span>
                </div>

                <button
                  onClick={() => setActiveTab('Competitors')}
                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-xs hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Competitors</span>
                </button>
              </div>
            </div>

            {/* Card 3: AI Pricing Insights */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Pricing Insights</span>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-xs">
                    Price is well positioned!
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed font-normal">
                    {item.aiInsightText ||
                      "You're 8% above the minimum price and winning the Buy Box. Consider a small discount to increase sales volume."}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                <span>Quick Actions</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleApplySuggested}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[11px] transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="truncate">Apply Suggested Price</span>
                </button>

                <button
                  onClick={() => {
                    setAppliedNotice('Opened Price Rule Builder');
                    setTimeout(() => setAppliedNotice(null), 2000);
                  }}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-colors shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">Set Price Rule</span>
                </button>

                <button
                  onClick={() => {
                    setIsTracked(!isTracked);
                    setAppliedNotice(isTracked ? 'Product untracked' : 'Product added to Watchlist');
                    setTimeout(() => setAppliedNotice(null), 2000);
                  }}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 border rounded-lg text-[11px] transition-colors shadow-2xs ${
                    isTracked
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{isTracked ? 'Tracking Active' : 'Track This Product'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('Price History')}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-colors shadow-2xs"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">View Price History</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsExcluded(!isExcluded);
                  if (onExcludeProduct) onExcludeProduct(item.id);
                  setAppliedNotice(isExcluded ? 'Re-enabled for repricing' : 'Excluded from auto-repricing');
                  setTimeout(() => setAppliedNotice(null), 2000);
                }}
                className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 border rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                  isExcluded
                    ? 'bg-slate-100 border-slate-300 text-slate-600'
                    : 'bg-white hover:bg-rose-50/60 border-rose-200 text-rose-600'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isExcluded ? 'Include in Repricing' : 'Exclude from Repricing'}</span>
              </button>
            </div>
          </>
        ) : activeTab === 'Competitors' ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">8 Active Competitors</span>
                <span className="text-[11px] text-slate-500">Sorted by Price (Low to High)</span>
              </div>

              <div className="space-y-2">
                {(((item as any).competitors || []) as any[]).map((comp: any, idx: number) => ({ ...comp, isYou: Boolean(comp.isYou) })).map((comp: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      comp.isYou ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{comp.name}</span>
                        {comp.isYou && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-600 text-white font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {comp.rating} • {comp.delivery} • Buy Box: {comp.buyBox}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">₹{comp.price}</div>
                      <div className="text-[10px] text-slate-500">
                        {comp.price < item.currentPrice ? (
                          <span className="text-rose-600 font-semibold">-₹{item.currentPrice - comp.price}</span>
                        ) : comp.price > item.currentPrice ? (
                          <span className="text-emerald-600 font-semibold">+₹{comp.price - item.currentPrice}</span>
                        ) : (
                          'Matched'
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'Price History' ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">30-Day Price Log</span>
                <span className="text-[11px] text-slate-500">{(((item as any).priceHistory || []) as any[]).length} repricing events</span>
              </div>

              <div className="space-y-2.5">
                {(((item as any).priceHistory || []) as any[]).map((log: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{log.event}</span>
                      <span className="text-[10px] text-slate-400">{log.date}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Changed from <span className="line-through text-slate-400">₹{log.oldPrice}</span> to{' '}
                      <span className="font-bold text-slate-900">₹{log.newPrice}</span>
                    </div>
                    <div className="text-[10px] text-indigo-600">{log.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'Rules' ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Assigned Pricing Rules</span>
                <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline">+ New Rule</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Buy Box Maximizer (Default)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-600 text-white font-bold">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Stay ₹1 lower than the Buy Box price as long as price is above Min Price (₹{item.minPrice}).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Margin Guard Floor</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 font-bold">Enforced</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Never discount below 20% gross margin (Min Price ₹{item.minPrice}).
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">AI Demand & Price Elasticity</span>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Based on machine learning models factoring in historical sales velocity, competitor stockouts, and click-through rates across Amazon and Flipkart:
                </p>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-900 text-xs">Optimal Price Point: ₹{item.suggestedPrice}</div>
                  <p className="text-emerald-700 text-[11px]">
                    Expected +{item.estProfitLift}% monthly profit lift with {((item as any).buyBoxProbability != null ? String((item as any).buyBoxProbability) + '%' : 'an unavailable')} Buy Box win probability.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Price Elasticity</div>
                    <div className="font-bold text-slate-800 text-xs mt-0.5">{(item as any).priceElasticity ?? '—'}</div>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-[10px]">Forecast Daily Sales</div>
                    <div className="font-bold text-slate-800 text-xs mt-0.5">{(item as any).forecastDailySales ?? '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
