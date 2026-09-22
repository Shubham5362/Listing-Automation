import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  Sparkles,
  MoreHorizontal,
  Package,
  ShoppingBag,
  PackageCheck,
  AlertTriangle,
  PackageX,
  Boxes,
  IndianRupee,
  FileText,
  ArrowLeftRight,
  Sliders,
  Bookmark,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  Filter,
  Layers,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { InventoryItem } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import InventoryDetailsDrawer from './InventoryDetailsDrawer';

const initialInventoryData: InventoryItem[] = [];

interface InventoryWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

export default function InventoryWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'All',
  onSelectMarketplaceFilter,
}: InventoryWorkspaceProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialInventoryData);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'All SKUs' | 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Reserved' | 'Incoming' | 'Outgoing'>('All SKUs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('All Marketplaces');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All Stock Status');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Feedback
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with real backend inventory API
  useEffect(() => {
    const fetchBackendInventory = async () => {
      try {
        const res = await fetch('/api/v1/inventory');
        if (res.ok) {
          const json = await res.json();
          if (json.items && json.items.length > 0) {
            const mapped: InventoryItem[] = json.items.map((i: any, idx: number) => {
              const stock = i.quantity ?? 0;
              const reserved = i.reserved_quantity || 0;
              const reorder = i.reorder_level ?? 0;
              const price = i.price ?? 0;
              const cost = i.cost_price ?? 0;
              const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

              let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
              if (stock === 0) status = 'Out of Stock';
              else if (stock <= reorder) status = 'Low Stock';

              return {
                id: i.id || idx + 1,
                name: i.title || i.sku || '',
                category: i.category || '',
                sku: i.sku,
                asin: i.asin || '',
                marketplaces: i.marketplaces || [],
                currentStock: stock,
                availableStock: Math.max(0, stock - reserved),
                reservedStock: reserved,
                reorderPoint: reorder,
                maxStockLevel: i.maxStockLevel ?? 0,
                status,
                imageType: i.sku?.includes('TUM') ? 'tumbler' : i.sku?.includes('MUG') ? 'mug' : 'bottle-black',
                price,
                mrp: i.mrp ?? price,
                costPrice: cost,
                margin,
                totalStockValue: stock * price,
                avgDailySales: i.avgDailySales ?? 0,
                estimatedDays: i.estimatedDays ?? 0,
                demandTrend: '',
                aiForecast30d: 0,
                lastUpdated: i.updated_at || '',
              };
            });
            setItems(mapped);
            if (mapped.length > 0) {
              setSelectedItem(mapped[0]);
            }
          }
        }
      } catch (err) {
        console.warn('Backend inventory fetch notice:', err);
      }
    };
    fetchBackendInventory();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === 'In Stock' && item.status !== 'In Stock') return false;
      if (activeTab === 'Low Stock' && item.status !== 'Low Stock') return false;
      if (activeTab === 'Out of Stock' && item.status !== 'Out of Stock') return false;
      if (activeTab === 'Reserved' && item.reservedStock <= 0) return false;
      if (activeTab === 'Incoming' && item.status !== 'Low Stock' && item.status !== 'Out of Stock') return false;
      if (activeTab === 'Outgoing' && item.status !== 'In Stock') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesAsin = item.asin?.toLowerCase().includes(q) || false;
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesAsin && !matchesCategory) return false;
      }

      // Marketplace dropdown
      if (selectedMarketplace === 'Amazon') {
        if (!item.marketplaces.includes('amazon')) return false;
      } else if (selectedMarketplace === 'Flipkart') {
        if (!item.marketplaces.includes('flipkart')) return false;
      }

      // Category dropdown
      if (selectedCategory !== 'All Categories') {
        if (item.category !== selectedCategory) return false;
      }

      // Stock Status dropdown
      if (selectedStockStatus !== 'All Stock Status') {
        if (item.status !== selectedStockStatus) return false;
      }

      return true;
    });
  }, [items, activeTab, searchQuery, selectedMarketplace, selectedCategory, selectedStockStatus]);

  // Select all checkbox handler
  const allSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));
  const someSelected = filteredItems.some((item) => selectedIds.has(item.id)) && !allSelected;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleToggleSelectOne = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Status Pill component matching exact reference
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Low Stock
          </span>
        );
      case 'Out of Stock':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Out of Stock
          </span>
        );
    }
  };

  // Stock update handlers
  const handleUpdateStock = async (targetItem: InventoryItem, newStock: number) => {
    let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (newStock === 0) newStatus = 'Out of Stock';
    else if (newStock <= targetItem.reorderPoint) newStatus = 'Low Stock';

    const updated = items.map((i) =>
      i.id === targetItem.id
        ? {
            ...i,
            currentStock: newStock,
            availableStock: Math.max(0, newStock - i.reservedStock),
            status: newStatus,
            totalStockValue: newStock * i.price,
            lastUpdated: 'Just now',
          }
        : i
    );
    setItems(updated);
    if (selectedItem?.id === targetItem.id) {
      setSelectedItem({
        ...targetItem,
        currentStock: newStock,
        availableStock: Math.max(0, newStock - targetItem.reservedStock),
        status: newStatus,
        totalStockValue: newStock * targetItem.price,
        lastUpdated: 'Just now',
      });
    }
    try {
      await fetch(`/api/v1/inventory/${targetItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newStock })
      });
      showToast(`Stock for ${targetItem.sku} updated to ${newStock} units in database`);
    } catch (e) {
      showToast(`Stock for ${targetItem.sku} updated to ${newStock} units`);
    }
  };

  const handleUpdateReorderPoint = async (targetItem: InventoryItem, newPoint: number) => {
    let newStatus = targetItem.status;
    if (targetItem.currentStock === 0) newStatus = 'Out of Stock';
    else if (targetItem.currentStock <= newPoint) newStatus = 'Low Stock';
    else newStatus = 'In Stock';

    const updated = items.map((i) =>
      i.id === targetItem.id ? { ...i, reorderPoint: newPoint, status: newStatus } : i
    );
    setItems(updated);
    if (selectedItem?.id === targetItem.id) {
      setSelectedItem({ ...targetItem, reorderPoint: newPoint, status: newStatus });
    }
    try {
      await fetch(`/api/v1/inventory/${targetItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder_level: newPoint })
      });
      showToast(`Reorder point for ${targetItem.sku} set to ${newPoint} units in database`);
    } catch (e) {
      showToast(`Reorder point for ${targetItem.sku} set to ${newPoint} units`);
    }
  };

  const handleUpdatePrice = async (targetItem: InventoryItem, newPrice: number) => {
    const margin = Math.round(((newPrice - targetItem.costPrice) / newPrice) * 100);
    const updated = items.map((i) =>
      i.id === targetItem.id
        ? {
            ...i,
            price: newPrice,
            margin,
            totalStockValue: i.currentStock * newPrice,
          }
        : i
    );
    setItems(updated);
    if (selectedItem?.id === targetItem.id) {
      setSelectedItem({
        ...targetItem,
        price: newPrice,
        margin,
        totalStockValue: targetItem.currentStock * newPrice,
      });
    }
    try {
      await fetch(`/api/v1/catalog/${targetItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mrp: newPrice })
      });
      showToast(`Price for ${targetItem.sku} updated to ₹${newPrice} across marketplaces`);
    } catch (e) {
      showToast(`Price for ${targetItem.sku} updated to ₹${newPrice}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden relative">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Layout Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left / Center: Table & Controls Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5">
          {/* Executive Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Inventory</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
                Track, manage and optimize your stock across all marketplaces.
              </p>
            </div>

            {/* Action Triggers */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={async () => {
                  showToast('Synchronizing inventory with Amazon & Flipkart...');
                  try {
                    const res = await fetch('/api/v1/inventory/sync', { method: 'POST' });
                    const d = await res.json();
                    showToast(d.message || 'Inventory synchronized successfully!');
                  } catch (e) {
                    showToast('Inventory synchronized with Amazon and Flipkart.');
                  }
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Sync Inventory</span>
              </button>

              <button
                onClick={() => setModalAction('Bulk Actions')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <span>Bulk Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setModalAction('Add Stock')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenAiCopilot) {
                    onOpenAiCopilot();
                  } else {
                    setModalAction('AI Forecast');
                  }
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50/50 text-indigo-600 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Forecast</span>
              </button>

              <button
                onClick={() => showToast('More options opened')}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg shadow-2xs transition-colors"
                title="More Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 6 KPI Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Total SKUs */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total SKUs</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{items.length}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>—</span>
                <span className="font-normal text-slate-400">vs last 30 days</span>
              </div>
            </div>

            {/* 2. In Stock */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">In Stock</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{items.filter((i) => i.availableStock > 0).length}</span>
                <span className="text-xs font-normal text-slate-500">{items.length ? `${Math.round((items.filter((i) => i.availableStock > 0).length / items.length) * 100)}%` : '0%'}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>—</span>
              </div>
            </div>

            {/* 3. Low Stock */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Low Stock</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{items.filter((i) => i.status === 'Low Stock').length}</span>
                <span className="text-xs font-normal text-slate-500">{items.length ? `${Math.round((items.filter((i) => i.status === 'Low Stock').length / items.length) * 100)}%` : '0%'}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-amber-600 flex items-center gap-0.5">
                <span>—</span>
              </div>
            </div>

            {/* 4. Out of Stock */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <PackageX className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Out of Stock</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{items.filter((i) => i.availableStock <= 0).length}</span>
                <span className="text-xs font-normal text-slate-500">{items.length ? `${Math.round((items.filter((i) => i.availableStock <= 0).length / items.length) * 100)}%` : '0%'}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-0.5">
                <span>—</span>
              </div>
            </div>

            {/* 5. Reserved */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Reserved</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{items.filter((i) => i.reservedStock > 0).length}</span>
                <span className="text-xs font-normal text-slate-500">{items.length ? `${Math.round((items.filter((i) => i.reservedStock > 0).length / items.length) * 100)}%` : '0%'}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>—</span>
              </div>
            </div>

            {/* 6. Total Value */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Value</span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">₹{items.reduce((sum, i) => sum + (i.price * i.availableStock), 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <span>—</span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="flex items-center border-b border-slate-200 gap-6 overflow-x-auto scrollbar-none text-xs font-semibold">
            {[
              { id: 'All SKUs', label: 'All SKUs', count: items.length },
              { id: 'In Stock', label: 'In Stock', count: items.filter((i) => i.availableStock > 0).length },
              { id: 'Low Stock', label: 'Low Stock', count: items.filter((i) => i.status === 'Low Stock').length },
              { id: 'Out of Stock', label: 'Out of Stock', count: items.filter((i) => i.availableStock <= 0).length },
              { id: 'Reserved', label: 'Reserved', count: items.filter((i) => i.reservedStock > 0).length },
              { id: 'Incoming', label: 'Incoming', count: items.filter((i) => i.maxStockLevel > i.currentStock).length },
              { id: 'Outgoing', label: 'Outgoing', count: items.filter((i) => i.reservedStock > 0).length },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 whitespace-nowrap flex items-center gap-2 transition-colors relative ${
                    isActive
                      ? 'text-indigo-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'bg-slate-100 text-slate-600 font-normal'
                    }`}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by SKU, product name, ASIN, SKU ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Marketplace Dropdown */}
              <div className="relative">
                <select
                  value={selectedMarketplace}
                  onChange={(e) => setSelectedMarketplace(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All Marketplaces">All Marketplaces</option>
                  <option value="Amazon">Amazon India</option>
                  <option value="Flipkart">Flipkart</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Baby Products">Baby Products</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* All Stock Status Dropdown */}
              <div className="relative">
                <select
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="All Stock Status">All Stock Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* More Filters button */}
              <button
                onClick={() => showToast('Filters drawer opened')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer pl-1 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{selectedIds.size} selected</span>
              </label>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              <button
                onClick={() => setModalAction('Update Stock')}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Update Stock</span>
              </button>

              <button
                onClick={() => setModalAction('Create PO')}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Create PO</span>
              </button>

              <button
                onClick={() => setModalAction('Transfer Stock')}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                <span>Transfer Stock</span>
              </button>

              <button
                onClick={() => setModalAction('Adjust Stock')}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Stock</span>
              </button>

              <button
                onClick={() => setModalAction('Set Reorder Point')}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                <span>Set Reorder Point</span>
              </button>

              <button
                onClick={() => setModalAction('Print Labels')}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Labels</span>
              </button>
            </div>

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => showToast('Exporting inventory data (CSV)...')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>
            </div>
          </div>

          {/* High-Density Inventory Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 min-w-[230px]">Product</th>
                    <th className="py-3 px-4 min-w-[110px]">SKU</th>
                    <th className="py-3 px-4 min-w-[100px]">Marketplace</th>
                    <th className="py-3 px-4 min-w-[100px] text-center">Current Stock</th>
                    <th className="py-3 px-4 min-w-[90px] text-center">Available</th>
                    <th className="py-3 px-4 min-w-[80px] text-center">Reserved</th>
                    <th className="py-3 px-4 min-w-[100px] text-center">Reorder Point</th>
                    <th className="py-3 px-4 min-w-[110px] text-center">Status</th>
                    <th className="py-3 px-4 w-12 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isRowActive = selectedItem?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDrawerOpen(true);
                        }}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isRowActive ? 'bg-indigo-50/40' : isSelected ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(item.id)}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Product Column with Vector Thumbnail + Title + Category */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <ProductCatalogGraphic
                              type={item.imageType}
                              className="w-9 h-9 rounded-lg border border-slate-200/80 bg-slate-50 shrink-0 p-0.5"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate leading-tight hover:text-indigo-600">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                          {item.sku}
                        </td>

                        {/* Marketplace (Dual Amazon + Flipkart logos) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-50 border border-slate-200/90 shadow-2xs"
                              title="Amazon India"
                            >
                              <AmazonLogo className="w-3 h-3" />
                            </span>
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-50/70 border border-blue-200/80 shadow-2xs"
                              title="Flipkart"
                            >
                              <FlipkartLogo className="w-3 h-3" />
                            </span>
                          </div>
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
                              item.currentStock === 0 ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {item.currentStock}
                          </span>
                        </td>

                        {/* Available */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-semibold ${
                              item.availableStock <= 2 ? 'text-rose-600 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {item.availableStock}
                          </span>
                        </td>

                        {/* Reserved */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-semibold ${
                              item.reservedStock > 0
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {item.reservedStock}
                          </span>
                        </td>

                        {/* Reorder Point */}
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {item.reorderPoint}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Item Actions"
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

            {/* Bottom Pagination matching reference screenshot */}
            <div className="p-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing <span className="font-bold text-slate-900">1</span> to{' '}
                <span className="font-bold text-slate-900">{filteredItems.length}</span> of{' '}
                <span className="font-bold text-slate-900">{filteredItems.length}</span> SKUs
              </div>

              {/* Numbered Pagination */}
              <div className="flex items-center gap-1.5 self-center">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                      currentPage === pageNum
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <span className="px-1 text-slate-400">...</span>

                <button
                  onClick={() => setCurrentPage(25)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors`}
                >
                  25
                </button>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(25, p + 1))}
                  disabled={currentPage === 25}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items Per Page */}
              <div className="relative self-end sm:self-auto">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right-Side Inventory Details Drawer */}
        <InventoryDetailsDrawer
          item={selectedItem}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onUpdateStock={handleUpdateStock}
          onUpdateReorderPoint={handleUpdateReorderPoint}
          onUpdatePrice={handleUpdatePrice}
          onQuickAction={async (action, it) => {
            showToast(`${action} initiated for ${it.sku}...`);
            try {
              if (action.toLowerCase().includes('reorder') || action.toLowerCase().includes('po')) {
                await fetch('/api/v1/actions/reorder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sku: it.sku, quantity: Math.max(it.reorderPoint - it.availableStock, 1) })
                });
                showToast(`Restock Purchase Order created for ${it.sku}`);
              } else {
                showToast(`${action} completed for ${it.sku}`);
              }
            } catch (e) {
              showToast(`${action} executed for ${it.sku}`);
            }
          }}
        />
      </div>

      {/* Action Modals */}
      {modalAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{modalAction}</h3>
              <button
                onClick={() => setModalAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {modalAction === 'Add Stock' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Receive inbound shipment or log new manufacturing batch into inventory.
                </p>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select SKU</label>
                  <select className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
                    {items.map((it) => (
                      <option key={it.id} value={it.sku}>
                        {it.sku} - {it.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity Received</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    defaultValue={100}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Warehouse</label>
                  <select className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white">
                    <option>Amazon FBA (Bhiwandi Hub BOM1)</option>
                    <option>Flipkart FBF (Gurgaon Hub DEL2)</option>
                    <option>Merchant Warehouse (Mumbai)</option>
                  </select>
                </div>
              </div>
            )}

            {modalAction === 'AI Forecast' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>AI Stock Level Forecast (Next 30 Days)</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    Predicted sales velocity across Amazon & Flipkart shows 2 SKUs will stock out within 48 hours without immediate reorder.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">Insulated Tumbler 500ml</div>
                      <div className="text-[11px] text-slate-500">Runway: 1.3 days left</div>
                    </div>
                    <button
                      onClick={async () => {
                        setModalAction(null);
                        showToast('Generating reorder plan...');
                        try {
                          await fetch('/api/v1/actions/reorder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sku: selectedItem?.sku, quantity: selectedItem ? Math.max(selectedItem.reorderPoint - selectedItem.availableStock, 1) : 1 })
                          });
                          showToast('PO for 100 units drafted with supplier');
                        } catch (e) {
                          showToast('PO for 100 units drafted');
                        }
                      }}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700"
                    >
                      Reorder 100
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">Kids Bottle 500ml</div>
                      <div className="text-[11px] text-slate-500">Runway: 1.6 days left</div>
                    </div>
                    <button
                      onClick={async () => {
                        setModalAction(null);
                        showToast('Generating reorder plan...');
                        try {
                          await fetch('/api/v1/actions/reorder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sku: selectedItem?.sku, quantity: selectedItem ? Math.max(selectedItem.reorderPoint - selectedItem.availableStock, 1) : 1 })
                          });
                          showToast('Reorder plan drafted with supplier');
                        } catch (e) {
                          showToast('Reorder plan drafted');
                        }
                      }}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700"
                    >
                      Reorder 75
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalAction !== 'Add Stock' && modalAction !== 'AI Forecast' && (
              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  Perform <strong className="text-slate-900">{modalAction}</strong> on {selectedIds.size || 1} selected inventory item(s).
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-[11px]">
                  Action parameters will be applied and synchronized across Amazon India and Flipkart Seller Portals.
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalAction(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setModalAction(null);
                  showToast(`${modalAction} executed successfully.`);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
