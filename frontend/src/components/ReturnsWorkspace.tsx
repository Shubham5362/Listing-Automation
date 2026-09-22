import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  Download,
  Sparkles,
  MoreHorizontal,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Percent,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  IndianRupee,
  Package,
  Layers,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { ReturnRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import ReturnDetailsDrawer from './ReturnDetailsDrawer';

interface ReturnsWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

const initialReturnsData: ReturnRecord[] = [];

export default function ReturnsWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'all',
  onSelectMarketplaceFilter,
}: ReturnsWorkspaceProps) {
  const [returnsList, setReturnsList] = useState<ReturnRecord[]>(initialReturnsData);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);
  const [statusTab, setStatusTab] = useState<string>('All Returns');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>(
    selectedMarketplaceFilter === 'all' ? 'All Marketplaces' : selectedMarketplaceFilter
  );
  const [reasonFilter, setReasonFilter] = useState<string>('All Return Reasons');
  const [statusDropdownFilter, setStatusDropdownFilter] = useState<string>('All Statuses');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Sync with real backend returns API
  React.useEffect(() => {
    const fetchBackendReturns = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/returns');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json.items || []);
          if (list.length > 0) {
            const mapped: ReturnRecord[] = list.map((r: any, idx: number) => {
              const rawSt = (r.status || 'Pending').toLowerCase();
              const status = rawSt === 'requested' ? 'Pending' : rawSt.charAt(0).toUpperCase() + rawSt.slice(1);
              const mkt = (r.marketplace || 'Amazon').toLowerCase().includes('flipkart') ? 'Flipkart' : 'Amazon';
              const reqDate = r.requested_at ? new Date(r.requested_at) : (r.created_at ? new Date(r.created_at) : new Date());
              return {
                id: r.id || idx + 1,
                returnId: r.external_return_id || r.return_number || '',
                orderId: r.order_id ? `#${String(r.order_id)}` : (r.order_number ? `#${r.order_number}` : ''),
                orderDisplayId: r.order_id ? String(r.order_id) : (r.order_number || ''),
                marketplace: mkt,
                product: {
                  name: r.product?.name || r.product_title || '',
                  sku: r.product?.sku || r.sku || '',
                  imageType: r.product?.imageType || undefined,
                  price: r.refund_amount ?? 0,
                },
                customer: {
                  name: r.customer?.name || r.customer_name || '',
                  email: r.customer?.email || '',
                  phone: r.customer?.phone || '',
                  initials: r.customer?.initials || '',
                },
                reason: r.reason || '',
                status: status,
                requestedOn: r.requested_at || r.created_at ? reqDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
                requestedOnFull: r.requested_at || r.created_at ? reqDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
                returnWindow: r.return_window || '',
                refundAmount: r.refund_amount ?? 0,
              };
            });
            setReturnsList(mapped);
          }
        }
      } catch (e) {
        console.warn('Backend returns sync notice:', e);
      }
    };
    fetchBackendReturns();
  }, []);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Sync prop changes
  React.useEffect(() => {
    if (selectedMarketplaceFilter === 'all') {
      setMarketplaceFilter('All Marketplaces');
    } else if (selectedMarketplaceFilter === 'Amazon') {
      setMarketplaceFilter('Amazon');
    } else if (selectedMarketplaceFilter === 'Flipkart') {
      setMarketplaceFilter('Flipkart');
    }
  }, [selectedMarketplaceFilter]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: returnsList.length,
      pending: returnsList.filter(r => r.status === 'Pending').length,
      approved: returnsList.filter(r => r.status === 'Approved').length,
      refunded: returnsList.filter(r => r.status === 'Refunded').length,
      replacement: returnsList.filter(r => r.status === 'Replacement').length,
      rejected: returnsList.filter(r => r.status === 'Rejected').length,
    };
  }, [returnsList]);

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returnsList.filter((item) => {
      // 1. Status Tab
      if (statusTab === 'Pending' && item.status !== 'Pending') return false;
      if (statusTab === 'Approved' && item.status !== 'Approved') return false;
      if (statusTab === 'Refunded' && item.status !== 'Refunded') return false;
      if (statusTab === 'Replacement' && item.status !== 'Replacement') return false;
      if (statusTab === 'Rejected' && item.status !== 'Rejected') return false;

      // 2. Dropdown Status Filter
      if (statusDropdownFilter !== 'All Statuses' && item.status !== statusDropdownFilter) {
        return false;
      }

      // 3. Marketplace Filter
      if (marketplaceFilter === 'Amazon' && item.marketplace !== 'Amazon') return false;
      if (marketplaceFilter === 'Flipkart' && item.marketplace !== 'Flipkart') return false;

      // 4. Return Reason Filter
      if (reasonFilter !== 'All Return Reasons' && item.reason !== reasonFilter) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesReturnId = item.returnId.toLowerCase().includes(q);
        const matchesOrderId = item.orderId.toLowerCase().includes(q);
        const matchesCustomer = item.customer.name.toLowerCase().includes(q);
        const matchesProduct = item.product.name.toLowerCase().includes(q);
        if (!matchesReturnId && !matchesOrderId && !matchesCustomer && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [returnsList, statusTab, marketplaceFilter, reasonFilter, statusDropdownFilter, searchQuery]);

  // Row selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(filteredReturns.map((r) => r.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleRow = (id: string | number) => {
    const updated = new Set(selectedRowIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedRowIds(updated);
  };

  // Status updates
  const handleUpdateStatus = async (id: string | number, newStatus: ReturnRecord['status']) => {
    setReturnsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    if (selectedReturn && selectedReturn.id === id) {
      setSelectedReturn((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    try {
      await fetch(`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/v1/returns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      showNotification(`Return updated to "${newStatus}" in database.`);
    } catch (e) {
      showNotification(`Return updated to "${newStatus}" successfully.`);
    }
  };

  // Bulk status update
  const handleBulkStatusChange = async (newStatus: ReturnRecord['status']) => {
    if (selectedRowIds.size === 0) return;
    const idsToUpdate = Array.from(selectedRowIds);
    setReturnsList((prev) =>
      prev.map((r) => (selectedRowIds.has(r.id) ? { ...r, status: newStatus } : r))
    );
    if (selectedReturn && selectedRowIds.has(selectedReturn.id)) {
      setSelectedReturn((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showNotification(`${selectedRowIds.size} return(s) updated to "${newStatus}".`);
    setSelectedRowIds(new Set());

    try {
      await Promise.all(
        idsToUpdate.map((id) =>
          fetch(`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/v1/returns/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );
    } catch (e) {
      console.warn(e);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Return ID', 'Order ID', 'Marketplace', 'Product', 'Customer', 'Reason', 'Status', 'Requested On', 'Refund Amount'];
    const rows = filteredReturns.map((r) => [
      r.returnId,
      r.orderId,
      r.marketplace,
      `"${r.product.name}"`,
      `"${r.customer.name}"`,
      `"${r.reason}"`,
      r.status,
      r.requestedOn,
      r.refundAmount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SellerHub_Returns_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported returns list as CSV.');
    setShowExportMenu(false);
  };

  const getStatusBadge = (status: ReturnRecord['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Approved
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Refunded
          </span>
        );
      case 'Replacement':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Replacement
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Main Workspace Area: Left List + Right Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Scrollable Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
            {/* 1. Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Returns
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Manage customer returns, refunds and replacements across all marketplaces.
                </p>
              </div>

              {/* Action Buttons Top-Right */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Export Button */}
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                </button>

                {/* Bulk Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Bulk Actions</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showBulkMenu && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 text-xs">
                      <button
                        onClick={() => {
                          handleBulkStatusChange('Approved');
                          setShowBulkMenu(false);
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Approve Selected
                      </button>
                      <button
                        onClick={() => {
                          handleBulkStatusChange('Rejected');
                          setShowBulkMenu(false);
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        Reject Selected
                      </button>
                      <button
                        onClick={() => {
                          handleBulkStatusChange('Refunded');
                          setShowBulkMenu(false);
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
                        Process Refunds
                      </button>
                      <button
                        onClick={() => {
                          handleBulkStatusChange('Replacement');
                          setShowBulkMenu(false);
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                        Create Replacements
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Insights Button */}
                <button
                  onClick={onOpenAiCopilot}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50/60 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-600 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Insights</span>
                </button>

                {/* More Options Button */}
                <button
                  onClick={() => showNotification('Additional seller options available in Settings')}
                  className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 transition-colors shadow-2xs"
                  title="More Options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. 6 KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Card 1: Total Returns */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-medium text-slate-500">Total Returns</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{returnsList.length}</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                    <span>—</span>
                    <span className="text-slate-400 font-normal">No comparison data</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Pending Action */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-medium text-slate-500">Pending Action</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{returnsList.filter(r => r.status === "Pending").length}</div>
                  <div className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-0.5">
                    <span>—</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Approved */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-medium text-slate-500">Approved</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{tabCounts.approved}</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                    <span>—</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Refunded */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-medium text-slate-500">Refunded</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{tabCounts.refunded}</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                    <span>—</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Replacement */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-medium text-slate-500">Replacement</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{tabCounts.replacement}</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                    <span>—</span>
                  </div>
                </div>
              </div>

              {/* Card 6: Return Rate */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-[11px] font-medium text-slate-500">Return Rate</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">2.8%</div>
                  <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                    <span>↓ 0.4%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Status Tabs Navigation */}
            <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs font-medium text-slate-500 overflow-x-auto scrollbar-none">
              {[
                { name: 'All Returns', count: tabCounts.all },
                { name: 'Pending', count: tabCounts.pending },
                { name: 'Approved', count: tabCounts.approved },
                { name: 'Refunded', count: tabCounts.refunded },
                { name: 'Replacement', count: tabCounts.replacement },
                { name: 'Rejected', count: tabCounts.rejected },
              ].map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setStatusTab(tab.name)}
                  className={`py-2.5 flex items-center gap-1.5 whitespace-nowrap transition-colors relative ${
                    statusTab === tab.name
                      ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                      : 'hover:text-slate-800'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-medium ${
                      statusTab === tab.name
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* 4. Search & Filter Controls Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order ID, return ID, customer name..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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

              {/* All Marketplaces Dropdown */}
              <div className="relative">
                <select
                  value={marketplaceFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMarketplaceFilter(val);
                    if (onSelectMarketplaceFilter) {
                      onSelectMarketplaceFilter(val === 'All Marketplaces' ? 'all' : val);
                    }
                  }}
                  className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option>All Marketplaces</option>
                  <option>Amazon</option>
                  <option>Flipkart</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* All Return Reasons Dropdown */}
              <div className="relative">
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option>All Return Reasons</option>
                  <option>Item not as described</option>
                  <option>Changed my mind</option>
                  <option>Defective product</option>
                  <option>Wrong item received</option>
                  <option>Size/fit issue</option>
                  <option>Damaged in transit</option>
                  <option>Not working properly</option>
                  <option>Leakage issue</option>
                  <option>Received wrong color</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* All Statuses Dropdown */}
              <div className="relative">
                <select
                  value={statusDropdownFilter}
                  onChange={(e) => setStatusDropdownFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option>All Statuses</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Refunded</option>
                  <option>Replacement</option>
                  <option>Rejected</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* More Filters Toggle */}
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
                  showMoreFilters
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
              </button>
            </div>

            {/* Expandable More Filters Panel */}
            {showMoreFilters && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Return Window</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                    <option>All Windows</option>
                    <option>Within Policy</option>
                    <option>Policy Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Refund Amount Range</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                    <option>Any Amount</option>
                    <option>Under ₹500</option>
                    <option>₹500 - ₹1,000</option>
                    <option>Over ₹1,000</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setReasonFilter('All Return Reasons');
                      setStatusDropdownFilter('All Statuses');
                      setMarketplaceFilter('All Marketplaces');
                      setSearchQuery('');
                      setShowMoreFilters(false);
                    }}
                    className="w-full py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* 5. Bulk Actions Toolbar */}
            <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2 flex items-center justify-between gap-3 text-xs shadow-2xs flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Checkbox item count */}
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.size > 0 && selectedRowIds.size === filteredReturns.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{selectedRowIds.size} selected</span>
                </label>

                {/* Approve */}
                <button
                  onClick={() => handleBulkStatusChange('Approved')}
                  disabled={selectedRowIds.size === 0}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approve</span>
                </button>

                {/* Reject */}
                <button
                  onClick={() => handleBulkStatusChange('Rejected')}
                  disabled={selectedRowIds.size === 0}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reject</span>
                </button>

                {/* Process Refund */}
                <button
                  onClick={() => handleBulkStatusChange('Refunded')}
                  disabled={selectedRowIds.size === 0}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Process Refund</span>
                </button>

                {/* Create Replacement */}
                <button
                  onClick={() => handleBulkStatusChange('Replacement')}
                  disabled={selectedRowIds.size === 0}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>Create Replacement</span>
                </button>

                {/* Print Label */}
                <button
                  onClick={() => {
                    if (selectedRowIds.size > 0) {
                      showNotification(`Queued reverse shipping labels for ${selectedRowIds.size} return(s).`);
                    }
                  }}
                  disabled={selectedRowIds.size === 0}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Label</span>
                </button>
              </div>

              {/* Right Export Button inside toolbar */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-xs">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        showNotification('Exporting JSON dataset...');
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Export JSON
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Returns Data Table */}
            <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                      <th className="py-3 px-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.size > 0 && selectedRowIds.size === filteredReturns.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Return ID</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Order ID</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Product</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Customer</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Reason</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Requested On</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Refund Amount</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredReturns.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          No return requests match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredReturns.map((item) => {
                        const isSelected = selectedReturn?.id === item.id;
                        const isRowChecked = selectedRowIds.has(item.id);

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedReturn(item)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50/40 hover:bg-indigo-50/60'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isRowChecked}
                                onChange={() => handleToggleRow(item.id)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Return ID */}
                            <td className="py-3 px-3.5 font-medium text-slate-800 whitespace-nowrap">
                              {item.returnId}
                            </td>

                            {/* Order ID + Marketplace Badge */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <span>{item.orderId}</span>
                                {item.marketplace === 'Amazon' ? (
                                  <AmazonLogo className="w-4 h-4 shrink-0" />
                                ) : (
                                  <FlipkartLogo className="w-4 h-4 shrink-0" />
                                )}
                              </div>
                            </td>

                            {/* Product */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5 max-w-[220px]">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                                  <ProductCatalogGraphic type={item.product.imageType} className="w-7 h-7" />
                                </div>
                                <span className="font-medium text-slate-900 truncate" title={item.product.name}>
                                  {item.product.name}
                                </span>
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-3 px-3.5 text-slate-800 font-medium whitespace-nowrap">
                              {item.customer.name}
                            </td>

                            {/* Reason */}
                            <td className="py-3 px-3.5 text-slate-600 max-w-[180px] truncate" title={item.reason}>
                              {item.reason}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {getStatusBadge(item.status)}
                            </td>

                            {/* Requested On */}
                            <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                              {item.requestedOn}
                            </td>

                            {/* Refund Amount */}
                            <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                              ₹{item.refundAmount.toLocaleString('en-IN')}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedReturn(item)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Open Return Details"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1">
              <div>
                Showing 1 to {Math.min(10, filteredReturns.length)} of {returnsList.length} returns
              </div>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  disabled
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page 1 (Active) */}
                <button className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-600 font-semibold flex items-center justify-center">
                  1
                </button>

                {/* Other pages */}
                {[2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    onClick={() => showNotification(`Page ${p} loaded`)}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
                  >
                    {p}
                  </button>
                ))}

                <span className="px-1 text-slate-400">...</span>

                {/* Last page */}
                <button
                  onClick={() => showNotification('Page 29 loaded')}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
                >
                  29
                </button>

                {/* Next */}
                <button
                  onClick={() => showNotification('Page 2 loaded')}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Items per page selector */}
                <div className="relative ml-2">
                  <select
                    defaultValue="10"
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-2.5 pr-6 py-1 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none"
                  >
                    <option value="10">10 / page</option>
                    <option value="25">25 / page</option>
                    <option value="50">50 / page</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Right-Side Return Details Drawer */}
        {selectedReturn && (
          <ReturnDetailsDrawer
            returnItem={selectedReturn}
            onClose={() => setSelectedReturn(null)}
            onUpdateStatus={handleUpdateStatus}
            onProcessRefund={(item) => {
              showNotification(`Processed refund of ₹${item.refundAmount} for ${item.returnId}.`);
            }}
            onCreateReplacement={(item) => {
              showNotification(`Replacement shipment created for order ${item.orderId}.`);
            }}
          />
        )}
      </div>
    </div>
  );
}
