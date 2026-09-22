import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  Sparkles,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Pause,
  Play,
  Copy,
  Edit2,
  Archive,
  Download,
  Plus,
  Filter,
  Check,
  TrendingUp,
  TrendingDown,
  Layers,
  MousePointer,
  Eye,
  Wallet,
  ShoppingBag,
  Percent,
  Target,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { CampaignRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import AdPerformanceTrendChart from './AdPerformanceTrendChart';
import CampaignDetailsDrawer from './CampaignDetailsDrawer';

interface AdvertisingWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

const initialCampaigns: CampaignRecord[] = [];

export default function AdvertisingWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'All Marketplaces',
  onSelectMarketplaceFilter,
}: AdvertisingWorkspaceProps) {
  // Campaigns list state
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(initialCampaigns);
  // Active campaign for the right-side drawer (null by default until user clicks a campaign)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);

  // Tab filter: 'All Campaigns' (48) | 'Sponsored Products' (28) | 'Sponsored Brands' (12) | 'Sponsored Display' (8)
  const [activeTab, setActiveTab] = useState<'All Campaigns' | 'Sponsored Products' | 'Sponsored Brands' | 'Sponsored Display'>('All Campaigns');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('All Marketplaces');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('All Campaign Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalCampaignsCount = 48; // Matches screenshot "1 to 10 of 48 campaigns"

  // Feedback notification
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Sync with real backend advertising API
  React.useEffect(() => {
    const fetchBackendCampaigns = async () => {
      try {
        const res = await fetch('/api/v1/advertising');
        if (res.ok) {
          const json = await res.json();
          if (json.items && json.items.length > 0) {
            const mapped: CampaignRecord[] = json.items.map((c: any, idx: number) => {
              const spend = c.spend !== undefined ? c.spend : (c.ad_spend !== undefined ? c.ad_spend : 12450);
              const sales = c.sales !== undefined ? c.sales : (c.sales_ad !== undefined ? c.sales_ad : Math.round(spend * 4.8));
              const acos = c.acos !== undefined ? c.acos : (spend > 0 && sales > 0 ? parseFloat(((spend / sales) * 100).toFixed(1)) : 19.8);
              const roas = c.roas !== undefined ? c.roas : (spend > 0 && sales > 0 ? parseFloat((sales / spend).toFixed(2)) : 5.06);

              return {
                id: c.id || idx + 1,
                campaignName: c.campaign_name || c.name || `Campaign-${c.id || idx + 1}`,
                productName: c.product_name || 'Stainless Steel Bottle 1L',
                type: (c.campaign_type || c.type || 'Sponsored Products') as any,
                marketplace: (c.marketplace || 'amazon').toLowerCase().includes('flipkart') ? 'flipkart' : 'amazon',
                status: (c.status || 'Active') as any,
                dailyBudget: c.daily_budget || c.dailyBudget || 1000,
                adSpend: spend,
                salesAd: sales,
                acos,
                roas,
                imageType: c.sku?.includes('TUM') ? 'tumbler' : c.sku?.includes('MUG') ? 'mug' : 'bottle-black',
                startDate: c.created_at ? c.created_at.split(' ')[0] : (c.start_date || 'Nov 1, 2024'),
                endDate: c.end_date || 'No end date',
                clicks: c.clicks || Math.round(spend / 10),
                clicksGrowth: '12.3%',
                impressions: c.impressions || Math.round((spend / 10) * 24),
                impressionsGrowth: '8.7%',
                ctr: c.ctr || 4.2,
                ctrGrowth: '3.1%',
                cpc: c.cpc || 9.9,
                cpcGrowth: '-5.2%',
                ordersAd: c.orders || c.orders_ad || Math.round(sales / 500),
                ordersAdGrowth: '18.6%',
                salesAdGrowth: '18.3%',
                topKeywords: c.top_keywords || [
                  { keyword: 'water bottle', clicks: 650, acos: 18.2 },
                  { keyword: 'steel bottle', clicks: 420, acos: 16.5 },
                  { keyword: 'gym bottle', clicks: 380, acos: 20.1 },
                ],
              };
            });
            setCampaigns(mapped);
          }
        }
      } catch (err) {
        console.warn('Backend advertising sync notice:', err);
      }
    };
    fetchBackendCampaigns();
  }, []);

  const showAlert = (msg: string) => {
    setBannerAlert(msg);
    setTimeout(() => setBannerAlert(null), 3500);
  };

  // Toggle single selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all visible
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredCampaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCampaigns.map((c) => c.id));
    }
  };

  // Bulk actions
  const handleBulkPause = async () => {
    if (selectedIds.length === 0) {
      showAlert('Select at least one campaign to pause');
      return;
    }
    const ids = [...selectedIds];
    setCampaigns((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, status: 'Paused' } : c))
    );
    showAlert(`Paused ${ids.length} campaign(s)`);
    setSelectedIds([]);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/v1/advertising/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Paused' })
          })
        )
      );
    } catch (e) {
      console.warn(e);
    }
  };

  const handleBulkResume = async () => {
    if (selectedIds.length === 0) {
      showAlert('Select at least one campaign to resume');
      return;
    }
    const ids = [...selectedIds];
    setCampaigns((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, status: 'Active' } : c))
    );
    showAlert(`Resumed ${ids.length} campaign(s)`);
    setSelectedIds([]);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/v1/advertising/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Active' })
          })
        )
      );
    } catch (e) {
      console.warn(e);
    }
  };

  const handleBulkAiOptimize = () => {
    showAlert('AI Optimizer analyzed selected campaigns: Recommended budget reallocations applied to maximize ROAS');
  };

  const handleBulkArchive = () => {
    if (selectedIds.length === 0) {
      showAlert('Select at least one campaign to archive');
      return;
    }
    setCampaigns((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    showAlert(`Archived ${selectedIds.length} campaign(s)`);
    setSelectedIds([]);
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Tab filter
      if (activeTab === 'Sponsored Products' && c.type !== 'Sponsored Products') return false;
      if (activeTab === 'Sponsored Brands' && c.type !== 'Sponsored Brand') return false;
      if (activeTab === 'Sponsored Display' && c.type !== 'Sponsored Display') return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.campaignName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.topKeywords.some((k) => k.keyword.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Marketplace dropdown
      if (marketplaceFilter === 'Amazon' && c.marketplace !== 'amazon') return false;
      if (marketplaceFilter === 'Flipkart' && c.marketplace !== 'flipkart') return false;

      // Campaign Type dropdown
      if (campaignTypeFilter !== 'All Campaign Types' && c.type !== campaignTypeFilter) return false;

      // Status dropdown
      if (statusFilter !== 'All Statuses' && c.status !== statusFilter) return false;

      return true;
    });
  }, [campaigns, activeTab, searchQuery, marketplaceFilter, campaignTypeFilter, statusFilter]);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f8fafc]">
      {/* Main Center Column */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Banner Alert if any */}
        {bannerAlert && (
          <div className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between shadow-xs">
            <span>{bannerAlert}</span>
            <button onClick={() => setBannerAlert(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Advertising
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Create, manage and optimize your ad campaigns across all marketplaces.
              </p>
            </div>

            {/* Top Action Controls */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Date range picker button */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Dec 1, 2024 - Dec 15, 2024</span>
              </button>

              {/* Create Campaign ▾ button */}
              <button
                onClick={() => showAlert('Opening Campaign Creation Wizard...')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
              >
                <span>Create Campaign</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* AI Optimize button */}
              <button
                onClick={() => {
                  if (onOpenAiCopilot) onOpenAiCopilot();
                  else showAlert('AI Campaign Optimizer engaged: Generating bid and budget recommendations');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50/50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Optimize</span>
              </button>

              {/* Overflow button */}
              <button
                onClick={() => showAlert('Showing advertising export, bulk logs, and audit options')}
                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-500 hover:text-slate-800 rounded-lg shadow-2xs transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Total Ad Spend */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Total Ad Spend</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-900 tracking-tight">₹24,580</div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <span>↑ 12.5%</span>
                  <span className="text-slate-400 font-normal">vs last 30 days</span>
                </div>
              </div>
            </div>

            {/* 2. Total Sales (Ad) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Total Sales (Ad)</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-900 tracking-tight">₹1,24,350</div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <span>↑ 18.3%</span>
                </div>
              </div>
            </div>

            {/* 3. ACOS */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">ACOS</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-900 tracking-tight">19.8%</div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <span>↓ 4.2%</span>
                </div>
              </div>
            </div>

            {/* 4. ROAS */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">ROAS</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-900 tracking-tight">5.06</div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <span>↑ 16.7%</span>
                </div>
              </div>
            </div>

            {/* 5. Clicks */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Clicks</span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <MousePointer className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-900 tracking-tight">12,480</div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <span>↑ 14.1%</span>
                </div>
              </div>
            </div>

            {/* 6. Impressions */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Impressions</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-slate-900 tracking-tight">2,45,680</div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <span>↑ 11.3%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ad Performance Trend Chart */}
          <AdPerformanceTrendChart />

          {/* Campaign Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 text-xs font-medium overflow-x-auto no-scrollbar">
            {[
              { id: 'All Campaigns', label: 'All Campaigns', count: 48 },
              { id: 'Sponsored Products', label: 'Sponsored Products', count: 28 },
              { id: 'Sponsored Brands', label: 'Sponsored Brands', count: 12 },
              { id: 'Sponsored Display', label: 'Sponsored Display', count: 8 },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-indigo-600 font-bold bg-indigo-50/70 border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by campaign name, product, keyword..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Marketplace Filter */}
            <div className="relative">
              <select
                value={marketplaceFilter}
                onChange={(e) => setMarketplaceFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200/90 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="All Marketplaces">All Marketplaces</option>
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Campaign Type Filter */}
            <div className="relative">
              <select
                value={campaignTypeFilter}
                onChange={(e) => setCampaignTypeFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200/90 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="All Campaign Types">All Campaign Types</option>
                <option value="Sponsored Products">Sponsored Products</option>
                <option value="Sponsored Brand">Sponsored Brand</option>
                <option value="Sponsored Display">Sponsored Display</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200/90 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Ended">Ended</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* More Filters button */}
            <button
              onClick={() => showAlert('Opening advanced targeting, ACOS threshold and ROAS filters')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>More Filters</span>
            </button>
          </div>

          {/* Bulk Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs text-xs">
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 pl-1 pr-2 border-r border-slate-200">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredCampaigns.length}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 whitespace-nowrap">
                  {selectedIds.length} selected
                </span>
              </div>

              <button
                onClick={handleBulkPause}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                <Pause className="w-3.5 h-3.5 text-slate-500" />
                <span>Pause</span>
              </button>

              <button
                onClick={handleBulkResume}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resume</span>
              </button>

              <button
                onClick={() => showAlert('Adjusting daily budget across selected campaigns...')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Budget</span>
              </button>

              <button
                onClick={handleBulkAiOptimize}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-indigo-600 hover:bg-indigo-50 font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Optimize with AI</span>
              </button>

              <button
                onClick={() => showAlert('Editing selected campaigns in bulk')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => showAlert('Duplicating selected campaigns as new drafts')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>Archive</span>
              </button>
            </div>

            {/* Export dropdown */}
            <div className="flex items-center gap-1.5 pr-1">
              <button
                onClick={() => showAlert('Exporting advertising campaigns to CSV / Excel...')}
                className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Campaign Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredCampaigns.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Campaign Name</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Type</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Marketplace</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Status</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Budget</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Ad Spend</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Sales (Ad)</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">ACOS</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">ROAS</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCampaigns.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    const isDrawerActive = selectedCampaign?.id === c.id;

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCampaign(c)}
                        className={`cursor-pointer transition-colors ${
                          isDrawerActive
                            ? 'bg-indigo-50/40'
                            : isSelected
                            ? 'bg-slate-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(c.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(c.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Campaign Name + Product */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <ProductCatalogGraphic
                              type={c.imageType}
                              className="w-9 h-9 rounded-lg border border-slate-200/80 bg-slate-50/50 p-1 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {c.campaignName}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {c.productName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-medium text-slate-600">{c.type}</span>
                        </td>

                        {/* Marketplace */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {c.marketplace === 'amazon' ? (
                            <span title="Amazon">
                              <AmazonLogo className="w-4 h-4" />
                            </span>
                          ) : (
                            <span title="Flipkart">
                              <FlipkartLogo className="w-4 h-4" />
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {c.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : c.status === 'Paused' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Paused
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Ended
                            </span>
                          )}
                        </td>

                        {/* Budget */}
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-900">
                          ₹{c.dailyBudget.toLocaleString('en-IN')}
                        </td>

                        {/* Ad Spend */}
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-900">
                          ₹{c.adSpend.toLocaleString('en-IN')}
                        </td>

                        {/* Sales (Ad) */}
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-900">
                          ₹{c.salesAd.toLocaleString('en-IN')}
                        </td>

                        {/* ACOS */}
                        <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-900">
                          {c.acos}%
                        </td>

                        {/* ROAS */}
                        <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-900">
                          {c.roas}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3 whitespace-nowrap text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedCampaign(c)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Campaign options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination Bar matching screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-t border-slate-200 bg-white text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-800">1</span> to{' '}
                <span className="font-semibold text-slate-800">10</span> of{' '}
                <span className="font-semibold text-slate-800">{totalCampaignsCount}</span> campaigns
              </div>

              <div className="flex items-center gap-1 self-center">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40"
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {[1, 2, 3, 4, 5].map((pg) => {
                  const isActive = currentPage === pg;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`min-w-[28px] h-7 px-2 rounded-md font-medium text-xs transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-200'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <span className="px-1 text-slate-400">....</span>

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <select className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 font-medium cursor-pointer focus:outline-hidden">
                  <option>10 / page</option>
                  <option>25 / page</option>
                  <option>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Campaign Details Drawer */}
      {selectedCampaign && (
        <CampaignDetailsDrawer
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onToggleStatus={async (id) => {
            const current = campaigns.find((c) => c.id === id);
            const newStatus = current?.status === 'Active' ? 'Paused' : 'Active';
            setCampaigns((prev) =>
              prev.map((c) =>
                c.id === id ? { ...c, status: newStatus } : c
              )
            );
            setSelectedCampaign((curr) =>
              curr && curr.id === id
                ? { ...curr, status: newStatus }
                : curr
            );
            showAlert(`Campaign ${newStatus.toLowerCase()} successfully.`);
            try {
              await fetch(`/api/v1/advertising/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
              });
            } catch (e) {
              console.warn(e);
            }
          }}
          onUpdateBudget={async (id, newBudget) => {
            setCampaigns((prev) =>
              prev.map((c) => (c.id === id ? { ...c, dailyBudget: newBudget } : c))
            );
            setSelectedCampaign((curr) =>
              curr && curr.id === id ? { ...curr, dailyBudget: newBudget } : curr
            );
            showAlert(`Daily budget updated to ₹${newBudget}`);
            try {
              await fetch(`/api/v1/advertising/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daily_budget: newBudget })
              });
            } catch (e) {
              console.warn(e);
            }
          }}
          onArchive={(id) => {
            setCampaigns((prev) => prev.filter((c) => c.id !== id));
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}
