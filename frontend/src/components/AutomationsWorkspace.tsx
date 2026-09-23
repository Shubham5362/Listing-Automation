import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Plus,
  HelpCircle,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Package,
  Tag,
  RefreshCw,
  Megaphone,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Check,
  X,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Layers,
  ArrowRight,
  Eye,
  Info,
  CheckSquare,
  Square,
  FileText,
  Upload,
  Bot
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Marketplace Badges matching SellerHub design system
export const AmazonBadgeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`${className} rounded-md bg-amber-50 border border-amber-200/80 flex items-center justify-center p-0.5 shrink-0 shadow-2xs`}>
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <path d="M14.5 16.5c-3.5 2.2-7.5 1.5-10.2-.2-.4-.3-.1-.7.3-.5 2.8 1.4 6.5 1.7 9.6-.3.4-.3.7.6.3 1z" fill="#EA580C" />
      <path d="M15.4 15.2c-.3-.4-1.8-.2-2.7-.1-.3 0-.3-.3 0-.5 1.6-.9 4.1-.7 4.4-.3.3.4-.1 2.9-1.6 3.9-.3.2-.5.1-.4-.2.4-.9.6-2.4.3-2.8z" fill="#EA580C" />
      <path d="M12.8 7.3c-.2-.2-.5-.3-.9-.3-1.6 0-2.8 1.4-2.8 3.5 0 2 1.1 3.2 2.6 3.2 1.1 0 1.9-.6 2.3-1.4v1.1h1.7V7.5h-1.7v1.1c-.4-.7-1.2-1.3-2.2-1.3zm.2 4.9c-.8 0-1.4-.7-1.4-1.9 0-1.2.6-1.9 1.4-1.9.8 0 1.4.7 1.4 1.9 0 1.2-.6 1.9-1.4 1.9z" fill="#0F172A" />
    </svg>
  </div>
);

export const FlipkartBadgeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`${className} rounded-md bg-[#FBBF24] flex items-center justify-center font-bold text-[#1D4ED8] shadow-2xs shrink-0`}>
    <span className="font-extrabold italic text-[11px] leading-none">f</span>
  </div>
);

export const MeeshoBadgeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`${className} rounded-md bg-[#580032] flex items-center justify-center text-white font-bold shadow-2xs shrink-0`}>
    <span className="font-bold text-[11px] leading-none text-[#F43F5E]">m</span>
  </div>
);

export const MyntraBadgeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`${className} rounded-md bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white font-black shadow-2xs shrink-0`}>
    <span className="font-black text-[10px] leading-none tracking-tighter">M</span>
  </div>
);

export interface AutomationItem {
  id: string;
  name: string;
  description: string;
  type: 'Product Listing' | 'Price Update' | 'Inventory Sync' | 'Advertising' | 'Customer Engagement' | 'Alert';
  marketplaces: ('amazon' | 'flipkart' | 'meesho' | 'myntra')[];
  additionalMarketplacesCount?: number;
  scheduleType: 'Daily' | 'Specific Date' | 'Days of Week' | 'Interval' | 'Event' | 'Real-time';
  scheduleText: string;
  scheduleSubText?: string;
  progress: {
    current: number;
    total: number;
    percent: number;
  } | null;
  status: 'Running' | 'Scheduled' | 'Completed' | 'Paused' | 'Failed';
  lastRunDate: string;
  lastRunTime?: string;
  nextRunDate: string;
  nextRunTime?: string;
  createdBy: string;
  enabled: boolean;
  dailyLimit?: number;
  batchSize?: number;
  aiPrompt?: string;
  selectedProductsCount?: number;
  recentLogs?: {
    time: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }[];
}

const initialAutomations: AutomationItem[] = [];

// Catalog products available for automation selection
interface CatalogProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: string;
}

const defaultCatalogProducts: CatalogProduct[] = [];

interface AutomationsWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

export default function AutomationsWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'All Marketplaces',
  onSelectMarketplaceFilter,
}: AutomationsWorkspaceProps) {
  // State management
  const [automations, setAutomations] = useState<AutomationItem[]>(initialAutomations);
  const [catalogProductsList, setCatalogProductsList] = useState<CatalogProduct[]>(defaultCatalogProducts);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/automations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped: AutomationItem[] = data.map((item: any, idx: number) => ({
            id: String(item.id ?? ''),
            name: item.name || '',
            description: item.description || (item.actions && item.actions[0] && item.actions[0].message ? item.actions[0].message : ''),
            type: item.name && item.name.includes('Price') ? 'Price Update' : item.name && item.name.includes('Inventory') ? 'Inventory Sync' : item.name && item.name.includes('Review') ? 'Customer Engagement' : 'Product Listing',
            marketplaces: Array.isArray(item.marketplaces) ? item.marketplaces : [],
            scheduleType: item.trigger_type === 'event' ? 'Event' : 'Daily',
            scheduleText: item.trigger_type === 'event' ? 'Event Triggered' : (item.schedule_text || ''),
            progress: item.progress || null,
            status: item.status === 'Active' ? 'Scheduled' : item.status === 'Running' ? 'Running' : item.status === 'Paused' ? 'Paused' : 'Scheduled',
            lastRunDate: item.last_run_at ? new Date(item.last_run_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            lastRunTime: item.last_run_at ? new Date(item.last_run_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            nextRunDate: item.next_run_at ? new Date(item.next_run_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            nextRunTime: item.next_run_at ? new Date(item.next_run_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
            createdBy: '',
            enabled: Boolean(item.enabled),
          }));
          setAutomations(mapped);
        }
      })
      .catch(err => console.error('Failed to fetch automations:', err));

    fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/products')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.items || []);
        const mappedProducts: CatalogProduct[] = list.map((p: any) => ({
          id: p.id,
          sku: p.sku || '',
          name: p.title || p.name || '',
          category: p.category || '',
          stock: p.stock_quantity != null ? p.stock_quantity : (p.stock != null ? p.stock : 0),
          price: p.price != null ? p.price : 0,
          status: p.status === 'active' ? 'Active' : 'Unlisted',
        }));
        setCatalogProductsList(mappedProducts);
      })
      .catch(err => console.error('Failed to fetch products:', err));
  }, []);
  const [activeTab, setActiveTab] = useState<'All Automations' | 'Active' | 'Scheduled' | 'Paused' | 'Completed' | 'Failed'>('All Automations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('All Marketplaces');
  const [selectedType, setSelectedType] = useState<string>('All Automation Types');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [dateRangeText] = useState('');

  // Modals and Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAutomationDetails, setSelectedAutomationDetails] = useState<AutomationItem | null>(null);
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with global header filter if supplied
  useEffect(() => {
    if (selectedMarketplaceFilter && selectedMarketplaceFilter !== selectedMarketplace) {
      setSelectedMarketplace(selectedMarketplaceFilter);
    }
  }, [selectedMarketplaceFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered automations
  const filteredAutomations = useMemo(() => {
    return automations.filter(item => {
      // Tab filter
      if (activeTab === 'Active' && item.status !== 'Running') return false;
      if (activeTab === 'Scheduled' && item.status !== 'Scheduled') return false;
      if (activeTab === 'Paused' && item.status !== 'Paused') return false;
      if (activeTab === 'Completed' && item.status !== 'Completed') return false;
      if (activeTab === 'Failed' && item.status !== 'Failed') return false;

      // Marketplace dropdown filter
      if (selectedMarketplace !== 'All Marketplaces') {
        const mpLower = selectedMarketplace.toLowerCase();
        if (!item.marketplaces.some(m => m.toLowerCase().includes(mpLower))) return false;
      }

      // Type dropdown filter
      if (selectedType !== 'All Automation Types') {
        if (item.type !== selectedType) return false;
      }

      // Status dropdown filter
      if (selectedStatus !== 'All Statuses') {
        if (item.status !== selectedStatus) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesType = item.type.toLowerCase().includes(q);
        const matchesMarketplace = item.marketplaces.some(m => m.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesType && !matchesMarketplace) return false;
      }

      return true;
    });
  }, [automations, activeTab, selectedMarketplace, selectedType, selectedStatus, searchQuery]);

  // Paginated automations
  const paginatedAutomations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAutomations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAutomations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAutomations.length / itemsPerPage) || 1;

  // Toggle status (Pause / Resume)
  const handleToggleStatus = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = automations.find(item => item.id === id);
    if (!current) return;
    const enabled = !current.enabled;
    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/${id}/enabled?enabled=${enabled}`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`Automation update failed (${res.status})`);
      const data = await res.json();
      setAutomations(prev => prev.map(item => item.id === id ? { ...item, enabled: Boolean(data.enabled), status: data.enabled ? 'Running' : 'Paused' } : item));
      showToast(`Automation "${current.name}" is now ${enabled ? 'running' : 'paused'}.`);
    } catch (e) { showToast(e instanceof Error ? e.message : 'Automation update failed'); }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedRows.length === paginatedAutomations.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedAutomations.map(a => a.id));
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleBulkEnable = () => {
    if (selectedRows.length === 0) return;
    setAutomations(prev =>
      prev.map(item =>
        selectedRows.includes(item.id)
          ? { ...item, enabled: true, status: 'Running' }
          : item
      )
    );
    showToast(`Enabled ${selectedRows.length} automations.`);
    setSelectedRows([]);
  };

  const handleBulkPause = () => {
    if (selectedRows.length === 0) return;
    setAutomations(prev =>
      prev.map(item =>
        selectedRows.includes(item.id)
          ? { ...item, enabled: false, status: 'Paused' }
          : item
      )
    );
    showToast(`Paused ${selectedRows.length} automations.`);
    setSelectedRows([]);
  };
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;
    setAutomations(prev => prev.filter(item => !selectedRows.includes(item.id)));
    showToast(`Deleted ${selectedRows.length} automations.`);
    setSelectedRows([]);
  };

  // Metric counts dynamically calculated
  const totalCount = automations.length;
  const activeCount = automations.filter(a => a.status === 'Running').length;
  const scheduledCount = automations.filter(a => a.status === 'Scheduled').length;
  const completedCount = 186; // Cumulative this month per reference
  const failedCount = 6; // Historical failures requiring attention

  return (
    <div className="flex-1 bg-slate-50/60 min-h-screen flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-5">
        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Automations
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Create, manage and run automation rules to list, manage and grow your business across all marketplaces.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              onClick={() => setIsHelpGuideOpen(true)}
              className="px-3.5 py-2 bg-white border border-indigo-200/90 text-indigo-600 hover:bg-indigo-50/60 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Need Help?</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Automation</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric KPI Cards (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Automations */}
          <div
            onClick={() => setActiveTab('All Automations')}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer relative"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100/60 flex items-center justify-center text-indigo-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Total Automations</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{totalCount}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑</span>
                <span>—</span>
              </div>
            </div>
          </div>

          {/* Active */}
          <div
            onClick={() => setActiveTab('Active')}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600">
                <Play className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Active</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{activeCount}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Running</span>
              </div>
            </div>
          </div>

          {/* Scheduled */}
          <div
            onClick={() => setActiveTab('Scheduled')}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Scheduled</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{scheduledCount}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 mt-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span>Starting soon</span>
              </div>
            </div>
          </div>

          {/* Completed (This Month) */}
          <div
            onClick={() => setActiveTab('Completed')}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Completed (This Month)</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{completedCount}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑</span>
                <span>—</span>
              </div>
            </div>
          </div>

          {/* Failed */}
          <div
            onClick={() => setActiveTab('Failed')}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100/60 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-slate-500">Failed</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{failedCount}</div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                <span>↑</span>
                <span>Needs attention</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Tabs and Date Range Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pt-1">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar text-xs font-semibold">
            {(['All Automations', 'Active', 'Scheduled', 'Paused', 'Completed', 'Failed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`pb-3 whitespace-nowrap transition-colors relative ${
                  activeTab === tab
                    ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Right Date Selector */}
          <div className="flex items-center gap-2 pb-2.5 sm:pb-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRangeText}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </div>
          </div>
        </div>

        {/* 4. Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-0.5">
          {/* Left search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search automations by name, type or marketplace..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
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

          {/* Right dropdowns */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* All Marketplaces */}
            <div className="relative">
              <select
                value={selectedMarketplace}
                onChange={e => {
                  setSelectedMarketplace(e.target.value);
                  if (onSelectMarketplaceFilter) onSelectMarketplaceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200/90 rounded-lg px-3 py-2 pr-7 text-xs font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All Marketplaces">All Marketplaces</option>
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Meesho">Meesho</option>
                <option value="Myntra">Myntra</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* All Automation Types */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={e => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200/90 rounded-lg px-3 py-2 pr-7 text-xs font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All Automation Types">All Automation Types</option>
                <option value="Product Listing">Product Listing</option>
                <option value="Price Update">Price Update</option>
                <option value="Inventory Sync">Inventory Sync</option>
                <option value="Advertising">Advertising</option>
                <option value="Customer Engagement">Customer Engagement</option>
                <option value="Alert">Alert</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* All Statuses */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200/90 rounded-lg px-3 py-2 pr-7 text-xs font-medium text-slate-700 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Running">Running</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
                <option value="Failed">Failed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`px-3 py-2 bg-white border rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors ${
                showMoreFilters ? 'border-indigo-400 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* More Filters Drawer/Bar if expanded */}
        {showMoreFilters && (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center gap-4 text-xs animate-in fade-in">
            <span className="font-bold text-slate-700">Quick Filters:</span>
            <button
              onClick={() => { setSelectedType('Product Listing'); }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
            >
              Only Product Listings
            </button>
            <button
              onClick={() => { setSelectedStatus('Running'); }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
            >
              Only Active Rules
            </button>
            <button
              onClick={() => {
                setSelectedMarketplace('All Marketplaces');
                setSelectedType('All Automation Types');
                setSelectedStatus('All Statuses');
                setSearchQuery('');
              }}
              className="text-indigo-600 font-semibold hover:underline ml-auto"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* 5. Main Automations Table Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedAutomations.length > 0 && selectedRows.length === paginatedAutomations.length}
                      onChange={handleSelectAll}
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 min-w-[200px]">Automation Name</th>
                  <th className="py-3 px-3 min-w-[140px]">Type</th>
                  <th className="py-3 px-3 min-w-[120px]">Marketplaces</th>
                  <th className="py-3 px-3 min-w-[130px]">Schedule</th>
                  <th className="py-3 px-3 min-w-[140px]">Progress</th>
                  <th className="py-3 px-3 min-w-[110px]">Status</th>
                  <th className="py-3 px-3 min-w-[110px]">Last Run</th>
                  <th className="py-3 px-3 min-w-[110px]">Next Run</th>
                  <th className="py-3 px-3 min-w-[90px]">Created By</th>
                  <th className="py-3 px-3 text-right min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAutomations.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Zap className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-slate-700 text-sm">No automations found</span>
                        <span className="text-slate-400 text-xs">Try adjusting your search or active filters</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAutomations.map(auto => {
                    const isSelected = selectedRows.includes(auto.id);
                    return (
                      <tr
                        key={auto.id}
                        onClick={() => setSelectedAutomationDetails(auto)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRowSelect(auto.id)}
                            className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Automation Name & Subtitle */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 tracking-tight text-[13px]">{auto.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{auto.description}</div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-3">
                          {renderTypeBadge(auto.type)}
                        </td>

                        {/* Marketplaces */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {auto.marketplaces.map((m, idx) => {
                              return (
                                <span key={idx}>
                                  {m === 'amazon' && <AmazonBadgeIcon />}
                                  {m === 'flipkart' && <FlipkartBadgeIcon />}
                                  {m === 'meesho' && <MeeshoBadgeIcon />}
                                  {m === 'myntra' && <MyntraBadgeIcon />}
                                </span>
                              );
                            })}
                            {auto.additionalMarketplacesCount && auto.additionalMarketplacesCount > 0 && (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-1 py-0.5 ml-0.5">
                                +{auto.additionalMarketplacesCount}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{auto.scheduleText}</span>
                          </div>
                          {auto.scheduleSubText && (
                            <div className="text-[11px] text-slate-500 mt-0.5 pl-5">
                              {auto.scheduleSubText}
                            </div>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="py-3 px-3">
                          {auto.progress ? (
                            <div className="w-28 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                <span>{auto.progress.current}/{auto.progress.total}</span>
                                <span className="text-slate-400">{auto.progress.percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    auto.progress.percent === 100
                                      ? 'bg-emerald-500'
                                      : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${auto.progress.percent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal pl-2">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {renderStatusBadge(auto.status)}
                        </td>

                        {/* Last Run */}
                        <td className="py-3 px-3">
                          {auto.lastRunDate !== '-' ? (
                            <div>
                              <div className="flex items-center gap-1 text-slate-800 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{auto.lastRunDate}</span>
                              </div>
                              {auto.lastRunTime && (
                                <div className="text-[11px] text-slate-400 pl-4 mt-0.5">
                                  ↑ {auto.lastRunTime}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>

                        {/* Next Run */}
                        <td className="py-3 px-3">
                          {auto.nextRunDate !== '-' ? (
                            <div>
                              <div className="flex items-center gap-1 text-slate-800 font-medium">
                                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>{auto.nextRunDate}</span>
                              </div>
                              {auto.nextRunTime && (
                                <div className="text-[11px] text-slate-400 pl-4 mt-0.5">
                                  {auto.nextRunTime}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>

                        {/* Created By */}
                        <td className="py-3 px-3">
                          <span className="text-slate-600 font-medium">{auto.createdBy}</span>
                        </td>

                        {/* Actions (Toggle Switch + 3 Dots Menu) */}
                        <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={e => handleToggleStatus(auto.id, e)}
                              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                                auto.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                              }`}
                              title={auto.enabled ? 'Click to Pause' : 'Click to Resume'}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                                  auto.enabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            {/* 3 Dots Menu Trigger */}
                            <button
                              onClick={() => setSelectedAutomationDetails(auto)}
                              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Action Toolbar & Pagination */}
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Left Batch Action Controls */}
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-medium text-slate-500">{selectedRows.length} selected</span>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleBulkEnable}
                disabled={selectedRows.length === 0}
                className="px-2.5 py-1 bg-white border border-slate-200/90 rounded-md hover:bg-slate-100 text-slate-700 font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shadow-2xs"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Enable</span>
              </button>
              <button
                onClick={handleBulkPause}
                disabled={selectedRows.length === 0}
                className="px-2.5 py-1 bg-white border border-slate-200/90 rounded-md hover:bg-slate-100 text-slate-700 font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shadow-2xs"
              >
                <PauseCircle className="w-3 h-3 text-amber-600" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedRows.length === 0}
                className="px-2.5 py-1 bg-white border border-slate-200/90 rounded-md hover:bg-rose-50 text-rose-600 font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shadow-2xs"
              >
                <span>Delete</span>
              </button>
            </div>

            {/* Right Pagination Controls */}
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-normal">
                Showing 1 to {paginatedAutomations.length} of {filteredAutomations.length} automations
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${
                    currentPage === 1 ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  1
                </button>
                {totalPages > 1 && (
                  <button
                    onClick={() => setCurrentPage(2)}
                    className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${
                      currentPage === 2 ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    2
                  </button>
                )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <select
                  disabled
                  className="appearance-none bg-white border border-slate-200 rounded-md px-2.5 py-1 pr-6 text-xs text-slate-700 cursor-default"
                >
                  <option>10 / page</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 6. Bottom Helper / Guide Banner */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight">Need help creating an automation?</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Check our guide or watch a quick video to learn how automations work.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              onClick={() => setIsHelpGuideOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>View Guide</span>
            </button>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch Video</span>
            </button>
          </div>
        </div>
      </main>

      {/* ==========================================================
          MODAL 1: Create Automation Flow (6-Step Guided Wizard)
      ========================================================== */}
      {isCreateModalOpen && (
        <CreateAutomationModal
          catalogProductsList={catalogProductsList}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newAuto) => {
            setAutomations(prev => [newAuto, ...prev]);
            setIsCreateModalOpen(false);
            showToast(`Automation "${newAuto.name}" created and scheduled!`);
          }}
        />
      )}

      {/* ==========================================================
          MODAL 2: Execution Progress & Summary Drawer
      ========================================================== */}
      {selectedAutomationDetails && (
        <AutomationSummaryDrawer
          automation={selectedAutomationDetails}
          onClose={() => setSelectedAutomationDetails(null)}
          onToggleStatus={(id) => handleToggleStatus(id)}
          onRunNow={async (id) => {
            try {
              const res = await fetch(`${API_BASE}/api/v1/automations/${id}/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trigger_context: { source: 'ui_manual_run' } }) });
              if (!res.ok) throw new Error(`Automation run failed (${res.status})`);
              const run = await res.json();
              setAutomations(prev => prev.map(item => item.id === id ? { ...item, lastRunDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), lastRunTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), recentLogs: [{ time: 'Just now', message: `Manual run ${run.status}`, type: run.status === 'failed' ? 'error' : 'success' }, ...(item.recentLogs || [])] } : item));
              showToast(`Automation run ${run.status}.`);
            } catch (e) { showToast(e instanceof Error ? e.message : 'Automation run failed'); }
          }}
        />
      )}

      {/* ==========================================================
          MODAL 3: Help & Best Practices Guide
      ========================================================== */}
      {isHelpGuideOpen && (
        <HelpGuideModal onClose={() => setIsHelpGuideOpen(false)} />
      )}

      {/* ==========================================================
          MODAL 4: Video Walkthrough Preview
      ========================================================== */}
      {isVideoModalOpen && (
        <VideoWalkthroughModal onClose={() => setIsVideoModalOpen(false)} />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Helper Renderers for Types & Statuses
// -------------------------------------------------------------
function renderTypeBadge(type: AutomationItem['type']) {
  switch (type) {
    case 'Product Listing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
          <Package className="w-3.5 h-3.5" />
          <span>Product Listing</span>
        </span>
      );
    case 'Price Update':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <Tag className="w-3.5 h-3.5" />
          <span>Price Update</span>
        </span>
      );
    case 'Inventory Sync':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Inventory Sync</span>
        </span>
      );
    case 'Advertising':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Advertising</span>
        </span>
      );
    case 'Customer Engagement':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Customer Engagement</span>
        </span>
      );
    case 'Alert':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-100">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Alert</span>
        </span>
      );
    default:
      return null;
  }
}

function renderStatusBadge(status: AutomationItem['status']) {
  switch (status) {
    case 'Running':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Running</span>
        </span>
      );
    case 'Scheduled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
          <Clock className="w-3 h-3 text-blue-500" />
          <span>Scheduled</span>
        </span>
      );
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>Completed</span>
        </span>
      );
    case 'Paused':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
          <PauseCircle className="w-3 h-3 text-amber-600" />
          <span>Paused</span>
        </span>
      );
    case 'Failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Failed</span>
        </span>
      );
  }
}

// -------------------------------------------------------------
// Component: Create Automation Modal (6 Step Listing Workflow)
// -------------------------------------------------------------
interface CreateAutomationModalProps {
  onClose: () => void;
  onCreated: (item: AutomationItem) => void;
  catalogProductsList?: CatalogProduct[];
}

function CreateAutomationModal({ onClose, onCreated, catalogProductsList = [] }: CreateAutomationModalProps) {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState('New Product Listing Automation');
  const [description, setDescription] = useState('Auto list new catalog products to Amazon & Flipkart');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([1, 2, 3, 6, 7]);
  const [productSelectionMode, setProductSelectionMode] = useState<'specific' | 'rule'>('specific');
  const [targetMarketplaces, setTargetMarketplaces] = useState<('amazon' | 'flipkart' | 'meesho' | 'myntra')[]>(['amazon', 'flipkart']);
  const [scheduleFrequency, setScheduleFrequency] = useState<'Daily' | 'Specific Date' | 'Days of Week' | 'Interval'>('Daily');
  const [timeSlots, setTimeSlots] = useState<string[]>(['10:00 AM', '02:00 PM']);
  const [newTimeSlot, setNewTimeSlot] = useState('06:00 PM');
  const [dailyLimit, setDailyLimit] = useState<number>(50);
  const [batchSize, setBatchSize] = useState<number>(10);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(5);
  const [aiInstructions, setAiInstructions] = useState(
    'Optimize titles with high-search keywords for Diwali and festive rush. Generate 5 bullet points highlighting 18/8 food-grade stainless steel and spill-proof cap. Apply a +5% markup on Amazon to offset marketplace referral fees.'
  );
  const [aiTestingPrompt, setAiTestingPrompt] = useState(false);
  const [aiGeneratedSample, setAiGeneratedSample] = useState<{
    title: string;
    bullets: string[];
    priceMarkup: string;
  } | null>(null);

  // Mandatory Confirmation Checkbox
  const [isMandatoryConfirmed, setIsMandatoryConfirmed] = useState(false);

  // Toggle marketplace
  const toggleMarketplace = (mp: 'amazon' | 'flipkart' | 'meesho' | 'myntra') => {
    if (targetMarketplaces.includes(mp)) {
      if (targetMarketplaces.length > 1) {
        setTargetMarketplaces(targetMarketplaces.filter(m => m !== mp));
      }
    } else {
      setTargetMarketplaces([...targetMarketplaces, mp]);
    }
  };

  // Toggle product selection
  const toggleProductSelect = (id: number) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(p => p !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Add time slot
  const handleAddTimeSlot = () => {
    if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
      setTimeSlots([...timeSlots, newTimeSlot]);
    }
  };

  // Remove time slot
  const handleRemoveTimeSlot = (slot: string) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter(s => s !== slot));
    }
  };

  // Test AI prompt generator
  const handleTestAi = async () => {
    setAiTestingPrompt(true);
    try {
      // Call backend AI agent endpoint
      const res = await fetch(`${API_BASE}/api/v1/personal/ai/seller-agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate optimized marketplace listing content for the selected products. Seller instructions: "${aiInstructions}"`
        })
      });
      const data = await res.json();
      if (data && data.answer) {
        const lines = String(data.answer).split('\n').map((l: string) => l.trim()).filter(Boolean);
        const titleCandidate = lines.find((l: string) => l.length > 20 && !l.startsWith('-') && !l.startsWith('*')) || lines[0] || '';
        const bullets = lines.filter((l: string) => l.startsWith('-') || l.startsWith('*') || l.startsWith('•')).map((l: string) => l.replace(/^[-*•]\s*/, ''));
        setAiGeneratedSample({
          title: titleCandidate.replace(/^["']|["']$/g, ''),
          bullets: bullets.slice(0, 3),
          priceMarkup: ''
        });
      } else {
        setAiGeneratedSample({ title: '', bullets: [], priceMarkup: '' });
      }
    } catch {
      // Fallback
      setAiGeneratedSample({ title: '', bullets: [], priceMarkup: '' });
    } finally {
      setAiTestingPrompt(false);
    }
  };

  // Submit
  const handleComplete = async () => {
    if (!isMandatoryConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          trigger_type: 'schedule',
          trigger_config: { interval_minutes: 1440, time_slots: timeSlots },
          conditions: [{ type: productSelectionMode, product_ids: selectedProductIds, marketplaces: targetMarketplaces, min_stock_threshold: minStockThreshold }],
          actions: [{ type: 'agent', agent: 'listing_automation', prompt: aiInstructions, daily_limit: dailyLimit, batch_size: batchSize }],
          enabled: true
        })
      });
      if (!res.ok) throw new Error(`Automation creation failed (${res.status})`);
      const created = await res.json();
      const newAutomation: AutomationItem = {
        id: String(created.id), name: created.name || name, description: created.description || description,
        type: 'Product Listing', marketplaces: targetMarketplaces, scheduleType: scheduleFrequency,
        scheduleText: scheduleFrequency === 'Daily' ? 'Daily' : 'Scheduled', scheduleSubText: timeSlots[0] || '10:00 AM',
        progress: { current: 0, total: selectedProductIds.length, percent: 0 },
        status: created.enabled ? 'Running' : 'Paused', lastRunDate: '-', lastRunTime: '',
        nextRunDate: 'Scheduled', nextRunTime: timeSlots[0] || '10:00 AM', createdBy: '', enabled: Boolean(created.enabled),
        dailyLimit, batchSize, selectedProductsCount: selectedProductIds.length, aiPrompt: aiInstructions,
        recentLogs: [{ time: 'Just now', message: 'Automation created in backend.', type: 'success' }]
      };
      onCreated(newAutomation);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Zap className="w-4 h-4 fill-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Create Listing Automation</h2>
              <p className="text-xs text-slate-500">Configure automated product selection, scheduling, and AI listing rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Header */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs font-semibold overflow-x-auto">
          {[
            { num: 1, label: 'Products' },
            { num: 2, label: 'Marketplaces' },
            { num: 3, label: 'Schedule' },
            { num: 4, label: 'Daily Limits' },
            { num: 5, label: 'AI Rules' },
            { num: 6, label: 'Preview & Confirm' }
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => s.num < step && setStep(s.num)}
              className={`flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                step === s.num
                  ? 'text-indigo-600 font-bold'
                  : step > s.num
                  ? 'text-emerald-600 font-medium'
                  : 'text-slate-400 font-normal'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  step === s.num
                    ? 'bg-indigo-600 text-white font-bold'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-3 h-3" /> : s.num}
              </div>
              <span>{s.label}</span>
              {s.num < 6 && <span className="text-slate-300 ml-2">›</span>}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* Step 1: Product Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Automation Title & Purpose</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Daily 50 Listings"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Product Selection Method</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProductSelectionMode('specific')}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                        productSelectionMode === 'specific'
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Select Specific SKUs ({selectedProductIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductSelectionMode('rule')}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                        productSelectionMode === 'rule'
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Rule-based Selection
                    </button>
                  </div>
                </div>

                {productSelectionMode === 'specific' ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
                      <span>Choose catalog products to list:</span>
                      <button
                        onClick={() => {
                          if (selectedProductIds.length === catalogProductsList.length) {
                            setSelectedProductIds([]);
                          } else {
                            setSelectedProductIds(catalogProductsList.map((p: CatalogProduct) => p.id));
                          }
                        }}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        {selectedProductIds.length === catalogProductsList.length ? 'Deselect All' : 'Select All (10)'}
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {catalogProductsList.map((product: CatalogProduct) => {
                        const isChecked = selectedProductIds.includes(product.id);
                        return (
                          <div
                            key={product.id}
                            onClick={() => toggleProductSelect(product.id)}
                            className={`p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                              isChecked ? 'bg-indigo-50/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{product.name}</div>
                                <div className="text-[11px] text-slate-400">SKU: {product.sku} • {product.category}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900">₹{product.price}</div>
                              <div className="text-[11px] text-slate-500">{product.stock} units available</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 text-xs">
                    <div className="font-bold text-slate-800">Dynamic Rule Filters:</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="font-semibold text-slate-800">Target Unlisted Items</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">Automatically select products not yet published on target marketplace</div>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="font-semibold text-slate-800">High Stock Items Only</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">Filter for catalog products with &gt; 25 units available</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Marketplace Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Target Marketplaces</label>
                <p className="text-xs text-slate-500 mt-0.5">Select the connected selling accounts to deploy listings to</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'amazon' as const, name: 'Amazon India', icon: <AmazonBadgeIcon className="w-6 h-6" />, category: 'Home & Kitchen › Drinkware', status: 'Connected' },
                  { id: 'flipkart' as const, name: 'Flipkart', icon: <FlipkartBadgeIcon className="w-6 h-6" />, category: 'Flasks & Bottles', status: 'Connected' },
                  { id: 'meesho' as const, name: 'Meesho', icon: <MeeshoBadgeIcon className="w-6 h-6" />, category: 'Kitchenware & Utensils', status: 'Connected' },
                  { id: 'myntra' as const, name: 'Myntra', icon: <MyntraBadgeIcon className="w-6 h-6" />, category: 'Accessories & Lifestyle', status: 'Connected' },
                ].map((mp) => {
                  const isSelected = targetMarketplaces.includes(mp.id);
                  return (
                    <div
                      key={mp.id}
                      onClick={() => toggleMarketplace(mp.id)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {mp.icon}
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{mp.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{mp.category}</div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{mp.status}</span>
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Scheduling & Time Slots */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Execution Frequency</label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {(['Daily', 'Specific Date', 'Days of Week', 'Interval'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setScheduleFrequency(freq)}
                      className={`p-2.5 rounded-lg border font-semibold text-center transition-all ${
                        scheduleFrequency === freq
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Configured Time Slots</label>
                <p className="text-slate-500 text-[11px] mt-0.5">Automations will trigger batch listing dispatches at these specific times:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {timeSlots.map((slot) => (
                    <span
                      key={slot}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-bold flex items-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot}</span>
                      <button
                        onClick={() => handleRemoveTimeSlot(slot)}
                        className="text-indigo-400 hover:text-indigo-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={e => setNewTimeSlot(e.target.value)}
                    placeholder="e.g. 06:00 PM"
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-36"
                  />
                  <button
                    type="button"
                    onClick={handleAddTimeSlot}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    + Add Time Slot
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Daily Listing Limits & Guardrails */}
          {step === 4 && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Daily Listing Limit (Throttle Cap)</label>
                <p className="text-slate-500 text-[11px]">Limits the maximum number of new listings pushed per 24-hour cycle to avoid marketplace rate limiting.</p>
                <div className="flex items-center gap-3 mt-2">
                  {[25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDailyLimit(val)}
                      className={`px-3.5 py-1.5 rounded-lg border font-bold ${
                        dailyLimit === val
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {val} listings/day
                    </button>
                  ))}
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={e => setDailyLimit(Number(e.target.value))}
                    className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                  <label className="font-bold text-slate-800">Batch Size per Dispatch</label>
                  <input
                    type="number"
                    value={batchSize}
                    onChange={e => setBatchSize(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold mt-1"
                  />
                  <div className="text-[11px] text-slate-400">Products pushed per execution trigger</div>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                  <label className="font-bold text-slate-800">Inventory Safety Threshold</label>
                  <input
                    type="number"
                    value={minStockThreshold}
                    onChange={e => setMinStockThreshold(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold mt-1"
                  />
                  <div className="text-[11px] text-slate-400">Skip products with stock below this level</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: AI Instructions */}
          {step === 5 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">AI Prompt & Optimization Directives</label>
                <p className="text-slate-500 text-[11px] mt-0.5">SellerHub AI will formulate titles, 5 bullet points, and backend search terms based on these rules:</p>
                <textarea
                  rows={4}
                  value={aiInstructions}
                  onChange={e => setAiInstructions(e.target.value)}
                  className="w-full mt-2 p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Test how the AI interprets your prompt on the selected products</span>
                <button
                  type="button"
                  onClick={handleTestAi}
                  disabled={aiTestingPrompt}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiTestingPrompt ? 'Generating Sample...' : 'Generate AI Preview'}</span>
                </button>
              </div>

              {aiGeneratedSample && (
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2 animate-in fade-in">
                  <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Generated Preview:</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100 space-y-1.5">
                    <div className="font-bold text-slate-900 text-[12px]">{aiGeneratedSample.title}</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                      {aiGeneratedSample.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                    <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                      Pricing Adjustment: {aiGeneratedSample.priceMarkup}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Preview & Mandatory Confirmation */}
          {step === 6 && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{name}</div>
                    <div className="text-slate-500 text-[11px]">{description}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                    Ready to Activate
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Products</span>
                    <span className="font-bold text-slate-900">{selectedProductIds.length} Selected</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Marketplaces</span>
                    <span className="font-bold text-slate-900 capitalize">{targetMarketplaces.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Schedule</span>
                    <span className="font-bold text-slate-900">{scheduleFrequency} ({timeSlots[0]})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Daily Limit</span>
                    <span className="font-bold text-slate-900">{dailyLimit} listings/day</span>
                  </div>
                </div>
              </div>

              {/* MANDATORY CONFIRMATION BOX */}
              <div className={`p-4 rounded-xl border transition-all ${
                isMandatoryConfirmed
                  ? 'bg-emerald-50/40 border-emerald-200 ring-1 ring-emerald-500/20'
                  : 'bg-amber-50/50 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    id="mandatory-confirmation-checkbox"
                    type="checkbox"
                    checked={isMandatoryConfirmed}
                    onChange={e => setIsMandatoryConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded-sm border-amber-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="mandatory-confirmation-checkbox" className="text-xs text-slate-800 cursor-pointer select-none">
                    <span className="font-bold block text-slate-900">
                      Mandatory Confirmation & Authorization Required
                    </span>
                    <span className="text-slate-600 block mt-1 leading-relaxed">
                      I confirm that I have reviewed the daily listing limit of <strong>{dailyLimit} listings/day</strong>,
                      the target marketplace channels (<strong>{targetMarketplaces.join(', ')}</strong>), and compliance rules.
                      I authorize SellerHub to execute automated catalog publishing on my connected seller accounts.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else onClose();
            }}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2">
            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={!isMandatoryConfirmed}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Activate Automation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: Automation Summary & Execution Progress Drawer
// -------------------------------------------------------------
interface AutomationSummaryDrawerProps {
  automation: AutomationItem;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onRunNow: (id: string) => void;
}

function AutomationSummaryDrawer({
  automation,
  onClose,
  onToggleStatus,
  onRunNow
}: AutomationSummaryDrawerProps) {
  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600">Automation Rule</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">#{automation.id}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">{automation.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {/* Status and Action Buttons */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Execution Status</div>
              <div className="mt-1">{renderStatusBadge(automation.status)}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStatus(automation.id)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs ${
                  automation.enabled
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {automation.enabled ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                <span>{automation.enabled ? 'Pause' : 'Resume'}</span>
              </button>

              {automation.progress && (
                <button
                  onClick={() => onRunNow(automation.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Batch Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Tracker if applicable */}
          {automation.progress && (
            <div className="space-y-2 p-4 border border-slate-200 rounded-xl bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Daily Execution Progress</span>
                <span className="font-bold text-indigo-600">{automation.progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    automation.progress.percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${automation.progress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
                <span>{automation.progress.current} of {automation.progress.total} products listed</span>
                <span>Limit: {automation.dailyLimit || 50}/day</span>
              </div>
            </div>
          )}

          {/* Configuration Summary Details */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900">Automation Parameters</div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 text-[11px]">Type</div>
                <div className="font-bold text-slate-900 mt-0.5">{automation.type}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 text-[11px]">Schedule Frequency</div>
                <div className="font-bold text-slate-900 mt-0.5">{automation.scheduleText}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 text-[11px]">Last Run</div>
                <div className="font-bold text-slate-900 mt-0.5">{automation.lastRunDate} {automation.lastRunTime}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 text-[11px]">Next Scheduled Run</div>
                <div className="font-bold text-slate-900 mt-0.5">{automation.nextRunDate} {automation.nextRunTime}</div>
              </div>
            </div>
          </div>

          {/* Marketplaces */}
          <div className="space-y-2">
            <div className="font-bold text-slate-900">Connected Channels</div>
            <div className="flex items-center gap-2">
              {automation.marketplaces.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 capitalize">
                  {m === 'amazon' && <AmazonBadgeIcon />}
                  {m === 'flipkart' && <FlipkartBadgeIcon />}
                  {m === 'meesho' && <MeeshoBadgeIcon />}
                  {m === 'myntra' && <MyntraBadgeIcon />}
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Instructions */}
          {automation.aiPrompt && (
            <div className="space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Listing Directive</span>
              </div>
              <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-slate-700 leading-relaxed">
                {automation.aiPrompt}
              </div>
            </div>
          )}

          {/* Execution Log */}
          <div className="space-y-2">
            <div className="font-bold text-slate-900">Recent Automation Logs</div>
            <div className="space-y-2">
              {automation.recentLogs && automation.recentLogs.length > 0 ? (
                automation.recentLogs.map((log, index) => (
                  <div key={index} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start gap-2.5">
                    {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                    {log.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />}
                    {log.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                    {log.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <div className="text-slate-800 font-medium">{log.message}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                  No execution logs recorded yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg"
          >
            Close
          </button>
          <button
            onClick={() => onToggleStatus(automation.id)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg"
          >
            {automation.enabled ? 'Pause Rule' : 'Activate Rule'}
          </button>
        </div>
    </aside>
  );
}

// -------------------------------------------------------------
// Component: Help Guide Modal
// -------------------------------------------------------------
function HelpGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Listing Automation Best Practices</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <span className="font-bold text-indigo-900 block mb-1">1. Daily Listing Limits:</span>
            Keep new product listing throttle caps at 50/day on Amazon India and 30/day on Flipkart to maintain high seller trust ratings and prevent duplicate suppressions.
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 block mb-1">2. Staggered Dispatch Windows:</span>
            Schedule listings in multiple time windows (e.g. 10:00 AM & 02:00 PM) rather than a single large blast to maximize indexing speed across marketplace search crawlers.
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 block mb-1">3. Mandatory Review Step:</span>
            Every automation rule requires explicit authorization and lets you pause or resume executions at any second without losing draft state.
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: Video Walkthrough Preview Modal
// -------------------------------------------------------------
function VideoWalkthroughModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
            <span>Automations Walkthrough Video</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="w-full h-56 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden group">
            <div className="w-14 h-14 rounded-full bg-indigo-600/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform cursor-pointer">
              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
            </div>
            <div className="text-xs text-slate-300 font-medium mt-3">
              Learn: Automated Product Listing, Daily Limits & Channel Mapping (3:45)
            </div>
          </div>
          <p className="text-xs text-slate-500">
            This quick video explains how to connect catalog items, configure AI title prompts, and monitor batch executions in real time.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
}
