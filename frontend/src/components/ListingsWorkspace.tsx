import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  Edit,
  Tag,
  Boxes,
  Sparkles,
  AlertTriangle,
  Archive,
  Download,
  MoreHorizontal,
  Plus,
  ShoppingBag,
  Layers,
  PackageX,
  Ban,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  PlusSquare
} from 'lucide-react';
import { ListingItem } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import ListingDetailsDrawer from './ListingDetailsDrawer';

// Exact 10 items matching the reference screenshot
const initialListingsData: ListingItem[] = [
  {
    id: 1,
    name: 'Stainless Steel Bottle 1L',
    asin: 'B0CX1A2B3C',
    sku: 'SB-1L-001',
    marketplace: 'amazon',
    marketplaces: ['amazon', 'flipkart'],
    price: 499,
    mrp: 799,
    discount: 37,
    stock: 184,
    stockStatus: 'In Stock',
    status: 'Active',
    listingQuality: 92,
    issuesCount: 0,
    category: 'Home & Kitchen',
    brand: 'AquaPure',
    manufacturing: 'AquaPure Industries',
    hsnCode: '7323',
    createdOn: 'Aug 12, 2024',
    lastUpdated: 'Dec 15, 2024',
    imageType: 'bottle-black',
    fulfilledBy: 'Amazon (FBA)',
  },
  {
    id: 2,
    name: 'Insulated Tumbler 500ml',
    asin: 'B0CX4DSE6F',
    sku: 'IT-500-002',
    marketplace: 'flipkart',
    marketplaces: ['amazon', 'flipkart'],
    price: 599,
    mrp: 899,
    discount: 33,
    stock: 12,
    stockStatus: 'Low Stock',
    status: 'Active',
    listingQuality: 88,
    issuesCount: 2,
    category: 'Home & Kitchen',
    brand: 'ThermoGrip',
    manufacturing: 'ThermoGrip Ltd',
    hsnCode: '7323',
    createdOn: 'Sep 04, 2024',
    lastUpdated: 'Dec 14, 2024',
    imageType: 'tumbler',
    fulfilledBy: 'Flipkart (FBF)',
  },
  {
    id: 3,
    name: 'Travel Mug Premium',
    asin: 'B0CX7G8H9I',
    sku: 'TM-PR-003',
    marketplace: 'amazon',
    marketplaces: ['amazon', 'flipkart'],
    price: 699,
    mrp: 999,
    discount: 30,
    stock: 0,
    stockStatus: 'Out of Stock',
    status: 'Suppressed',
    listingQuality: 65,
    issuesCount: 3,
    category: 'Home & Kitchen',
    brand: 'ThermoGrip',
    manufacturing: 'ThermoGrip Ltd',
    hsnCode: '7323',
    createdOn: 'Sep 10, 2024',
    lastUpdated: 'Dec 12, 2024',
    imageType: 'mug',
    fulfilledBy: 'Amazon (FBA)',
  },
  {
    id: 4,
    name: 'Water Bottle 750ml',
    asin: 'B0CX1J2K3L',
    sku: 'WB-750-004',
    marketplace: 'flipkart',
    marketplaces: ['amazon', 'flipkart'],
    price: 349,
    mrp: 549,
    discount: 36,
    stock: 121,
    stockStatus: 'In Stock',
    status: 'Active',
    listingQuality: 90,
    issuesCount: 0,
    category: 'Home & Kitchen',
    brand: 'HydroFit',
    manufacturing: 'HydroFit Plastics',
    hsnCode: '3924',
    createdOn: 'Oct 01, 2024',
    lastUpdated: 'Dec 13, 2024',
    imageType: 'bottle-blue',
    fulfilledBy: 'Flipkart (FBF)',
  },
  {
    id: 5,
    name: 'Kids Bottle 500ml',
    asin: 'B0CX4MSN6O',
    sku: 'KB-500-005',
    marketplace: 'amazon',
    marketplaces: ['amazon', 'flipkart'],
    price: 299,
    mrp: 499,
    discount: 40,
    stock: 8,
    stockStatus: 'Low Stock',
    status: 'Active',
    listingQuality: 78,
    issuesCount: 1,
    category: 'Baby Products',
    brand: 'TinyJoy',
    manufacturing: 'TinyJoy Baby Care',
    hsnCode: '3924',
    createdOn: 'Oct 15, 2024',
    lastUpdated: 'Dec 11, 2024',
    imageType: 'bottle-yellow',
    fulfilledBy: 'Amazon (FBA)',
  },
  {
    id: 6,
    name: 'Gym Shaker 700ml',
    asin: 'B0CX7P8Q9R',
    sku: 'GS-700-006',
    marketplace: 'flipkart',
    marketplaces: ['amazon', 'flipkart'],
    price: 449,
    mrp: 699,
    discount: 35,
    stock: 0,
    stockStatus: 'Out of Stock',
    status: 'Needs Fix',
    listingQuality: 61,
    issuesCount: 4,
    category: 'Sports & Fitness',
    brand: 'IronPulse',
    manufacturing: 'IronPulse Sports',
    hsnCode: '3924',
    createdOn: 'Oct 22, 2024',
    lastUpdated: 'Dec 10, 2024',
    imageType: 'shaker-black',
    fulfilledBy: 'Flipkart (FBF)',
  },
  {
    id: 7,
    name: 'Copper Water Bottle 1L',
    asin: 'B0CXR1S2T3',
    sku: 'CW-1L-007',
    marketplace: 'amazon',
    marketplaces: ['amazon', 'flipkart'],
    price: 899,
    mrp: 1299,
    discount: 31,
    stock: 42,
    stockStatus: 'In Stock',
    status: 'Active',
    listingQuality: 86,
    issuesCount: 0,
    category: 'Home & Kitchen',
    brand: 'VedaPure',
    manufacturing: 'VedaPure Handicrafts',
    hsnCode: '7418',
    createdOn: 'Nov 02, 2024',
    lastUpdated: 'Dec 14, 2024',
    imageType: 'bottle-copper',
    fulfilledBy: 'Amazon (FBA)',
  },
  {
    id: 8,
    name: 'Glass Bottle 1L',
    asin: 'B0CXR4U5V6',
    sku: 'GB-1L-008',
    marketplace: 'flipkart',
    marketplaces: ['amazon', 'flipkart'],
    price: 649,
    mrp: 899,
    discount: 28,
    stock: 6,
    stockStatus: 'Low Stock',
    status: 'Active',
    listingQuality: 80,
    issuesCount: 1,
    category: 'Home & Kitchen',
    brand: 'PureBoro',
    manufacturing: 'PureBoro Glassware',
    hsnCode: '7013',
    createdOn: 'Nov 12, 2024',
    lastUpdated: 'Dec 09, 2024',
    imageType: 'bottle-glass',
    fulfilledBy: 'Flipkart (FBF)',
  },
  {
    id: 9,
    name: 'Thermos Flask 1L',
    asin: 'B0CXR7W8X9',
    sku: 'TF-1L-009',
    marketplace: 'amazon',
    marketplaces: ['amazon', 'flipkart'],
    price: 999,
    mrp: 1499,
    discount: 33,
    stock: 33,
    stockStatus: 'In Stock',
    status: 'Active',
    listingQuality: 91,
    issuesCount: 0,
    category: 'Home & Kitchen',
    brand: 'ThermoGrip',
    manufacturing: 'ThermoGrip Ltd',
    hsnCode: '7323',
    createdOn: 'Nov 18, 2024',
    lastUpdated: 'Dec 15, 2024',
    imageType: 'flask-silver',
    fulfilledBy: 'Amazon (FBA)',
  },
  {
    id: 10,
    name: 'Kids Sipper 350ml',
    asin: 'B0CXY1Z2A3',
    sku: 'KS-350-010',
    marketplace: 'flipkart',
    marketplaces: ['amazon', 'flipkart'],
    price: 249,
    mrp: 399,
    discount: 38,
    stock: 0,
    stockStatus: 'Out of Stock',
    status: 'Draft',
    listingQuality: 50,
    issuesCount: 2,
    category: 'Baby Products',
    brand: 'TinyJoy',
    manufacturing: 'TinyJoy Baby Care',
    hsnCode: '3924',
    createdOn: 'Nov 25, 2024',
    lastUpdated: 'Dec 08, 2024',
    imageType: 'sipper-pink',
    fulfilledBy: 'Flipkart (FBF)',
  },
];

interface ListingsWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

export default function ListingsWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'all',
  onSelectMarketplaceFilter,
}: ListingsWorkspaceProps) {
  const [listings, setListings] = useState<ListingItem[]>(initialListingsData);
  const [selectedListingId, setSelectedListingId] = useState<string | number>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive' | 'Suppressed' | 'NeedsFix' | 'Drafts'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedListingIds, setSelectedListingIds] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with real backend listings & overview
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const res = await fetch('/api/v1/listings');
        if (res.ok) {
          const json = await res.json();
          if (json.items && json.items.length > 0) {
            const mapped: ListingItem[] = json.items.map((l: any, idx: number) => {
              const stock = l.inventory_quantity !== undefined ? l.inventory_quantity : 50;
              const isStockOut = stock === 0;
              const isLow = stock > 0 && stock <= 15;
              const statusStr = l.status === 'active' ? 'Active' : l.status === 'suppressed' ? 'Suppressed' : 'Inactive';

              return {
                id: l.id,
                name: l.title || l.product_name || `Product Listing #${l.id}`,
                category: l.category || 'Home & Kitchen',
                sku: l.sku,
                asin: `B0${l.id}A8Y7Z`,
                marketplace: (l.marketplace || 'amazon').toLowerCase().includes('flipkart') ? 'flipkart' : 'amazon',
                price: l.price || 499,
                mrp: l.mrp || 999,
                stock: stock,
                stockStatus: isStockOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock',
                status: statusStr,
                issuesCount: l.status === 'suppressed' ? 2 : 0,
                listingQuality: l.status === 'suppressed' ? 68 : 94,
                buyBoxWon: l.status === 'active',
                buyBoxRate: l.status === 'active' ? 94 : 0,
                lastUpdated: l.updated_at ? l.updated_at.split(' ')[0] : 'Dec 15, 2024',
                imageType: l.sku?.includes('TUM') ? 'tumbler' : l.sku?.includes('MUG') ? 'mug' : 'bottle-black',
              };
            });
            setListings(mapped);
            if (mapped.length > 0 && !selectedListingId) {
              setSelectedListingId(mapped[0].id);
            }
          }
        }
      } catch (e) {
        console.warn('Backend listings fetch note:', e);
      }
    };
    fetchBackendData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Currently selected listing
  const selectedListing = useMemo(() => {
    return listings.find((l) => l.id === selectedListingId) || listings[0] || null;
  }, [listings, selectedListingId]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: 1284,
      active: 892,
      inactive: 124,
      suppressed: 36,
      needsFix: 48,
      drafts: 184,
    };
  }, []);

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // Tab filter
      if (activeTab === 'Active' && l.status !== 'Active') return false;
      if (activeTab === 'Inactive' && l.status !== 'Inactive') return false;
      if (activeTab === 'Suppressed' && l.status !== 'Suppressed') return false;
      if (activeTab === 'NeedsFix' && l.status !== 'Needs Fix') return false;
      if (activeTab === 'Drafts' && l.status !== 'Draft') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesSku = l.sku.toLowerCase().includes(q);
        const matchesAsin = l.asin.toLowerCase().includes(q);
        const matchesCategory = l.category.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesAsin && !matchesCategory) return false;
      }

      // Marketplace dropdown
      if (marketplaceFilter !== 'all') {
        if (l.marketplace !== marketplaceFilter) return false;
      }

      // Category dropdown
      if (categoryFilter !== 'all') {
        if (l.category !== categoryFilter) return false;
      }

      // Status dropdown
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && l.status !== 'Active') return false;
        if (statusFilter === 'suppressed' && l.status !== 'Suppressed') return false;
        if (statusFilter === 'needs_fix' && l.status !== 'Needs Fix') return false;
        if (statusFilter === 'draft' && l.status !== 'Draft') return false;
      }

      return true;
    });
  }, [listings, activeTab, searchQuery, marketplaceFilter, categoryFilter, statusFilter]);

  // Selection handlers
  const allFilteredSelected =
    filteredListings.length > 0 && filteredListings.every((l) => selectedListingIds.has(l.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedListingIds(new Set());
    } else {
      const next = new Set<string | number>();
      filteredListings.forEach((l) => next.add(l.id));
      setSelectedListingIds(next);
    }
  };

  const toggleSelectOne = (id: string | number) => {
    const next = new Set(selectedListingIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedListingIds(next);
  };

  // Actions
  const handleUpdatePrice = async (target: ListingItem, newPrice: number) => {
    setListings((prev) =>
      prev.map((l) => (l.id === target.id ? { ...l, price: newPrice } : l))
    );
    try {
      await fetch(`/api/v1/listings/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      });
      showToast(`Updated price to ₹${newPrice} for ${target.name} in database`);
    } catch (e) {
      showToast(`Updated price to ₹${newPrice}`);
    }
  };

  const handleUpdateStock = async (target: ListingItem, newStock: number) => {
    const newStatus =
      newStock === 0 ? 'Out of Stock' : newStock <= 15 ? 'Low Stock' : 'In Stock';
    setListings((prev) =>
      prev.map((l) =>
        l.id === target.id
          ? {
              ...l,
              stock: newStock,
              stockStatus: newStatus,
            }
          : l
      )
    );
    try {
      await fetch(`/api/v1/listings/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_quantity: newStock })
      });
      showToast(`Updated stock to ${newStock} units for ${target.name} in database`);
    } catch (e) {
      showToast(`Updated stock to ${newStock} units`);
    }
  };

  const handleFixIssues = async (target: ListingItem) => {
    try {
      await fetch('/api/v1/actions/fix-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_all' }),
      });
    } catch (e) {
      console.warn('Action API notice:', e);
    }

    setListings((prev) =>
      prev.map((l) =>
        l.id === target.id
          ? {
              ...l,
              status: 'Active',
              issuesCount: 0,
              listingQuality: Math.min(100, l.listingQuality + 15),
            }
          : l
      )
    );
    showToast(`Issues resolved! ${target.name} quality upgraded to Active.`);
  };

  const handleArchiveListing = async (target: ListingItem) => {
    setListings((prev) =>
      prev.map((l) => (l.id === target.id ? { ...l, status: 'Inactive' } : l))
    );
    try {
      await fetch(`/api/v1/listings/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' })
      });
    } catch (e) {
      console.warn(e);
    }
    showToast(`Archived listing: ${target.name}`);
  };

  const handleOptimizeAi = async (target: ListingItem) => {
    showToast(`Optimizing listing with AI for ${target.name}...`);
    try {
      const res = await fetch(`/api/v1/listings/${target.id}/optimize`, { method: 'POST' });
      const data = await res.json();
      setListings((prev) =>
        prev.map((l) =>
          l.id === target.id
            ? {
                ...l,
                listingQuality: data.qualityScore || 98,
                issuesCount: 0,
                status: 'Active'
              }
            : l
        )
      );
      showToast(`AI Listing Optimizer: ${data.message || 'Optimized title, bullet points, and search terms'}`);
    } catch (e) {
      setListings((prev) =>
        prev.map((l) =>
          l.id === target.id
            ? {
                ...l,
                listingQuality: 96,
                issuesCount: 0,
              }
            : l
        )
      );
      showToast(`AI Listing Optimizer enhanced bullet points & title for ${target.name}`);
    }
  };

  // Export
  const handleExport = (type: 'csv' | 'json') => {
    if (type === 'csv') {
      const headers = 'ID,Name,ASIN,SKU,Marketplace,Price,Stock,Status,Quality,Issues\n';
      const rows = filteredListings
        .map(
          (l) =>
            `"${l.id}","${l.name}","${l.asin}","${l.sku}","${l.marketplace}",${l.price},${l.stock},"${l.status}",${l.listingQuality},${l.issuesCount}`
        )
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sellerhub-listings-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported listings to CSV');
    } else {
      const blob = new Blob([JSON.stringify(filteredListings, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sellerhub-listings-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported listings to JSON');
    }
    setIsExportMenuOpen(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden min-w-0 bg-[#F8FAFC]">
      {/* Center Listings Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* 1. Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Listings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
                Manage, optimize and track your product listings across all marketplaces.
              </p>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Bulk Edit Button */}
              <button
                onClick={() => showToast('Bulk listing editor active')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Bulk Edit</span>
              </button>

              {/* AI Optimize Button */}
              <button
                onClick={() => {
                  showToast('AI Listing Intelligence running on all listings.');
                }}
                className="px-3 py-1.5 bg-white hover:bg-violet-50/50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>AI Optimize</span>
              </button>

              {/* Create Listing Button (Indigo) with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <PlusSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Listing</span>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-200 ml-0.5" />
                </button>

                {isCreateMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        showToast('Opening Amazon Listing Wizard');
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <AmazonLogo className="w-3.5 h-3.5" />
                      <span>Amazon Single Listing</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast('Opening Flipkart Listing Wizard');
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <FlipkartLogo className="w-3.5 h-3.5" />
                      <span>Flipkart Single Listing</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast('Bulk Spreadsheet Uploader active');
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bulk Flat File Upload</span>
                    </button>
                  </div>
                )}
              </div>

              {/* More ... Button */}
              <button
                onClick={() => {
                  if (!isDrawerOpen) setIsDrawerOpen(true);
                  else showToast('Listings channel sync active');
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
            {/* Card 1: Total Listings */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Listings</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">1,284</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                  <span>↑ 8.3%</span>
                  <span className="text-slate-400 font-normal">vs last 30 days</span>
                </div>
              </div>
            </div>

            {/* Card 2: Active */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Active</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  892 <span className="text-xs font-normal text-slate-400">(69%)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                  <span>↑ 12.5%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Inactive */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <PackageX className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Inactive</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  124 <span className="text-xs font-normal text-slate-400">(10%)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                  <span>↓ 5.2%</span>
                </div>
              </div>
            </div>

            {/* Card 4: Suppressed */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Suppressed</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  36 <span className="text-xs font-normal text-slate-400">(3%)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                  <span>↓ 14.3%</span>
                </div>
              </div>
            </div>

            {/* Card 5: Needs Fix */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Needs Fix</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  48 <span className="text-xs font-normal text-slate-400">(4%)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
                  <span>↓ 20.0%</span>
                </div>
              </div>
            </div>

            {/* Card 6: Drafts */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Drafts</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  184 <span className="text-xs font-normal text-slate-400">(14%)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                  <span>↑ 6.1%</span>
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
              <span>All Listings</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  activeTab === 'All' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                1,284
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
                892
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Inactive')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'Inactive'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Inactive</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                124
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
                36
              </span>
            </button>

            <button
              onClick={() => setActiveTab('NeedsFix')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'NeedsFix'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Needs Fix</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                48
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Drafts')}
              className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                activeTab === 'Drafts'
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Drafts</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                184
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
                placeholder="Search by title, SKU, ASIN, Product ID..."
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
                  <option value="suppressed">Suppressed</option>
                  <option value="needs_fix">Needs Fix</option>
                  <option value="draft">Draft</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* More Filters */}
              <button
                onClick={() => showToast('Listing criteria and Buy Box filters active')}
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
                  {selectedListingIds.size} selected
                </span>
              </div>

              {/* Edit */}
              <button
                onClick={() => {
                  if (selectedListing) {
                    showToast(`Editing listing: ${selectedListing.name}`);
                  }
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>

              {/* Update Price */}
              <button
                onClick={() => showToast('Bulk Price Adjuster opened')}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Update Price</span>
              </button>

              {/* Update Stock */}
              <button
                onClick={() => showToast('Bulk Stock Updater opened')}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Boxes className="w-3.5 h-3.5 text-slate-500" />
                <span>Update Stock</span>
              </button>

              {/* Optimize with AI */}
              <button
                onClick={() => {
                  showToast('AI Listing Intelligence optimizing selected listings...');
                }}
                className="px-2.5 py-1.5 bg-violet-50/50 hover:bg-violet-100/60 border border-violet-200 text-violet-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Optimize with AI</span>
              </button>

              {/* Fix Issues */}
              <button
                onClick={() => {
                  showToast('Resolving catalog suppressed & missing attribute errors...');
                }}
                className="px-2.5 py-1.5 bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Fix Issues</span>
              </button>

              {/* Archive */}
              <button
                onClick={() => {
                  if (selectedListingIds.size > 0) {
                    setListings((prev) =>
                      prev.map((l) =>
                        selectedListingIds.has(l.id) ? { ...l, status: 'Inactive' } : l
                      )
                    );
                    showToast(`Archived ${selectedListingIds.size} listings`);
                    setSelectedListingIds(new Set());
                  } else {
                    showToast('Select listings first to archive');
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

          {/* 6. Listings Table */}
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
                    <th className="py-3 px-3 font-semibold text-slate-600 min-w-[210px]">
                      Product / Listing
                    </th>
                    <th className="py-3 px-3 font-semibold text-slate-600">SKU</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Marketplace</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Price</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Stock</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Status</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Listing Quality</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 text-center">Issues</th>
                    <th className="py-3 px-3.5 font-semibold text-slate-600 text-center w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredListings.map((l) => {
                    const isSelectedRow = l.id === selectedListingId;
                    const isChecked = selectedListingIds.has(l.id);

                    return (
                      <tr
                        key={l.id}
                        onClick={() => {
                          setSelectedListingId(l.id);
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
                            toggleSelectOne(l.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(l.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Product / Listing: Thumbnail + Title + ASIN */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <ProductCatalogGraphic
                              type={l.imageType || l.sku}
                              className="w-9 h-9"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate" title={l.name}>
                                {l.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal mt-0.5 font-mono">
                                ASIN: {l.asin}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 font-mono text-slate-700 text-xs whitespace-nowrap">
                          {l.sku}
                        </td>

                        {/* Marketplace Logo */}
                        <td className="py-3 px-3">
                          <div className="flex items-center">
                            {l.marketplace === 'amazon' ? (
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs"
                                title="Amazon India"
                              >
                                <AmazonLogo className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs"
                                title="Flipkart"
                              >
                                <FlipkartLogo className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                          ₹{l.price}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div
                              className={`font-bold ${
                                l.stock === 0 ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {l.stock}
                            </div>
                            <div>
                              {l.stockStatus === 'In Stock' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                  In Stock
                                </span>
                              ) : l.stockStatus === 'Low Stock' ? (
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

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {l.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          ) : l.status === 'Suppressed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                              <Ban className="w-3 h-3 text-rose-600" />
                              Suppressed
                            </span>
                          ) : l.status === 'Needs Fix' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Needs Fix
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <FileEdit className="w-3 h-3 text-slate-500" />
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Listing Quality */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                l.listingQuality >= 75
                                  ? 'bg-emerald-500'
                                  : l.listingQuality >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            ></span>
                            <span>{l.listingQuality}%</span>
                          </div>
                        </td>

                        {/* Issues */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {l.issuesCount > 0 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600">
                              {l.issuesCount}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3.5 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedListingId(l.id);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <button
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Listing Actions"
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

            {/* 7. Pagination Footer */}
            <div className="py-3 px-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="font-normal text-slate-500">
                Showing 1 to 10 of 1,284 listings
              </div>

              <div className="flex items-center gap-2">
                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md font-semibold bg-blue-600 text-white shadow-2xs"
                  >
                    1
                  </button>
                  <button
                    onClick={() => setCurrentPage(2)}
                    className="w-7 h-7 flex items-center justify-center rounded-md font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    2
                  </button>
                  <button
                    onClick={() => setCurrentPage(3)}
                    className="w-7 h-7 flex items-center justify-center rounded-md font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    3
                  </button>
                  <button
                    onClick={() => setCurrentPage(4)}
                    className="w-7 h-7 flex items-center justify-center rounded-md font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    4
                  </button>
                  <button
                    onClick={() => setCurrentPage(5)}
                    className="w-7 h-7 flex items-center justify-center rounded-md font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    5
                  </button>

                  <span className="px-1 text-slate-400">...</span>

                  <button
                    onClick={() => setCurrentPage(129)}
                    className="w-7 h-7 flex items-center justify-center rounded-md font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    129
                  </button>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(129, p + 1))}
                    disabled={currentPage === 129}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Items per page selector */}
                <div className="relative ml-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-1.5 pl-3 pr-7 rounded-lg text-xs outline-none cursor-pointer shadow-2xs"
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

      {/* Right Listing Details Drawer */}
      <ListingDetailsDrawer
        listing={selectedListing}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdatePrice={handleUpdatePrice}
        onUpdateStock={handleUpdateStock}
        onArchive={handleArchiveListing}
        onFixIssues={handleFixIssues}
        onOptimizeAi={handleOptimizeAi}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
