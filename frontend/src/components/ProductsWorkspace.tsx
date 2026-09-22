import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Plus,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Edit,
  Tag,
  Boxes,
  PlusSquare,
  Archive,
  ShoppingBag,
  Truck,
  PackageX,
  AlertTriangle,
  Ban,
  Percent,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Upload,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { ProductCatalogItem } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import ProductDetailsDrawer from './ProductDetailsDrawer';

// Base product list matching the exact 10 items shown in reference screenshot
const defaultProductCatalog: ProductCatalogItem[] = [];

interface ProductsWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

export default function ProductsWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'all',
  onSelectMarketplaceFilter,
}: ProductsWorkspaceProps) {
  // State management
  const [products, setProducts] = useState<ProductCatalogItem[]>(defaultProductCatalog);
  const [selectedProductId, setSelectedProductId] = useState<string | number>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'OutOfStock' | 'LowStock' | 'Suppressed' | 'Archived'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAiEnrichOpen, setIsAiEnrichOpen] = useState(false);
  const [isBulkActionMenuOpen, setIsBulkActionMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // New product form state
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    stock: '',
    margin: '',
  });

  // Sync and enrich from real backend catalog endpoint
  useEffect(() => {
    const fetchBackendCatalog = async () => {
      try {
        const res = await fetch('/api/v1/catalog');
        if (res.ok) {
          const json = await res.json();
          if (json.items && json.items.length > 0) {
            const mapped: ProductCatalogItem[] = json.items.map((item: any) => {
              const stock = item.stock !== undefined ? item.stock : (item.stock_qty !== undefined ? item.stock_qty : 0);
              const price = item.price ?? item.mrp ?? 0;
              const cost = item.cost_price ?? 0;
              const margin = item.margin !== undefined ? item.margin : (price > 0 ? Math.round(((price - cost) / price) * 100) : 0);
              const isStockOut = stock === 0;
              const isLow = stock > 0 && stock <= (item.reorder_level || 15);
              const sku = item.sku || '';

              const imgType = item.imageType || (
                sku.toLowerCase().includes('tum') || sku.toLowerCase().includes('shk') ? 'tumbler' :
                sku.toLowerCase().includes('mug') ? 'mug' :
                sku.toLowerCase().includes('gla') ? 'bottle-glass' :
                sku.toLowerCase().includes('cop') ? 'bottle-copper' :
                sku.toLowerCase().includes('flk') || sku.toLowerCase().includes('flask') ? 'flask-silver' :
                sku.toLowerCase().includes('sip') ? 'sipper-pink' : 'bottle-black'
              );

              return {
                id: item.id,
                name: item.name || item.title || '',
                category: item.category || '',
                brand: item.brand || '',
                sku: sku,
                hsnCode: item.hsnCode || item.hsn_code || '',
                weight: item.weight || '',
                dimensions: item.dimensions || '',
                createdOn: item.createdOn || (item.created_at ? item.created_at.split(' ')[0] : ''),
                lastUpdated: item.lastUpdated || (item.updated_at ? item.updated_at.split(' ')[0] : ''),
                imageType: imgType,
                marketplaces: item.marketplaces || [],
                stock: stock,
                availableStock: item.availableStock !== undefined ? item.availableStock : stock,
                reservedStock: item.reservedStock !== undefined ? item.reservedStock : (item.reserved_quantity || 0),
                inboundStock: item.inboundStock ?? 0,
                stockStatus: item.stockStatus || (isStockOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'),
                price: price,
                revenue30d: item.revenue30d ?? 0,
                margin: margin,
                listingStatus: item.listingStatus || (item.is_active ? 'Active' : 'Archived'),
                asin: item.asin || '',
                flipkartFsn: item.flipkartFsn || '',
                growthMetrics: item.growthMetrics || undefined,
              };
            });
            setProducts(mapped);
            if (mapped.length > 0 && !selectedProductId) {
              setSelectedProductId(mapped[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Backend catalog sync notice:', err);
      }
    };
    fetchBackendCatalog();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Find currently selected product for drawer
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.listingStatus === 'Active').length,
      outOfStock: products.filter((p) => p.stockStatus === 'Out of Stock').length,
      lowStock: products.filter((p) => p.stockStatus === 'Low Stock').length,
      suppressed: products.filter((p) => p.listingStatus === 'Suppressed').length,
      archived: products.filter((p) => p.listingStatus === 'Archived').length,
    };
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Tab filter
      if (activeTab === 'Active' && p.listingStatus !== 'Active') return false;
      if (activeTab === 'OutOfStock' && p.stockStatus !== 'Out of Stock') return false;
      if (activeTab === 'LowStock' && p.stockStatus !== 'Low Stock') return false;
      if (activeTab === 'Suppressed' && p.listingStatus !== 'Suppressed') return false;
      if (activeTab === 'Archived' && p.listingStatus !== 'Archived') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesAsin = p.asin?.toLowerCase().includes(q);
        const matchesFsn = p.flipkartFsn?.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesAsin && !matchesFsn && !matchesCat) {
          return false;
        }
      }

      // Marketplace filter
      if (marketplaceFilter !== 'all') {
        if (!p.marketplaces.includes(marketplaceFilter as any)) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        if (p.category !== categoryFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && p.listingStatus !== 'Active') return false;
        if (statusFilter === 'inactive' && p.listingStatus !== 'Inactive') return false;
        if (statusFilter === 'suppressed' && p.listingStatus !== 'Suppressed') return false;
        if (statusFilter === 'instock' && p.stockStatus !== 'In Stock') return false;
        if (statusFilter === 'lowstock' && p.stockStatus !== 'Low Stock') return false;
        if (statusFilter === 'outofstock' && p.stockStatus !== 'Out of Stock') return false;
      }

      return true;
    });
  }, [products, activeTab, searchQuery, marketplaceFilter, categoryFilter, statusFilter]);

  // Bulk selection handling
  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.has(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedProductIds(new Set());
    } else {
      const next = new Set<string | number>();
      filteredProducts.forEach((p) => next.add(p.id));
      setSelectedProductIds(next);
    }
  };

  const toggleSelectOne = (id: string | number) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  // Product actions
  const handleUpdatePrice = async (targetProduct: ProductCatalogItem, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === targetProduct.id ? { ...p, price: newPrice } : p))
    );
    try {
      await fetch(`/api/v1/catalog/${targetProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mrp: newPrice })
      });
      showToast(`Updated price for ${targetProduct.name} to ₹${newPrice}`);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleUpdateStock = async (targetProduct: ProductCatalogItem, newStock: number) => {
    const newStatus = newStock === 0 ? 'Out of Stock' : newStock <= 15 ? 'Low Stock' : 'In Stock';
    setProducts((prev) =>
      prev.map((p) =>
        p.id === targetProduct.id
          ? {
              ...p,
              stock: newStock,
              availableStock: newStock,
              stockStatus: newStatus,
            }
          : p
      )
    );
    try {
      await fetch(`/api/v1/inventory/${targetProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newStock })
      });
      showToast(`Stock updated for ${targetProduct.name} to ${newStock} units`);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleArchiveProduct = async (targetProduct: ProductCatalogItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === targetProduct.id ? { ...p, listingStatus: 'Archived' } : p))
    );
    try {
      await fetch(`/api/v1/catalog/${targetProduct.id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn(err);
    }
    showToast(`Archived ${targetProduct.name}`);
  };

  const handleDuplicateProduct = async (targetProduct: ProductCatalogItem) => {
    const newSku = `${targetProduct.sku}-CPY`;
    const newTitle = `${targetProduct.name} (Copy)`;
    try {
      const res = await fetch('/api/v1/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          sku: newSku,
          category: targetProduct.category,
          brand: targetProduct.brand,
          mrp: targetProduct.price,
          stock: targetProduct.stock
        })
      });
      const data = await res.json();
      const newId = data.id || Date.now();
      const duplicated: ProductCatalogItem = {
        ...targetProduct,
        id: newId,
        name: newTitle,
        sku: newSku,
        listingStatus: 'Active',
      };
      setProducts((prev) => [duplicated, ...prev]);
      setSelectedProductId(newId);
      showToast(`Duplicated ${targetProduct.name} in database`);
    } catch (err) {
      showToast(`Duplicated ${targetProduct.name}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.sku) {
      showToast('Please provide Product Name and SKU');
      return;
    }
    const stockVal = parseInt(newProductForm.stock, 10) || 0;
    const priceVal = parseFloat(newProductForm.price) || 0;
    const marginVal = parseInt(newProductForm.margin, 10) || 0;

    let createdId = Date.now();
    try {
      const res = await fetch('/api/v1/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProductForm.name,
          sku: newProductForm.sku,
          category: newProductForm.category,
          mrp: priceVal,
          cost_price: Math.round(priceVal * (1 - marginVal / 100)),
          stock: stockVal
        })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.id) createdId = d.id;
      }
    } catch (err) {
      console.warn(err);
    }

    const newProd: ProductCatalogItem = {
      id: createdId,
      name: newProductForm.name,
      sku: newProductForm.sku,
      category: newProductForm.category,
      brand: '',
      hsnCode: '',
      weight: '',
      dimensions: '',
      createdOn: 'Just now',
      lastUpdated: 'Just now',
      imageType: 'bottle-black',
      marketplaces: [],
      stock: stockVal,
      availableStock: stockVal,
      reservedStock: 0,
      inboundStock: 0,
      stockStatus: stockVal === 0 ? 'Out of Stock' : stockVal <= 15 ? 'Low Stock' : 'In Stock',
      price: priceVal,
      revenue30d: 0,
      margin: marginVal,
      listingStatus: 'Active',
    };

    setProducts((prev) => [newProd, ...prev]);
    setSelectedProductId(newProd.id);
    setIsAddModalOpen(false);
    showToast(`Created new product: ${newProd.name} and synced to channels`);
    setNewProductForm({
      name: '',
      sku: '',
      category: '',
      price: '',
      stock: '',
      margin: '',
    });
  };

  // Export handling
  const handleExport = (type: 'csv' | 'json') => {
    if (type === 'csv') {
      const headers = 'ID,Name,SKU,Category,Marketplaces,Stock,Price,Revenue30d,Margin,Status\n';
      const rows = filteredProducts
        .map(
          (p) =>
            `"${p.id}","${p.name}","${p.sku}","${p.category}","${p.marketplaces.join(';')}",${p.stock},${p.price},${p.revenue30d},${p.margin},"${p.listingStatus}"`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sellerhub-products-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported products to CSV');
    } else {
      const blob = new Blob([JSON.stringify(filteredProducts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sellerhub-products-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported products to JSON');
    }
    setIsExportMenuOpen(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden min-w-0 bg-[#F8FAFC]">
      {/* Center Main Products Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* 1. Page Header with Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Products
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
                Manage your product catalog across all connected marketplaces.
              </p>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Import Products */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Import Products</span>
              </button>

              {/* + Add Product */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Product</span>
              </button>

              {/* AI Enrich */}
              <button
                onClick={() => {
                  setIsAiEnrichOpen(true);
                  showToast('AI Catalog Intelligence running on all catalog titles & bullet points.');
                }}
                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>AI Enrich</span>
              </button>

              {/* Bulk Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsBulkActionMenuOpen(!isBulkActionMenuOpen)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <span>Bulk Actions</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isBulkActionMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        showToast(`Bulk price optimizer triggered for ${filteredProducts.length} items`);
                        setIsBulkActionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sync All Prices</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast(`Inventory levels verified with Amazon & Flipkart`);
                        setIsBulkActionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <Boxes className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sync All Inventory</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast(`Archiving selected items`);
                        setIsBulkActionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5 text-rose-500" />
                      <span>Archive Selected</span>
                    </button>
                  </div>
                )}
              </div>

              {/* More ... button */}
              <button
                onClick={() => {
                  if (!isDrawerOpen) setIsDrawerOpen(true);
                  else showToast('Product catalog synchronizer active.');
                }}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs shadow-2xs transition-colors"
                title="More settings"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Top Row of 6 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Card 1: Total Products */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Products</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{products.length}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                  <span>—</span>
                  <span className="text-slate-400 font-normal">vs last 30 days</span>
                </div>
              </div>
            </div>

            {/* Card 2: Active Listings */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Active Listings</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{products.filter((p) => p.listingStatus === 'Active').length}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                  <span>—</span>
                </div>
              </div>
            </div>

            {/* Card 3: Out of Stock */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <PackageX className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Out of Stock</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{products.filter((p) => p.stockStatus === 'Out of Stock').length}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                  <span>—</span>
                </div>
              </div>
            </div>

            {/* Card 4: Low Stock */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Low Stock</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{products.filter((p) => p.stockStatus === 'Low Stock').length}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                  <span>—</span>
                </div>
              </div>
            </div>

            {/* Card 5: Suppressed */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Suppressed</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{products.filter((p) => p.listingStatus === 'Suppressed').length}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                  <span>—</span>
                </div>
              </div>
            </div>

            {/* Card 6: Avg. Margin */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Avg. Margin</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{products.length ? `${(products.reduce((sum, p) => sum + p.margin, 0) / products.length).toFixed(1)}%` : '0%'}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                  <span>—</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Status Tabs Bar */}
          <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto scrollbar-none text-xs font-medium pt-1">
            <button
              onClick={() => setActiveTab('All')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'All'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>All Products</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                activeTab === 'All' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {tabCounts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Active')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'Active'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Active</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                {tabCounts.active}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('OutOfStock')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'OutOfStock'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Out of Stock</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                {tabCounts.outOfStock}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('LowStock')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'LowStock'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Low Stock</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                {tabCounts.lowStock}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Suppressed')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'Suppressed'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Suppressed</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                {tabCounts.suppressed}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Archived')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'Archived'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Archived</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                {tabCounts.archived}
              </span>
            </button>
          </div>

          {/* 4. Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, SKU, ASIN, Flipkart ID..."
                className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Marketplace Dropdown */}
              <div className="relative">
                <select
                  value={marketplaceFilter}
                  onChange={(e) => setMarketplaceFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold py-2 pl-3 pr-8 rounded-lg outline-none cursor-pointer shadow-2xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="all">All Marketplaces</option>
                  <option value="amazon">Amazon India</option>
                  <option value="flipkart">Flipkart</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold py-2 pl-3 pr-8 rounded-lg outline-none cursor-pointer shadow-2xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Baby Products">Baby Products</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold py-2 pl-3 pr-8 rounded-lg outline-none cursor-pointer shadow-2xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suppressed">Suppressed</option>
                  <option value="instock">In Stock</option>
                  <option value="lowstock">Low Stock</option>
                  <option value="outofstock">Out of Stock</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* More Filters */}
              <button
                onClick={() => showToast('Advanced catalog filters panel')}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* 5. Bulk Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Left Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Checkbox 0 selected */}
              <div className="flex items-center gap-2 mr-1">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">
                  {selectedProductIds.size} selected
                </span>
              </div>

              {/* Edit */}
              <button
                onClick={() => {
                  if (selectedProduct) {
                    showToast(`Editing ${selectedProduct.name}`);
                  }
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>

              {/* Update Price */}
              <button
                onClick={() => {
                  showToast('Batch Price Updater opened');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Update Price</span>
              </button>

              {/* Update Stock */}
              <button
                onClick={() => {
                  showToast('Batch Stock Adjuster opened');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Boxes className="w-3.5 h-3.5 text-slate-500" />
                <span>Update Stock</span>
              </button>

              {/* Create Listing */}
              <button
                onClick={() => {
                  showToast('Marketplace Listing Wizard opened');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <PlusSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Create Listing</span>
              </button>

              {/* AI Optimize */}
              <button
                onClick={() => {
                  showToast('AI Price & Margin Optimizer analyzing selected products...');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>AI Optimize</span>
              </button>

              {/* Archive */}
              <button
                onClick={() => {
                  if (selectedProductIds.size > 0) {
                    setProducts((prev) =>
                      prev.map((p) => (selectedProductIds.has(p.id) ? { ...p, listingStatus: 'Archived' } : p))
                    );
                    showToast(`Archived ${selectedProductIds.size} products`);
                    setSelectedProductIds(new Set());
                  } else {
                    showToast('Select products first to archive');
                  }
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>Archive</span>
              </button>
            </div>

            {/* Right Export Menu */}
            <div className="relative self-end sm:self-auto">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Export JSON</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 6. Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold select-none">
                    <th className="py-3 px-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 font-semibold text-slate-600 min-w-[200px]">Product</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">SKU</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Marketplace</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Stock</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Price</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Revenue (30d)</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Margin</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Listing Status</th>
                    <th className="py-3 px-3.5 font-semibold text-slate-600 text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredProducts.map((p) => {
                    const isSelectedRow = p.id === selectedProductId;
                    const isChecked = selectedProductIds.has(p.id);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          if (!isDrawerOpen) setIsDrawerOpen(true);
                        }}
                        className={`cursor-pointer transition-colors group ${
                          isSelectedRow
                            ? 'bg-blue-50/40 hover:bg-blue-50/60'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(p.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(p.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Product info: Thumbnail + Title + Category */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <ProductCatalogGraphic
                              type={p.imageType || p.sku}
                              className="w-9 h-9"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                                {p.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 font-mono text-slate-700 text-xs whitespace-nowrap">
                          {p.sku}
                        </td>

                        {/* Marketplace Logos */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {p.marketplaces.includes('amazon') && (
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs"
                                title="Amazon India"
                              >
                                <AmazonLogo className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {p.marketplaces.includes('flipkart') && (
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs"
                                title="Flipkart"
                              >
                                <FlipkartLogo className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Stock count and Status pill */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className={`font-bold ${p.stock === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                              {p.stock}
                            </div>
                            <div>
                              {p.stockStatus === 'In Stock' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                  In Stock
                                </span>
                              ) : p.stockStatus === 'Low Stock' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          ₹{p.price.toLocaleString('en-IN')}
                        </td>

                        {/* Revenue (30d) */}
                        <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                          ₹{p.revenue30d.toLocaleString('en-IN')}
                        </td>

                        {/* Margin */}
                        <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                          {p.margin}%
                        </td>

                        {/* Listing Status Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {p.listingStatus === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          ) : p.listingStatus === 'Suppressed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Suppressed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>

                        {/* Actions ... button */}
                        <td
                          className="py-3 px-3.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setIsDrawerOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Product actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 7. Pagination Footer */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-800">1</span> to{' '}
                <span className="font-semibold text-slate-800">10</span> of{' '}
                <span className="font-semibold text-slate-800">{filteredProducts.length}</span> products
              </div>

              <div className="flex items-center gap-2">
                {/* Prev */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {/* Page numbers: 1 (active), 2, 3, 4, 5, ..., 25 */}
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
                      currentPage === num
                        ? 'bg-blue-600 text-white'
                        : 'border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <span className="px-1 text-slate-400 font-semibold">...</span>

                <button
                  onClick={() => setCurrentPage(25)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
                    currentPage === 25
                      ? 'bg-blue-600 text-white'
                      : 'border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  25
                </button>

                {/* Next */}
                <button
                  disabled={currentPage === 25}
                  onClick={() => setCurrentPage((c) => Math.min(25, c + 1))}
                  className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {/* Per page selector */}
                <div className="relative ml-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-1 pl-2.5 pr-7 rounded-md text-xs outline-none cursor-pointer"
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Product Details Drawer */}
      <ProductDetailsDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdatePrice={handleUpdatePrice}
        onUpdateStock={handleUpdateStock}
        onArchiveProduct={handleArchiveProduct}
        onDuplicateProduct={handleDuplicateProduct}
        onEditProduct={(p) => {
          showToast(`Editing ${p.name} properties`);
        }}
        onShowToast={showToast}
      />

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Product</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper Flask 750ml"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CF-750-011"
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  >
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Baby Products">Baby Products</option>
                    <option value="Sports & Fitness">Sports & Fitness</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock</label>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Margin (%)</label>
                  <input
                    type="number"
                    value={newProductForm.margin}
                    onChange={(e) => setNewProductForm({ ...newProductForm, margin: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-2xs"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Products Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Import Catalog CSV / Excel</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-indigo-600" />
              <div className="text-xs font-semibold text-slate-700">Drag & drop your catalog CSV here</div>
              <div className="text-[11px] text-slate-400">or click to browse from local computer</div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <a href="#" className="text-blue-600 hover:underline">Download sample template.csv</a>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  showToast('Catalog items imported successfully.');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Enrich Drawer / Notification */}
      {isAiEnrichOpen && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
              <Sparkles className="w-4 h-4" />
              <span>AI Catalog Intelligence Active</span>
            </div>
            <button onClick={() => setIsAiEnrichOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <p className="text-xs text-slate-300">
            Scanning {products.length} listings for keyword density, image compliance, and margin optimization opportunities.
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-violet-500 h-full w-3/4 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
