import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart2,
  Calendar,
  ChevronDown,
  Download,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  ShoppingCart,
  Tag,
  CircleDollarSign,
  Package,
  Layers,
  Lightbulb,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Plus,
  FileText,
  X,
  ArrowRight,
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Users,
  Printer,
  RotateCw,
  ExternalLink,
  Check,
  Eye,
  Mail,
  ShieldCheck,
  Percent,
  DollarSign
} from 'lucide-react';
import { renderMarketplaceLogo } from './MarketplacesWorkspace';

interface ReportsWorkspaceProps {
  onNavigateTab?: (tab: string) => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

// Scheduled Report Item Interface
interface ScheduledReport {
  id: string;
  name: string;
  schedule: string;
  format: 'CSV' | 'PDF' | 'XLSX';
  recipients: string;
  status: 'Active' | 'Paused';
  lastRun?: string;
}

// Detailed Report Item Interface
interface ReportCategoryCard {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  defaultFormat: 'CSV' | 'PDF' | 'XLSX';
  sampleRowsCount: number;
}

export default function ReportsWorkspace({
  onNavigateTab,
  selectedMarketplaceFilter = 'All Marketplaces',
  onSelectMarketplaceFilter
}: ReportsWorkspaceProps) {
  // Navigation Tabs matching reference image
  const [activeTab, setActiveTab] = useState<
    | 'Overview'
    | 'Sales'
    | 'Orders'
    | 'Products'
    | 'Inventory'
    | 'Advertising'
    | 'Profitability'
    | 'Customer Insights'
    | 'Custom Reports'
  >('Overview');

  // Filter States
  const [dateRange, setDateRange] = useState('');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [compareOption, setCompareOption] = useState('Compare: Previous Period');
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [salesTrendInterval, setSalesTrendInterval] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [categoryLimit, setCategoryLimit] = useState<'Top 5' | 'Top 10' | 'All'>('Top 5');
  const [orderStatusPeriod, setOrderStatusPeriod] = useState('Last 30 Days');
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<number | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'XLSX' | 'PDF' | 'JSON'>('CSV');
  const [exportScope, setExportScope] = useState<'Current View' | 'All Data' | 'Executive Summary'>('Current View');
  const [isExporting, setIsExporting] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('Weekly Sales Summary');
  const [newScheduleFrequency, setNewScheduleFrequency] = useState('Every Monday at 9:00 AM');
  const [newScheduleFormat, setNewScheduleFormat] = useState<'CSV' | 'PDF' | 'XLSX'>('PDF');
  const [newScheduleEmail, setNewScheduleEmail] = useState('');

  const [activeReportModal, setActiveReportModal] = useState<ReportCategoryCard | null>(null);
  const [isAiInsightsModalOpen, setIsAiInsightsModalOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [selectedScheduledItem, setSelectedScheduledItem] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Scheduled Reports List
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);

  const [summary, setSummary] = useState({ totalSales: 0, totalOrders: 0, totalListings: 0, totalProducts: 0, avgOrderValue: 0, netProfit: 0, salesGrowth: 0, ordersGrowth: 0, listingsGrowth: 0, aovGrowth: 0, profitGrowth: 0 });

  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);

  // Revenue by Category
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Orders by Marketplace
  const [marketplaceOrders, setMarketplaceOrders] = useState<any[]>([]);

  // Order Status distribution
  const [orderStatusSegments, setOrderStatusSegments] = useState<any[]>([]);

  // Timeline points for Sales Trend
  const [salesTimeline, setSalesTimeline] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/reports')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!d) return;
        if (d.summary) setSummary(d.summary);
        if (d.categoryData && d.categoryData.length > 0) setCategoryData(d.categoryData);
        if (d.marketplaceOrders && d.marketplaceOrders.length > 0) setMarketplaceOrders(d.marketplaceOrders);
        if (d.orderStatusSegments && d.orderStatusSegments.length > 0) setOrderStatusSegments(d.orderStatusSegments);
        if (d.salesTimeline && d.salesTimeline.length > 0) setSalesTimeline(d.salesTimeline);
        if (d.topSellingProducts && d.topSellingProducts.length > 0) setTopSellingProducts(d.topSellingProducts);
      })
      .catch((err) => console.error('Failed to load reports from backend:', err));
  }, []);

  // Detailed Reports Grid matching reference screenshot
  const detailedReports: ReportCategoryCard[] = [
    {
      id: 'sales',
      name: 'Sales Report',
      desc: 'Revenue, orders, trends',
      icon: BarChart2,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      defaultFormat: 'CSV',
      sampleRowsCount: 0
    },
    {
      id: 'order',
      name: 'Order Report',
      desc: 'Order status, fulfillment',
      icon: ShoppingCart,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      defaultFormat: 'CSV',
      sampleRowsCount: 0
    },
    {
      id: 'product',
      name: 'Product Report',
      desc: 'Top products, performance',
      icon: Package,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      defaultFormat: 'XLSX',
      sampleRowsCount: 0
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      desc: 'Stock levels, aging',
      icon: Layers,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      defaultFormat: 'CSV',
      sampleRowsCount: 0
    },
    {
      id: 'advertising',
      name: 'Advertising Report',
      desc: 'Ad spend, ROAS, performance',
      icon: Megaphone,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      defaultFormat: 'CSV',
      sampleRowsCount: 0
    },
    {
      id: 'profit_loss',
      name: 'Profit & Loss',
      desc: 'Costs, fees, profitability',
      icon: CircleDollarSign,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      defaultFormat: 'PDF',
      sampleRowsCount: 0
    },
    {
      id: 'customer',
      name: 'Customer Report',
      desc: 'Customer insights, repeat rate',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      defaultFormat: 'CSV',
      sampleRowsCount: 0
    },
    {
      id: 'custom',
      name: 'Custom Report',
      desc: 'Create your own report',
      icon: FileText,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      defaultFormat: 'CSV',
      sampleRowsCount: 0
    }
  ];

  // SVG Chart Geometry Calculations
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 25;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const maxSales = 60000;

  const getY = (val: number) => {
    return chartHeight - paddingY - (val / maxSales) * usableHeight;
  };

  const getX = (idx: number) => {
    return paddingX + (idx / (salesTimeline.length - 1)) * usableWidth;
  };

  const amazonPath = salesTimeline
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.amazon)}`)
    .join(' ');

  const flipkartPath = salesTimeline
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.flipkart)}`)
    .join(' ');

  const meeshoPath = salesTimeline
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.meesho)}`)
    .join(' ');

  const myntraPath = salesTimeline
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.myntra)}`)
    .join(' ');

  // Download real report action
  const handleDownloadReport = (reportTitle: string, format: string) => {
    setIsExporting(true);
    showToast(`Compiling and generating ${reportTitle} (${format})...`);

    setTimeout(() => {
      let content = '';
      let filename = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;

      if (format === 'CSV' || format === 'XLSX') {
        content =
          'Date,Marketplace,SKU,Product Name,Category,Units Sold,Revenue (INR),Fees (INR),Net Profit (INR),Status\n' +
          salesTimeline
            .map((pt) => `${pt.day ?? ''},${pt.marketplace ?? ''},${pt.sku ?? ''},${pt.productName ?? ''},${pt.category ?? ''},${pt.orders ?? 0},${pt.sales ?? 0},${pt.fees ?? 0},${pt.profit ?? 0},${pt.status ?? ''}`)
            .join('\n');
        filename += '.csv';
      } else if (format === 'JSON') {
        const jsonObj = {
          reportName: reportTitle,
          generatedAt: new Date().toISOString(),
          period: dateRange,
          summary: {
            totalSales: summary.totalSales,
            totalOrders: summary.totalOrders,
            totalListings: summary.totalListings,
            avgOrderValue: summary.avgOrderValue,
            netProfit: summary.netProfit
          },
          marketplaceShare: marketplaceOrders,
          categoryRevenue: categoryData,
          topProducts: topSellingProducts
        };
        content = JSON.stringify(jsonObj, null, 2);
        filename += '.json';
      } else {
        // PDF Summary as structured text / printable format
        content = `====================================================\n${reportTitle.toUpperCase()}\nDate Range: ${dateRange}\nGenerated on: ${new Date().toLocaleString()}\n====================================================\n\nEXECUTIVE KPI SUMMARY:\n${JSON.stringify(summary, null, 2)}\n\nMARKETPLACE PERFORMANCE:\n${JSON.stringify(marketplaceOrders, null, 2)}\n\nCATEGORY BREAKDOWN:\n${JSON.stringify(categoryData, null, 2)}\n\nEnd of Report.\n`;
        filename += '.txt';
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setIsExportModalOpen(false);
      setActiveReportModal(null);
      showToast(`Successfully downloaded: ${filename}`);
    }, 1000);
  };

  // Add new schedule
  const handleSaveSchedule = () => {
    if (!newScheduleName.trim()) return;
    const newReport: ScheduledReport = {
      id: `sch-${Date.now()}`,
      name: newScheduleName,
      schedule: newScheduleFrequency,
      format: newScheduleFormat,
      recipients: newScheduleEmail,
      status: 'Active',
      lastRun: 'Scheduled'
    };
    setScheduledReports((prev) => [...prev, newReport]);
    setIsScheduleModalOpen(false);
    showToast(`New automated schedule "${newScheduleName}" created.`);
  };

  // Toggle or delete scheduled report
  const handleToggleSchedule = (id: string) => {
    setScheduledReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r
      )
    );
    setSelectedScheduledItem(null);
    showToast('Scheduled report status updated.');
  };

  const handleDeleteSchedule = (id: string) => {
    setScheduledReports((prev) => prev.filter((r) => r.id !== id));
    setSelectedScheduledItem(null);
    showToast('Scheduled report deleted.');
  };

  // Render Product Thumbnail helper matching screenshot
  const renderProductGraphic = (type: string) => {
    switch (type) {
      case 'bottle':
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800 fill-current">
              <path d="M10 2h4v2h-4zM9 5h6v2H9zM8 8h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
            </svg>
          </div>
        );
      case 'earbuds':
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800 fill-current">
              <circle cx="8" cy="14" r="4" />
              <circle cx="16" cy="14" r="4" />
              <path d="M8 10V6a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
        );
      case 'tshirt':
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800 fill-current">
              <path d="M9 3L4 6l2 4 3-2v11h6V8l3 2 2-4-5-3a3 3 0 0 1-6 0z" />
            </svg>
          </div>
        );
      case 'serum':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-800 fill-current">
              <path d="M11 2h2v4h-2zM9 7h6l1 13a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
            </svg>
          </div>
        );
      case 'pan':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800 fill-current">
              <circle cx="10" cy="12" r="7" />
              <path d="M17 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-slate-50/60 min-h-screen flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-5">
        {/* =========================================================================
            1. TOP HEADER (Exact matching reference image)
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <BarChart2 className="w-5 h-5 text-blue-600 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Reports & Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Get deep insights into your seller performance, sales, inventory, and business growth.
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            {/* Date Range Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsDateRangeOpen(!isDateRangeOpen);
                  setIsCompareOpen(false);
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-2xs flex items-center gap-2"
              >
                <span>{dateRange}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDateRangeOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-xs text-slate-700 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Date Range
                  </div>
                  {[
                    '',
                    'Today (Dec 16, 2024)',
                    'Yesterday',
                    'Last 7 Days',
                    'Last 14 Days',
                    'Last 30 Days',
                    'This Month (Dec 2024)',
                    'Last Month (Nov 2024)',
                    'Q4 2024',
                    'Year to Date (2024)'
                  ].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        setIsDateRangeOpen(false);
                        showToast(`Analytics filtered for: ${range}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-between ${
                        dateRange === range ? 'font-bold text-indigo-600 bg-indigo-50/50' : ''
                      }`}
                    >
                      <span>{range}</span>
                      {dateRange === range && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Compare Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCompareOpen(!isCompareOpen);
                  setIsDateRangeOpen(false);
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-2xs flex items-center gap-2"
              >
                <span>Compare</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isCompareOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-xs text-slate-700 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Comparison Baseline
                  </div>
                  {[
                    'Compare: Previous Period',
                    'Compare: Previous Month',
                    'Compare: Previous Year (YoY)',
                    'Compare: Target Goals',
                    'No Comparison'
                  ].map((comp) => (
                    <button
                      key={comp}
                      onClick={() => {
                        setCompareOption(comp);
                        setIsCompareOpen(false);
                        showToast(`Comparison baseline set to: ${comp}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-between ${
                        compareOption === comp ? 'font-bold text-indigo-600 bg-indigo-50/50' : ''
                      }`}
                    >
                      <span>{comp}</span>
                      {compareOption === comp && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Report Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors active:scale-[0.99] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. HORIZONTAL CATEGORY TABS (Exact match: Overview, Sales, Orders, etc.)
        ========================================================================= */}
        <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {[
            'Overview',
            'Sales',
            'Orders',
            'Products',
            'Inventory',
            'Advertising',
            'Profitability',
            'Customer Insights',
            'Custom Reports'
          ].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab as any);
                  showToast(`Viewing ${tab} reports`);
                }}
                className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 rounded-t-lg'
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            3. KPI CARDS (5 Cards in a row, exact match)
        ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Sales */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-sm">
              ₹
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Total Sales</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">₹{Number(summary.totalSales || 0).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>{summary.salesGrowth ? `↑ ${summary.salesGrowth}%` : '—'}</span>
              <span className="text-slate-400 font-normal">vs previous period</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Total Orders</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{Number(summary.totalOrders || 0).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>{summary.ordersGrowth ? `↑ ${summary.ordersGrowth}%` : '—'}</span>
              <span className="text-slate-400 font-normal">vs previous period</span>
            </div>
          </div>

          {/* Card 3: Total Listings */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Tag className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Total Listings</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{Number(summary.totalListings || 0).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>↑ {summary.listingsGrowth || 0}%</span>
              <span className="text-slate-400 font-normal">vs previous period</span>
            </div>
          </div>

          {/* Card 4: Avg. Order Value */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Avg. Order Value</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">₹{Math.round(Number(summary.avgOrderValue || 0)).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>↑ {summary.aovGrowth || 0}%</span>
              <span className="text-slate-400 font-normal">vs previous period</span>
            </div>
          </div>

          {/* Card 5: Net Profit */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Net Profit</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">₹{Number(summary.netProfit || 0).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>{summary.profitGrowth ? `↑ ${summary.profitGrowth}%` : '—'}</span>
              <span className="text-slate-400 font-normal">vs previous period</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. ROW 2: CHARTS (Sales Trend + Orders by Marketplace + Revenue by Category)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 4.1. Sales Trend */}
          <div className="lg:col-span-5.5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Sales Trend</h3>
              {/* Daily Dropdown */}
              <div className="relative">
                <select
                  value={salesTrendInterval}
                  onChange={(e) => setSalesTrendInterval(e.target.value as any)}
                  aria-label="Sales trend interval"
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* SVG Multi-Line Chart with 4 Marketplace Lines */}
            <div className="relative w-full h-[210px] flex items-center justify-center">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
              >
                {/* Horizontal Gridlines & Y-Axis Labels */}
                {[60000, 45000, 30000, 15000, 0].map((val) => {
                  const y = getY(val);
                  return (
                    <g key={val}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 4}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[9px] fill-slate-400 font-medium"
                      >
                        ₹{val === 0 ? '0' : `${val / 1000}K`}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Labels */}
                {salesTimeline.map((pt, i) => (
                  <text
                    key={pt.day}
                    x={getX(i)}
                    y={chartHeight - 2}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 font-medium"
                  >
                    {pt.day}
                  </text>
                ))}

                {/* Line 1: Amazon (Orange) */}
                <path
                  d={amazonPath}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {salesTimeline.map((pt, i) => (
                  <circle
                    key={`amz-${i}`}
                    cx={getX(i)}
                    cy={getY(pt.amazon)}
                    r={hoveredTrendPoint === i ? 4.5 : 3}
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredTrendPoint(i)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  />
                ))}

                {/* Line 2: Flipkart (Blue) */}
                <path
                  d={flipkartPath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {salesTimeline.map((pt, i) => (
                  <circle
                    key={`fk-${i}`}
                    cx={getX(i)}
                    cy={getY(pt.flipkart)}
                    r={hoveredTrendPoint === i ? 4.5 : 3}
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredTrendPoint(i)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  />
                ))}

                {/* Line 3: Meesho (Purple) */}
                <path
                  d={meeshoPath}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {salesTimeline.map((pt, i) => (
                  <circle
                    key={`msh-${i}`}
                    cx={getX(i)}
                    cy={getY(pt.meesho)}
                    r={hoveredTrendPoint === i ? 4 : 2.5}
                    fill="#A855F7"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredTrendPoint(i)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  />
                ))}

                {/* Line 4: Myntra (Pink/Magenta) */}
                <path
                  d={myntraPath}
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {salesTimeline.map((pt, i) => (
                  <circle
                    key={`myn-${i}`}
                    cx={getX(i)}
                    cy={getY(pt.myntra)}
                    r={hoveredTrendPoint === i ? 4 : 2.5}
                    fill="#EC4899"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredTrendPoint(i)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  />
                ))}
              </svg>

              {/* Hover Tooltip */}
              {hoveredTrendPoint !== null && (
                <div
                  className="absolute z-20 bg-slate-900 text-white rounded-lg p-2 text-[10px] shadow-xl pointer-events-none transition-all"
                  style={{
                    left: `${(getX(hoveredTrendPoint) / chartWidth) * 100}%`,
                    top: '10px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-bold border-b border-slate-700 pb-1 mb-1">
                    {salesTimeline[hoveredTrendPoint].day} 2024
                  </div>
                  <div className="flex items-center justify-between gap-3 text-amber-400">
                    <span>Amazon:</span>
                    <span className="font-bold">
                      ₹{salesTimeline[hoveredTrendPoint].amazon.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-blue-400">
                    <span>Flipkart:</span>
                    <span className="font-bold">
                      ₹{salesTimeline[hoveredTrendPoint].flipkart.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-purple-400">
                    <span>Meesho:</span>
                    <span className="font-bold">
                      ₹{salesTimeline[hoveredTrendPoint].meesho.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-pink-400">
                    <span>Myntra:</span>
                    <span className="font-bold">
                      ₹{salesTimeline[hoveredTrendPoint].myntra.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Legend Matching Reference Screenshot */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="font-medium">Amazon</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="font-medium">Flipkart</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7]" />
                <span className="font-medium">Meesho</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                <span className="font-medium">Myntra</span>
              </div>
            </div>
          </div>

          {/* 4.2. Orders by Marketplace (Col 2: 3.25 cols) */}
          <div className="lg:col-span-3.25 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Orders by Marketplace</h3>
            </div>

            {/* Donut Chart and Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              {/* SVG Donut */}
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />

                  {/* Amazon: 41.7% (~99.5 on 238.76 perimeter) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="99.5 238.8"
                    strokeDashoffset="0"
                  />

                  {/* Flipkart: 29.5% (~70.4 on 238.76) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="70.4 238.8"
                    strokeDashoffset="-99.5"
                  />

                  {/* Meesho: 17.6% (~42.0 on 238.76) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#EC4899"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="42 238.8"
                    strokeDashoffset="-169.9"
                  />

                  {/* Myntra: 11.2% (~26.7 on 238.76) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#A855F7"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="26.8 238.8"
                    strokeDashoffset="-211.9"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="text-xl font-bold text-slate-900">1,248</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">Total Orders</span>
                </div>
              </div>

              {/* Legend matching reference image */}
              <div className="space-y-2.5 text-xs w-full">
                {marketplaceOrders.map((mp) => (
                  <div key={mp.name} className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: mp.color }}
                      />
                      <span className="font-medium">{mp.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {mp.count} <span className="text-slate-400 font-normal">({mp.percent}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 text-center">
              Based on completed and dispatched orders in selected range
            </div>
          </div>

          {/* 4.3. Revenue by Category (Col 3: 3.25 cols) */}
          <div className="lg:col-span-3.25 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Revenue by Category</h3>
              <div className="relative">
                <select
                  value={categoryLimit}
                  onChange={(e) => setCategoryLimit(e.target.value as any)}
                  aria-label="Category limit"
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 pr-5 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="Top 5">Top 5</option>
                  <option value="Top 10">Top 10</option>
                  <option value="All">All</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Category Rows with Progress Bars and Formatted Currency */}
            <div className="space-y-3.5 pt-1">
              {categoryData.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate max-w-[140px]">
                      {cat.name}
                    </span>
                    <span className="font-bold text-slate-900">
                      ₹{cat.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color}`}
                      style={{ width: `${(cat.revenue / 130000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-1">
              No category insights available
            </div>
          </div>
        </div>

        {/* =========================================================================
            5. ROW 3: TOP SELLING PRODUCTS + ORDER STATUS + AI INSIGHTS
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 5.1. Top Selling Products (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Top Selling Products</h3>
              <button
                type="button"
                onClick={() => setIsProductsModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="pb-2 font-semibold w-5">#</th>
                    <th className="pb-2 font-semibold">Product</th>
                    <th className="pb-2 font-semibold text-center">Marketplace</th>
                    <th className="pb-2 font-semibold text-center">Orders</th>
                    <th className="pb-2 font-semibold text-right">Revenue</th>
                    <th className="pb-2 font-semibold text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {topSellingProducts.map((p) => (
                    <tr
                      key={p.rank}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => {
                        showToast(`Opened SKU telemetry for: ${p.name}`);
                      }}
                    >
                      {/* Rank */}
                      <td className="py-2.5 font-medium text-slate-400">{p.rank}</td>

                      {/* Product Thumbnail + Title */}
                      <td className="py-2.5 font-medium text-slate-800">
                        <div className="flex items-center gap-2 max-w-[160px] sm:max-w-[200px]">
                          {renderProductGraphic(p.imageType)}
                          <span className="truncate" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                      </td>

                      {/* Marketplace Logo */}
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center">
                          {renderMarketplaceLogo(p.marketplace, 'w-5 h-5')}
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="py-2.5 text-center font-medium text-slate-800">{p.orders}</td>

                      {/* Revenue */}
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </td>

                      {/* Trend */}
                      <td
                        className={`py-2.5 text-right font-semibold text-xs ${
                          p.trendPositive ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {p.trendPositive ? `↑ ${p.trend}%` : `↓ ${p.trend}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5.2. Order Status (3.5 cols) */}
          <div className="lg:col-span-3.5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Order Status</h3>
              <div className="relative">
                <select
                  value={orderStatusPeriod}
                  onChange={(e) => setOrderStatusPeriod(e.target.value)}
                  aria-label="Order status period"
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="This Quarter">This Quarter</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Donut and Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-1">
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />

                  {/* Delivered: 71.5% (170.7) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#10B981"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="170.7 238.8"
                    strokeDashoffset="0"
                  />

                  {/* Shipped: 16.8% (40.1) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="40.1 238.8"
                    strokeDashoffset="-170.7"
                  />

                  {/* Processing: 6.9% (16.5) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#8B5CF6"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="16.5 238.8"
                    strokeDashoffset="-210.8"
                  />

                  {/* Cancelled: 3.4% (8.1) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#EF4444"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="8.1 238.8"
                    strokeDashoffset="-227.3"
                  />

                  {/* Returned: 1.4% (3.3) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#0EA5E9"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="3.4 238.8"
                    strokeDashoffset="-235.4"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="text-xl font-bold text-slate-900">1,248</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">Total Orders</span>
                </div>
              </div>

              {/* Status List */}
              <div className="space-y-1.5 text-xs w-full">
                {orderStatusSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-medium">{seg.label}</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {seg.count} <span className="text-slate-400 font-normal">({seg.percent}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 text-center">
              Fulfillment rate is 88.3% with low return rate of 1.4%
            </div>
          </div>

          {/* 5.3. AI Insights (3.5 cols) */}
          <div className="lg:col-span-3.5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">AI Insights</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs">
                  New
                </span>
              </div>
            </div>

            {/* 4 Insight Cards */}
            <div className="space-y-2.5">
              {/* Insight 1 */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">Sales opportunity</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Home & Kitchen category is growing 28%. Consider adding more products.
                  </div>
                </div>
              </div>

              {/* Insight 2 */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">Listing improvement</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    12 listings have low conversion rate. Optimize titles and images.
                  </div>
                </div>
              </div>

              {/* Insight 3 */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">Inventory alert</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    5 products may run out of stock in the next 7 days.
                  </div>
                </div>
              </div>

              {/* Insight 4 */}
              <div className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">Ad performance</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Your ad ROAS increased by 22%. Consider increasing budget.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer View All Insights */}
            <button
              type="button"
              onClick={() => setIsAiInsightsModalOpen(true)}
              className="w-full pt-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View All Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            6. ROW 4: DETAILED REPORTS & SCHEDULED REPORTS
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 6.1. Detailed Reports (7.5 cols) */}
          <div className="lg:col-span-7.5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Detailed Reports</h3>
              <p className="text-[11px] text-slate-400">
                Generate and download detailed reports for your business.
              </p>
            </div>

            {/* 8 Cards in 4x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {detailedReports.map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.id}
                    onClick={() => setActiveReportModal(r)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer bg-white group flex flex-col justify-between space-y-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {r.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{r.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6.2. Scheduled Reports (4.5 cols) */}
          <div className="lg:col-span-4.5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Scheduled Reports</h3>
                <p className="text-[11px] text-slate-400">Manage your automated report schedule.</p>
              </div>
              <button
                type="button"
                onClick={() => showToast('Displaying all active automated report jobs.')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Scheduled List */}
            <div className="space-y-2.5 pt-1">
              {scheduledReports.map((sch) => (
                <div
                  key={sch.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700 border border-slate-200">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{sch.name}</div>
                      <div className="text-[10px] text-slate-400">{sch.schedule}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{sch.status}</span>
                    </span>

                    {/* Three Dots Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Options for ${sch.name}`}
                        onClick={() =>
                          setSelectedScheduledItem(
                            selectedScheduledItem === sch.id ? null : sch.id
                          )
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {selectedScheduledItem === sch.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs text-slate-700 animate-in fade-in">
                          <button
                            type="button"
                            onClick={() => handleDownloadReport(sch.name, sch.format)}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium"
                          >
                            Run Now
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSchedule(sch.id)}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium"
                          >
                            {sch.status === 'Active' ? 'Pause Schedule' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sch.id)}
                            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Button: + Schedule New Report */}
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="w-full py-2.5 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Report</span>
            </button>
          </div>
        </div>
      </main>

      {/* =========================================================================
          7. MODALS (Export Modal, Schedule Report Modal, Detailed Report Runner)
      ========================================================================= */}

      {/* 7.1. Main Export Report Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Export Reports & Analytics</span>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['CSV', 'XLSX', 'PDF', 'JSON'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`py-2 text-center rounded-xl border font-bold cursor-pointer transition-all ${
                        exportFormat === fmt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Export Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Current View', 'All Data', 'Executive Summary'] as const).map((scp) => (
                    <button
                      key={scp}
                      type="button"
                      onClick={() => setExportScope(scp)}
                      className={`py-2 text-center rounded-xl border font-medium cursor-pointer transition-all ${
                        exportScope === scp
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {scp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Selected Date Range:</span>
                  <span className="font-semibold text-slate-800">{dateRange}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketplaces:</span>
                  <span className="font-semibold text-slate-800">All 4 Channels</span>
                </div>
                <div className="flex justify-between">
                  <span>Included Metrics:</span>
                  <span className="font-semibold text-slate-800">Sales, Orders, Margin, ROAS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadReport('Executive_Analytics_Report', exportFormat)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isExporting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExporting ? 'Generating...' : 'Download Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.2. Schedule New Report Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Schedule Automated Report</span>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Report Name</label>
                <input
                  type="text"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                  placeholder="e.g. Weekly Executive Performance"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Frequency & Time</label>
                <select
                  value={newScheduleFrequency}
                  onChange={(e) => setNewScheduleFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 bg-white"
                >
                  <option value="Every day at 9:00 AM">Daily at 9:00 AM</option>
                  <option value="Every Monday at 9:00 AM">Weekly on Mondays at 9:00 AM</option>
                  <option value="1st of every month at 9:00 AM">Monthly on the 1st at 9:00 AM</option>
                  <option value="Every Friday at 6:00 PM">Weekend Wrap-up (Fridays 6:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PDF', 'CSV', 'XLSX'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setNewScheduleFormat(fmt)}
                      className={`py-1.5 text-center rounded-xl border font-semibold cursor-pointer ${
                        newScheduleFormat === fmt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recipient Email(s)</label>
                <input
                  type="email"
                  value={newScheduleEmail}
                  onChange={(e) => setNewScheduleEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.3. Detailed Report Generation Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <activeReportModal.icon className="w-4 h-4 text-indigo-600" />
                <span>{activeReportModal.name}</span>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="text-slate-500">{activeReportModal.desc}</p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Available Records:</span>
                  <span className="font-bold text-slate-900">
                    {activeReportModal.sampleRowsCount.toLocaleString('en-IN')} rows
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Channel Filter:</span>
                  <span className="font-semibold text-slate-800">Amazon, Flipkart, Meesho, Myntra</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Timeframe:</span>
                  <span className="font-semibold text-slate-800">{dateRange}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadReport(activeReportModal.name, activeReportModal.defaultFormat)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {activeReportModal.defaultFormat}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.4. All AI Insights Modal */}
      {isAiInsightsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>All AI Insights & Action Items</span>
              </div>
              <button
                onClick={() => setIsAiInsightsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[400px] overflow-y-auto pr-1">
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>No category growth insight available</span>
                </div>
                <p className="text-emerald-800 text-[11px]">
                  Connect report data to generate category insights.
                </p>
              </div>

              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <span>No listing conversion insight available</span>
                </div>
                <p className="text-purple-800 text-[11px]">
                  Connect analytics data to generate listing conversion insights.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>No stockout insight available</span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  Connect inventory data to generate stockout insights.
                </p>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-blue-600" />
                  <span>No advertising insight available</span>
                </div>
                <p className="text-blue-800 text-[11px]">
                  Connect advertising data to generate budget insights.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAiInsightsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7.5. Products Full View Modal */}
      {isProductsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Complete Top Selling Products Catalog</span>
              </div>
              <button
                onClick={() => setIsProductsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2 text-center">Marketplace</th>
                    <th className="pb-2 text-center">Orders</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {topSellingProducts.map((p) => (
                    <tr key={p.rank} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-400">{p.rank}</td>
                      <td className="py-2.5 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-2.5 text-center">
                        <div className="flex justify-center">
                          {renderMarketplaceLogo(p.marketplace, 'w-5 h-5')}
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-medium">{p.orders}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          p.trendPositive ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {p.trendPositive ? `+${p.trend}%` : `-${p.trend}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Showing available report data</span>
              <button
                type="button"
                onClick={() => {
                  setIsProductsModalOpen(false);
                  handleDownloadReport('Top_Selling_Products', 'CSV');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Products CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
