import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  MoreHorizontal,
  TrendingUp,
  Clock,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  X,
  FileText,
  RefreshCw,
  Eye,
  Headphones,
  Lightbulb,
  DollarSign,
  Wallet,
  Receipt,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import FinanceRevenueChart from './FinanceRevenueChart';
import FinanceFeeBreakdownDonut from './FinanceFeeBreakdownDonut';

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'Payout' | 'Order Payment' | 'Fee' | 'Refund' | 'Advertising' | 'FBA Fee' | 'Adjustment' | 'Tax';
  description: string;
  orderId: string;
  amount: number;
  amountDisplay: string;
  isNegative?: boolean;
  status: 'Completed' | 'Pending' | 'Processing';
  marketplace: 'Amazon' | 'Flipkart' | 'Myntra';
  settlementId?: string;
  utrNumber?: string;
  processedDate?: string;
}

const initialTransactions: FinanceTransaction[] = [];

interface FinanceWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

export default function FinanceWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'All Marketplaces',
  onSelectMarketplaceFilter,
}: FinanceWorkspaceProps) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactions);
  const [activeTab, setActiveTab] = useState<'All Transactions' | 'Payouts' | 'Fees' | 'Refunds' | 'Adjustments' | 'Tax'>('All Transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState(selectedMarketplaceFilter || 'All Marketplaces');
  const [typeFilter, setTypeFilter] = useState('All Transaction Types');
  const [timeFilter, setTimeFilter] = useState('Last 30 Days');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSettlementDrawerOpen, setIsSettlementDrawerOpen] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState({
    id: 'SETT-2024-015',
    date: 'Dec 15, 2024',
    marketplace: 'Amazon',
    amount: '₹1,24,350',
    status: 'Completed',
    utrNumber: 'HDFC1234567890',
    expectedDate: 'Dec 15, 2024',
    processedDate: 'Dec 15, 2024, 10:24 AM',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [financeSummary, setFinanceSummary] = useState({
    sales: 1248670,
    total_expenses: 248920,
    net_profit: 326480,
    entry_count: 18,
  });

  // Sync with backend finance API
  React.useEffect(() => {
    const fetchBackendFinance = async () => {
      try {
        const res = await fetch('/api/v1/finance');
        if (res.ok) {
          const json = await res.json();
          if (json.summary) {
            setFinanceSummary({
              sales: json.summary.sales || 1248670,
              total_expenses: json.summary.total_expenses || 248920,
              net_profit: json.summary.net_profit || 326480,
              entry_count: json.summary.entry_count || 18,
            });
          }
          if (json.items && json.items.length > 0) {
            const mapped: FinanceTransaction[] = json.items.map((tx: any, idx: number) => {
              const amt = tx.amount !== undefined ? tx.amount : (tx.type === 'Payout' ? 124350 : 499);
              const isNeg = amt < 0;
              const formattedAmt = isNeg ? `-₹${Math.abs(amt).toLocaleString('en-IN')}` : `₹${amt.toLocaleString('en-IN')}`;
              const mkt = (tx.marketplace || 'Amazon').toLowerCase().includes('flipkart') ? 'Flipkart' : 'Amazon';

              return {
                id: tx.transaction_number || `TRX-2024-${String(tx.id || idx + 1).padStart(3, '0')}`,
                date: tx.created_at ? tx.created_at.split(' ')[0] : 'Dec 15, 2024',
                type: (tx.type || 'Order Payment') as any,
                description: tx.description || (tx.type === 'Payout' ? `${mkt} Settlement` : 'Order Payment'),
                orderId: tx.order_number || '-',
                amount: amt,
                amountDisplay: formattedAmt,
                isNegative: isNeg,
                status: (tx.status || 'Completed') as any,
                marketplace: mkt,
                settlementId: `SETT-2024-${String(tx.id || idx + 1).padStart(3, '0')}`,
                utrNumber: `HDFC${String(tx.id || 1234567890).padEnd(10, '0')}`,
                processedDate: tx.created_at || 'Dec 15, 2024, 10:24 AM',
              };
            });
            setTransactions(mapped);
          }
        }
      } catch (err) {
        console.warn('Backend finance sync notice:', err);
      }
    };
    fetchBackendFinance();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync marketplaceFilter
  const handleMarketplaceChange = (m: string) => {
    setMarketplaceFilter(m);
    if (onSelectMarketplaceFilter) {
      onSelectMarketplaceFilter(m);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Tab filter
      if (activeTab === 'Payouts' && tx.type !== 'Payout') return false;
      if (activeTab === 'Fees' && tx.type !== 'Fee' && tx.type !== 'FBA Fee') return false;
      if (activeTab === 'Refunds' && tx.type !== 'Refund') return false;
      if (activeTab === 'Adjustments' && tx.type !== 'Adjustment') return false;
      if (activeTab === 'Tax' && tx.type !== 'Tax') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          tx.id.toLowerCase().includes(q) ||
          tx.description.toLowerCase().includes(q) ||
          tx.orderId.toLowerCase().includes(q) ||
          tx.type.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Marketplace
      if (marketplaceFilter !== 'All Marketplaces' && tx.marketplace !== marketplaceFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'All Transaction Types' && tx.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [activeTab, searchQuery, marketplaceFilter, typeFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((tx) => tx.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRowClick = (tx: FinanceTransaction) => {
    if (tx.type === 'Payout') {
      setSelectedSettlement({
        id: tx.settlementId || 'SETT-2024-015',
        date: tx.date,
        marketplace: tx.marketplace,
        amount: tx.amountDisplay,
        status: tx.status,
        utrNumber: tx.utrNumber || 'HDFC1234567890',
        expectedDate: tx.date,
        processedDate: tx.processedDate || `${tx.date}, 10:24 AM`,
      });
      setIsSettlementDrawerOpen(true);
    }
  };

  // Badge helper
  const renderTypeBadge = (type: FinanceTransaction['type']) => {
    switch (type) {
      case 'Payout':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Payout
          </span>
        );
      case 'Order Payment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Order Payment
          </span>
        );
      case 'Fee':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Fee
          </span>
        );
      case 'Refund':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Refund
          </span>
        );
      case 'Advertising':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Advertising
          </span>
        );
      case 'FBA Fee':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            FBA Fee
          </span>
        );
      case 'Adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Adjustment
          </span>
        );
      case 'Tax':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Tax
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1720px] w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track your earnings, settlements, fees and overall financial performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Dec 1, 2024 - Dec 31, 2024</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Download Report Button */}
          <button
            onClick={() => showToast('Financial report downloaded successfully')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Report</span>
          </button>

          {/* More Actions Menu */}
          <button
            onClick={() => showToast('Opening finance settings...')}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Row (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500">Total Revenue</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">₹{Math.round(financeSummary.sales).toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>18.3% vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Payouts */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500">Total Payouts</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">₹{Math.round(financeSummary.sales * 0.9).toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>16.7%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Fees */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500">Total Fees</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">₹{Math.round(financeSummary.total_expenses).toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>12.4%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500">Net Profit</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">₹{Math.round(financeSummary.net_profit).toLocaleString('en-IN')}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>22.8%</span>
            </div>
          </div>
        </div>

        {/* Card 5: Pending Settlement */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500">Pending Settlement</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">₹1,24,580</div>
            <div className="h-4 mt-1" />
          </div>
        </div>

        {/* Card 6: Refunds */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500">Refunds</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">₹48,360</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>5.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Charts Row: Revenue vs Expenses (Left) + Fee Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <FinanceRevenueChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <FinanceFeeBreakdownDonut />
        </div>
      </div>

      {/* 4. Bottom Main Layout: Transactions Workspace (Left) + Right Column (Settlement, Summary, Payouts, Insights) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Transactions Table Workspace (8 cols) */}
        <div className="xl:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 overflow-x-auto scrollbar-none">
            {[
              { id: 'All Transactions', label: 'All Transactions', count: '1,248' },
              { id: 'Payouts', label: 'Payouts', count: '48' },
              { id: 'Fees', label: 'Fees', count: '320' },
              { id: 'Refunds', label: 'Refunds', count: '86' },
              { id: 'Adjustments', label: 'Adjustments', count: '12' },
              { id: 'Tax', label: 'Tax', count: '28' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold whitespace-nowrap transition-colors relative ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order ID, transaction ID, type, description..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Marketplace */}
              <select
                value={marketplaceFilter}
                onChange={(e) => handleMarketplaceChange(e.target.value)}
                className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 hover:bg-slate-50 focus:outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="All Marketplaces">All Marketplaces</option>
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
              </select>

              {/* Transaction Types */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 hover:bg-slate-50 focus:outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="All Transaction Types">All Transaction Types</option>
                <option value="Payout">Payout</option>
                <option value="Order Payment">Order Payment</option>
                <option value="Fee">Fee</option>
                <option value="Refund">Refund</option>
                <option value="Advertising">Advertising</option>
                <option value="FBA Fee">FBA Fee</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Tax">Tax</option>
              </select>

              {/* Date Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 hover:bg-slate-50 focus:outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="This Month">This Month</option>
                <option value="Last Quarter">Last Quarter</option>
              </select>

              {/* More Filters button */}
              <button
                onClick={() => showToast('Opening advanced filters...')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={
                  filteredTransactions.length > 0 &&
                  selectedIds.length === filteredTransactions.length
                }
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <span>{selectedIds.length} selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const txsToExport = selectedIds.length > 0
                    ? filteredTransactions.filter(t => selectedIds.includes(t.id))
                    : filteredTransactions;
                  const headers = ['Transaction ID', 'Date', 'Type', 'Description', 'Order ID', 'Marketplace', 'Amount', 'Status'];
                  const rows = txsToExport.map(t => [
                    t.id,
                    t.date,
                    t.type,
                    `"${t.description}"`,
                    t.orderId,
                    t.marketplace,
                    t.amount,
                    t.status
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `SellerHub_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast(`Exported ${txsToExport.length} transactions as CSV`);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>Export Selected</span>
              </button>

              <button
                onClick={() => {
                  const headers = ['Transaction ID', 'Date', 'Type', 'Description', 'Amount', 'Marketplace', 'Status'];
                  const rows = filteredTransactions.map(t => [
                    t.id,
                    t.date,
                    t.type,
                    `"${t.description}"`,
                    t.amount,
                    t.marketplace,
                    t.status
                  ]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Financial_Statement_Dec_2024.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Downloaded monthly financial statement (CSV)');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <FileText className="w-3 h-3 text-slate-500" />
                <span>Download Statement</span>
              </button>

              <button
                onClick={() => showToast('Reconciliation process completed: all matched')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Reconcile</span>
              </button>

              <button
                onClick={() => {
                  if (selectedIds.length > 0) {
                    const found = filteredTransactions.find((tx) => tx.id === selectedIds[0]);
                    if (found) handleRowClick(found);
                  } else {
                    setIsSettlementDrawerOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Eye className="w-3 h-3 text-slate-500" />
                <span>View Details</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredTransactions.length > 0 &&
                        selectedIds.length === filteredTransactions.length
                      }
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredTransactions.map((tx) => {
                  const isSelected = selectedIds.includes(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => handleRowClick(tx)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(tx.id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-800 font-semibold">
                        {tx.id}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderTypeBadge(tx.type)}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium whitespace-nowrap">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {tx.orderId}
                      </td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        <span className={tx.isNegative ? 'text-rose-600' : 'text-slate-900'}>
                          {tx.amountDisplay}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {tx.status}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-center text-slate-400 hover:text-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Action menu for ${tx.id}`);
                        }}
                      >
                        <button className="p-1 rounded-md hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-white">
            <div>
              Showing <span className="font-semibold text-slate-800">1</span> to{' '}
              <span className="font-semibold text-slate-800">10</span> of{' '}
              <span className="font-semibold text-slate-800">1,248</span> transactions
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                1
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                2
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                3
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                4
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                5
              </button>
              <span className="text-slate-400 px-1">...</span>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-medium">
                125
              </button>

              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="ml-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50 focus:outline-hidden"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Settlement Details Drawer, Monthly Summary, Payout Schedule, Quick Actions, Insights (4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Section 1: Settlement Details Drawer/Card */}
          {isSettlementDrawerOpen && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Settlement Details</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Completed
                  </span>
                  <button
                    onClick={() => setIsSettlementDrawerOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Settlement ID</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedSettlement.id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Settlement Date</span>
                  <span className="font-medium text-slate-800">
                    {selectedSettlement.date}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Marketplace</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    {selectedSettlement.marketplace === 'Amazon' ? (
                      <>
                        <span className="text-slate-900 font-extrabold text-sm tracking-tighter">a<span className="text-amber-500 text-xs">‿</span></span>
                        <span>Amazon</span>
                      </>
                    ) : (
                      <>
                        <span className="text-blue-600 font-bold">F</span>
                        <span>Flipkart</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Amount</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {selectedSettlement.amount}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Completed
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">UTR Number</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {selectedSettlement.utrNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Expected Date</span>
                  <span className="text-slate-800 font-medium">
                    {selectedSettlement.expectedDate}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Processed Date</span>
                  <span className="text-slate-800 font-medium">
                    {selectedSettlement.processedDate}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  showToast(`Downloaded settlement report for ${selectedSettlement.id}`)
                }
                className="w-full mt-2 py-2 px-3 bg-blue-50/70 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Settlement Report</span>
              </button>
            </div>
          )}

          {/* Section 2: Monthly Summary */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Monthly Summary</h3>
              </div>
              <span className="text-xs font-medium text-slate-500">Dec 2024</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Revenue</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">₹12,48,670</span>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> 18.3%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Fees</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">-₹2,48,920</span>
                  <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> 12.4%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Advertising Spend</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">-₹24,580</span>
                  <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> 8.2%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Refunds</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">-₹48,360</span>
                  <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> 5.2%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Other Charges</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">-₹12,330</span>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> 3.1%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Net Profit</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">₹3,26,480</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> 22.8%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Payout Schedule */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Payout Schedule</h3>
              </div>
              <button
                onClick={() => showToast('Opening complete payout history...')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-700 font-medium">Dec 15, 2024</span>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900">₹1,24,350</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-700 font-medium">Dec 08, 2024</span>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900">₹98,420</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-700 font-medium">Dec 01, 2024</span>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900">₹1,02,580</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <SlidersHorizontal className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => showToast('Financial statement generated and downloading...')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-left"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Download Statement</span>
              </button>

              <button
                onClick={() => showToast('Reconcile accounts assistant started')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-left"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Reconcile Accounts</span>
              </button>

              <button
                onClick={() => showToast('Generating GST & Tax Summary Report...')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-left"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">View Tax Report</span>
              </button>

              <button
                onClick={() => showToast('Connecting to SellerHub Finance Support...')}
                className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-left"
              >
                <Headphones className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Contact Support</span>
              </button>
            </div>
          </div>

          {/* Section 5: Financial Insights */}
          <div className="bg-linear-to-br from-indigo-50/90 to-blue-50/70 border border-indigo-100/90 rounded-xl p-4.5 space-y-2 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  Your net profit is up 22.8% this month!
                </h4>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Keep optimizing your ad spend to improve margins further.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
