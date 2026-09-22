import React, { useState } from 'react';
import {
  X,
  Edit2,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Search,
  History,
  Layers,
  Pause,
  Play,
  SlidersHorizontal,
  Copy,
  FileText,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  Award
} from 'lucide-react';
import { CampaignRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';

interface CampaignDetailsDrawerProps {
  campaign: CampaignRecord | null;
  onClose: () => void;
  onToggleStatus?: (id: number) => void;
  onUpdateBudget?: (id: number, newBudget: number) => void;
  onArchive?: (id: number) => void;
}

export default function CampaignDetailsDrawer({
  campaign,
  onClose,
  onToggleStatus,
  onUpdateBudget,
  onArchive,
}: CampaignDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Ad Groups' | 'Keywords' | 'Search Terms' | 'History'>('Overview');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editedBudget, setEditedBudget] = useState<number>(campaign?.dailyBudget || 1000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!campaign) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveBudget = () => {
    if (onUpdateBudget) {
      onUpdateBudget(campaign.id, editedBudget);
    }
    setIsEditingBudget(false);
    showToast(`Daily budget updated to ₹${editedBudget.toLocaleString('en-IN')}`);
  };

  const handleToggleCampaignStatus = () => {
    if (onToggleStatus) {
      onToggleStatus(campaign.id);
    }
    showToast(
      campaign.status === 'Active'
        ? `Campaign paused successfully`
        : `Campaign resumed and active`
    );
  };

  const handleArchiveCampaign = () => {
    if (onArchive) {
      onArchive(campaign.id);
    }
    showToast(`Campaign ${campaign.campaignName} archived`);
  };

  const getStatusBadge = (status: CampaignRecord['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'Paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Paused
          </span>
        );
      case 'Ended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Ended
          </span>
        );
    }
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-slate-900 text-white text-xs font-medium px-4 py-2 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-start gap-3">
          <ProductCatalogGraphic
            type={campaign.imageType}
            className="w-12 h-12 rounded-lg border border-slate-200/80 bg-slate-50/50 p-1 shrink-0"
          />

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 truncate leading-snug">
                {campaign.productName}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {getStatusBadge(campaign.status)}
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-0.5"
                  title="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span>Campaign:</span>
                <span className="font-semibold text-slate-700">{campaign.campaignName}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Type:</span>
                <span className="font-medium text-slate-700">{campaign.type}</span>
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
        {(['Overview', 'Ad Groups', 'Keywords', 'Search Terms', 'History'] as const).map((tab) => {
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
        {activeTab === 'Overview' ? (
          <>
            {/* 1. Campaign Details Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Tag className="w-4 h-4 text-slate-600" />
                  <span>Campaign Details</span>
                </div>
                <button
                  onClick={() => setIsEditingBudget(!isEditingBudget)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[11px] font-medium hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Campaign Name</span>
                  <span className="font-semibold text-slate-900">{campaign.campaignName}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Campaign Type</span>
                  <span className="font-semibold text-slate-900">{campaign.type}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-semibold ${campaign.status === 'Active' ? 'text-emerald-600' : campaign.status === 'Paused' ? 'text-amber-600' : 'text-slate-500'}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Marketplace</span>
                  <div className="flex items-center gap-1.5">
                    {campaign.marketplace === 'amazon' ? (
                      <span title="Amazon">
                        <AmazonLogo className="w-4 h-4" />
                      </span>
                    ) : (
                      <span title="Flipkart">
                        <FlipkartLogo className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-medium text-slate-800">{campaign.startDate}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">End Date</span>
                  <span className="font-medium text-slate-800">{campaign.endDate}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Daily Budget</span>
                  {isEditingBudget ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        value={editedBudget}
                        onChange={(e) => setEditedBudget(Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 border border-indigo-400 rounded text-xs font-bold text-slate-900 text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleSaveBudget}
                        className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900">₹{campaign.dailyBudget.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Total Spend</span>
                  <span className="font-semibold text-slate-900">₹{campaign.adSpend.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">Total Sales (Ad)</span>
                  <span className="font-semibold text-slate-900">₹{campaign.salesAd.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">ACOS</span>
                  <span className="font-bold text-slate-900">{campaign.acos}%</span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-500">ROAS</span>
                  <span className="font-bold text-slate-900">{campaign.roas}</span>
                </div>
              </div>
            </div>

            {/* 2. Performance (Last 30 Days) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <span>Performance (Last 30 Days)</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Clicks */}
                <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                  <div className="text-[11px] text-slate-500">Clicks</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {campaign.clicks.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center">
                      ↑ {campaign.clicksGrowth}
                    </span>
                  </div>
                </div>

                {/* Impressions */}
                <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                  <div className="text-[11px] text-slate-500">Impressions</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {campaign.impressions.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center">
                      ↑ {campaign.impressionsGrowth}
                    </span>
                  </div>
                </div>

                {/* CTR */}
                <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                  <div className="text-[11px] text-slate-500">CTR</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {campaign.ctr}%
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center">
                      ↑ {campaign.ctrGrowth}
                    </span>
                  </div>
                </div>

                {/* CPC */}
                <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                  <div className="text-[11px] text-slate-500">CPC</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      ₹{campaign.cpc}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center">
                      ↓ {campaign.cpcGrowth.replace('-', '')}
                    </span>
                  </div>
                </div>

                {/* Orders (Ad) */}
                <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                  <div className="text-[11px] text-slate-500">Orders (Ad)</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {campaign.ordersAd}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center">
                      ↑ {campaign.ordersAdGrowth}
                    </span>
                  </div>
                </div>

                {/* Sales (Ad) */}
                <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                  <div className="text-[11px] text-slate-500">Sales (Ad)</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      ₹{campaign.salesAd.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center">
                      ↑ {campaign.salesAdGrowth}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Top Keywords Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Search className="w-4 h-4 text-slate-600" />
                  <span>Top Keywords</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 pb-1">
                      <th className="pb-1.5 font-medium">Keyword</th>
                      <th className="pb-1.5 font-medium text-right">Clicks</th>
                      <th className="pb-1.5 font-medium text-right">ACOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[11px]">
                    {campaign.topKeywords.map((kw, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 font-medium text-slate-700">{kw.keyword}</td>
                        <td className="py-1.5 text-right font-medium text-slate-900">{kw.clicks}</td>
                        <td className="py-1.5 text-right font-medium text-slate-600">{kw.acos}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setActiveTab('Keywords')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-xs hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                <span>View All Keywords</span>
              </button>
            </div>

            {/* 4. Campaign Actions */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                <span>Campaign Actions</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleCampaignStatus}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-colors shadow-2xs"
                >
                  {campaign.status === 'Active' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pause Campaign</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Resume Campaign</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsEditingBudget(true)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-colors shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Adjust Budget</span>
                </button>

                <button
                  onClick={() => showToast(`Campaign ${campaign.campaignName} cloned as draft`)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-colors shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clone Campaign</span>
                </button>

                <button
                  onClick={() => showToast(`Detailed campaign performance report downloaded`)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-[11px] transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Report</span>
                </button>
              </div>

              <button
                onClick={handleArchiveCampaign}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-rose-200 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50/60 transition-colors shadow-2xs"
              >
                <Archive className="w-3.5 h-3.5 text-rose-500" />
                <span>Archive Campaign</span>
              </button>
            </div>
          </>
        ) : activeTab === 'Ad Groups' ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Ad Groups</span>
                <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline">+ New Group</span>
              </div>
              <div className="space-y-2">
                {campaign.topKeywords.length === 0 ? null : campaign.topKeywords.map((kw, idx) => ({ name: kw.keyword, defaultBid: '—', status: '—', clicks: kw.clicks, spend: '—' })).map((ag, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{ag.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">{ag.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Default Bid: {ag.defaultBid}</span>
                      <span>Clicks: {ag.clicks}</span>
                      <span>Spend: {ag.spend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'Keywords' ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Targeted Keywords ({campaign.topKeywords.length + 3})</span>
                <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline">+ Add Keywords</span>
              </div>
              <div className="space-y-2">
                {campaign.topKeywords.concat([
                  ...campaign.topKeywords,
                ]).map((kw, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{kw.keyword}</div>
                      <div className="text-[10px] text-slate-500">Match: Exact • Status: Enabled</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-xs">{kw.clicks} clicks</div>
                      <div className="text-[10px] text-slate-600">ACOS: {kw.acos}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'Search Terms' ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Customer Search Terms</span>
                <span className="text-[11px] text-slate-500">Last 30 days</span>
              </div>
              <div className="space-y-2">
                {[
                  ...campaign.topKeywords.map((kw) => ({ query: kw.keyword, orders: 0, ctr: '', acos: String(kw.acos ?? '') })),
                ].map((st, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1">
                    <div className="font-semibold text-slate-900 text-xs">"{st.query}"</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Orders: {st.orders}</span>
                      <span>CTR: {st.ctr}</span>
                      <span className="text-emerald-600 font-medium">ACOS: {st.acos}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900">Campaign History</span>
                <span className="text-[11px] text-slate-500">Audit Trail</span>
              </div>
              <div className="space-y-2.5">
                {[
                  ...([] as { user: string; date: string; action: string }[]),
                ].map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900">{log.user}</span>
                      <span className="text-slate-400 text-[10px]">{log.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
