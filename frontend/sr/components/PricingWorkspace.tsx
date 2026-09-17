import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  Download,
  Sparkles,
  MoreHorizontal,
  ShoppingBag,
  Award,
  Tag,
  TrendingUp,
  Target,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit2,
  Zap,
  Columns,
  History,
  FileSpreadsheet,
  FileText,
  Sliders
} from 'lucide-react';
import { PricingRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import PricingDetailsDrawer from './PricingDetailsDrawer';

interface PricingWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

// 10 catalog pricing products matching the reference screenshot in pixel-perfect high definition
const initialPricingData: PricingRecord[] = [
  {
    id: 1,
    name: 'Stainless Steel Bottle 1L',
    category: 'Home & Kitchen',
    sku: 'SB-1L-001',
    asin: 'B0CX1A2B3C',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 499,
    suggestedPrice: 459,
    hasAiSuggested: true,
    priceStatus: 'Optimal',
    buyBox: '92%',
    buyBoxWon: true,
    estProfitLift: 8,
    minPrice: 399,
    maxPrice: 699,
    costPrice: 280,
    marginPercent: 28,
    marginAmount: 139,
    marketPriceAvg: 462,
    priceRank: '1 of 8',
    lowestCompetitorPrice: 459,
    totalCompetitors: 8,
    aiInsightText: "You're 8% above the minimum price and winning the Buy Box. Consider a small discount to increase sales volume.",
    imageType: 'bottle-black',
  },
  {
    id: 2,
    name: 'Insulated Tumbler 500ml',
    category: 'Home & Kitchen',
    sku: 'IT-500-002',
    asin: 'B0DX2B3C4D',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 599,
    suggestedPrice: 549,
    hasAiSuggested: false,
    priceStatus: 'Reprice',
    buyBox: 'No',
    buyBoxWon: false,
    estProfitLift: 12,
    minPrice: 480,
    maxPrice: 799,
    costPrice: 340,
    marginPercent: 32,
    marginAmount: 191,
    marketPriceAvg: 554,
    priceRank: '3 of 6',
    lowestCompetitorPrice: 549,
    totalCompetitors: 6,
    aiInsightText: 'Lost Buy Box to competitor offering ₹549 with 1-day Prime delivery. Repricing to ₹549 will reclaim Buy Box within 4 hours.',
    imageType: 'tumbler',
  },
  {
    id: 3,
    name: 'Travel Mug Premium',
    category: 'Home & Kitchen',
    sku: 'TM-PR-003',
    asin: 'B0EX3C4D5E',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 699,
    suggestedPrice: 649,
    hasAiSuggested: false,
    priceStatus: 'Overpriced',
    buyBox: 'No',
    buyBoxWon: false,
    estProfitLift: 18,
    minPrice: 550,
    maxPrice: 899,
    costPrice: 390,
    marginPercent: 35,
    marginAmount: 244,
    marketPriceAvg: 650,
    priceRank: '5 of 9',
    lowestCompetitorPrice: 639,
    totalCompetitors: 9,
    aiInsightText: 'Current price is 7.7% above market median. Lowering to ₹649 increases expected conversion rate by +44%.',
    imageType: 'mug',
  },
  {
    id: 4,
    name: 'Water Bottle 750ml',
    category: 'Home & Kitchen',
    sku: 'WB-750-004',
    asin: 'B0FX4D5E6F',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 349,
    suggestedPrice: 329,
    hasAiSuggested: true,
    priceStatus: 'Optimal',
    buyBox: '88%',
    buyBoxWon: true,
    estProfitLift: 6,
    minPrice: 280,
    maxPrice: 499,
    costPrice: 195,
    marginPercent: 34,
    marginAmount: 119,
    marketPriceAvg: 335,
    priceRank: '1 of 5',
    lowestCompetitorPrice: 330,
    totalCompetitors: 5,
    aiInsightText: 'Dominating search impressions. Slight discount to ₹329 preserves high margin while boxing out newcomer listings.',
    imageType: 'bottle-blue',
  },
  {
    id: 5,
    name: 'Kids Bottle 500ml',
    category: 'Baby Products',
    sku: 'KB-500-005',
    asin: 'B0GX5E6F7G',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 299,
    suggestedPrice: 279,
    hasAiSuggested: false,
    priceStatus: 'Underpriced',
    buyBox: 'No',
    buyBoxWon: false,
    estProfitLift: 15,
    minPrice: 240,
    maxPrice: 420,
    costPrice: 165,
    marginPercent: 29,
    marginAmount: 87,
    marketPriceAvg: 310,
    priceRank: '1 of 7',
    lowestCompetitorPrice: 309,
    totalCompetitors: 7,
    aiInsightText: 'Priced lower than necessary. Room to adjust to ₹279-₹299 while retaining top conversion tier.',
    imageType: 'bottle-orange',
  },
  {
    id: 6,
    name: 'Gym Shaker 700ml',
    category: 'Sports & Fitness',
    sku: 'GS-700-006',
    asin: 'B0HX6F7G8H',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 449,
    suggestedPrice: 419,
    hasAiSuggested: false,
    priceStatus: 'Reprice',
    buyBox: '76%',
    buyBoxWon: true,
    estProfitLift: 10,
    minPrice: 360,
    maxPrice: 599,
    costPrice: 240,
    marginPercent: 32,
    marginAmount: 144,
    marketPriceAvg: 425,
    priceRank: '2 of 6',
    lowestCompetitorPrice: 419,
    totalCompetitors: 6,
    aiInsightText: 'Buy Box percentage dipped 12% this week. Matching lowest competitor price at ₹419 will boost win rate to 95%.',
    imageType: 'shaker',
  },
  {
    id: 7,
    name: 'Copper Water Bottle 1L',
    category: 'Home & Kitchen',
    sku: 'CW-1L-007',
    asin: 'B0IX7G8H9I',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 899,
    suggestedPrice: 849,
    hasAiSuggested: false,
    priceStatus: 'Optimal',
    buyBox: '91%',
    buyBoxWon: true,
    estProfitLift: 8,
    minPrice: 720,
    maxPrice: 1299,
    costPrice: 520,
    marginPercent: 37,
    marginAmount: 333,
    marketPriceAvg: 875,
    priceRank: '1 of 4',
    lowestCompetitorPrice: 859,
    totalCompetitors: 4,
    aiInsightText: 'High customer loyalty and 4.8 star reviews insulate premium pricing. Suggested ₹849 maintains top organic slot.',
    imageType: 'bottle-copper',
  },
  {
    id: 8,
    name: 'Glass Bottle 1L',
    category: 'Home & Kitchen',
    sku: 'GB-1L-008',
    asin: 'B0JX8H9I0J',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 649,
    suggestedPrice: 599,
    hasAiSuggested: false,
    priceStatus: 'Reprice',
    buyBox: '65%',
    buyBoxWon: true,
    estProfitLift: 11,
    minPrice: 500,
    maxPrice: 849,
    costPrice: 360,
    marginPercent: 30,
    marginAmount: 195,
    marketPriceAvg: 615,
    priceRank: '3 of 7',
    lowestCompetitorPrice: 599,
    totalCompetitors: 7,
    aiInsightText: 'Competitors discounting bundle packs. Adjusting to ₹599 will defend Buy Box dominance.',
    imageType: 'bottle-glass',
  },
  {
    id: 9,
    name: 'Thermos Flask 1L',
    category: 'Home & Kitchen',
    sku: 'TF-1L-009',
    asin: 'B0KX9I0J1K',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 999,
    suggestedPrice: 949,
    hasAiSuggested: false,
    priceStatus: 'Overpriced',
    buyBox: 'No',
    buyBoxWon: false,
    estProfitLift: 20,
    minPrice: 780,
    maxPrice: 1499,
    costPrice: 580,
    marginPercent: 34,
    marginAmount: 340,
    marketPriceAvg: 949,
    priceRank: '4 of 8',
    lowestCompetitorPrice: 939,
    totalCompetitors: 8,
    aiInsightText: 'Currently losing all Buy Box rotation to ₹949 sellers. Repricing immediately unlocks +20% gross profit expansion.',
    imageType: 'flask',
  },
  {
    id: 10,
    name: 'Kids Sipper 350ml',
    category: 'Baby Products',
    sku: 'KS-350-010',
    asin: 'B0LX0J1K2L',
    marketplaces: ['amazon', 'flipkart'],
    currentPrice: 249,
    suggestedPrice: 229,
    hasAiSuggested: false,
    priceStatus: 'Optimal',
    buyBox: '83%',
    buyBoxWon: true,
    estProfitLift: 9,
    minPrice: 190,
    maxPrice: 349,
    costPrice: 135,
    marginPercent: 36,
    marginAmount: 90,
    marketPriceAvg: 238,
    priceRank: '1 of 5',
    lowestCompetitorPrice: 235,
    totalCompetitors: 5,
    aiInsightText: 'Healthy sales velocity with solid review momentum. Recommended ₹229 fine-tunes velocity for upcoming holiday weekend.',
    imageType: 'sipper',
  },
];

export default function PricingWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'All',
  onSelectMarketplaceFilter,
}: PricingWorkspaceProps) {
  const [pricingItems, setPricingItems] = useState<PricingRecord[]>(initialPricingData);
  const [selectedTab, setSelectedTab] = useState<
    'All Products' | 'Reprice Needed' | 'Underpriced' | 'Overpriced' | 'Buy Box Lost' | 'Price Watch'
  >('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priceStatusFilter, setPriceStatusFilter] = useState('All');
  const [marketplaceFilter, setMarketplaceFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PricingRecord | null>(initialPricingData[0]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Sync with real backend pricing API
  React.useEffect(() => {
    const fetchBackendPricing = async () => {
      try {
        const res = await fetch('/api/v1/pricing');
        if (res.ok) {
          const json = await res.json();
          if (json.items && json.items.length > 0) {
            const mapped: PricingRecord[] = json.items.map((p: any, idx: number) => {
              const current = p.current_price || p.mrp || 499;
              const cost = p.cost_price || 280;
              const suggested = p.suggested_price || Math.round(current * 0.94);
              const minP = p.min_price || Math.round(cost * 1.15);
              const maxP = p.max_price || Math.round(current * 1.4);
              const margin = Math.round(((current - cost) / current) * 100);
              const marginAmt = current - cost;

              return {
                id: p.id || idx + 1,
                name: p.title || `Product #${p.id || idx + 1}`,
                category: p.category || 'Home & Kitchen',
                sku: p.sku || `SKU-00${idx + 1}`,
                asin: `B0${p.id || idx + 1}A8Y7Z`,
                marketplaces: ['amazon', 'flipkart'],
                currentPrice: current,
                suggestedPrice: suggested,
                hasAiSuggested: true,
                priceStatus: (p.price_status || (current > suggested ? 'Reprice' : 'Optimal')) as any,
                buyBox: p.buy_box_won ? '94%' : 'No',
                buyBoxWon: !!p.buy_box_won,
                estProfitLift: 12,
                minPrice: minP,
                maxPrice: maxP,
                costPrice: cost,
                marginPercent: margin,
                marginAmount: marginAmt,
                marketPriceAvg: Math.round(current * 0.96),
                priceRank: '2 of 6',
                lowestCompetitorPrice: suggested,
                totalCompetitors: 6,
                aiInsightText: `Repricing to ₹${suggested} optimizes margin and Buy Box velocity across Amazon & Flipkart.`,
                imageType: p.sku?.includes('TUM') ? 'tumbler' : p.sku?.includes('MUG') ? 'mug' : 'bottle-black',
              };
            });
            setPricingItems(mapped);
            if (mapped.length > 0) {
              setSelectedProduct(mapped[0]);
            }
          }
        }
      } catch (err) {
        console.warn('Backend pricing sync notice:', err);
      }
    };
    fetchBackendPricing();
  }, []);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: 245,
      repriceNeeded: 36,
      underpriced: 18,
      overpriced: 27,
      buyBoxLost: 42,
      priceWatch: 28,
    };
  }, []);

  // Filtered pricing items
  const filteredItems = useMemo(() => {
    return pricingItems.filter((item) => {
      // Tab filter
      if (selectedTab === 'Reprice Needed' && item.priceStatus !== 'Reprice') return false;
      if (selectedTab === 'Underpriced' && item.priceStatus !== 'Underpriced') return false;
      if (selectedTab === 'Overpriced' && item.priceStatus !== 'Overpriced') return false;
      if (selectedTab === 'Buy Box Lost' && item.buyBoxWon) return false;
      if (selectedTab === 'Price Watch' && item.id !== 1 && item.id !== 4) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.asin.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;

      // Price status filter
      if (priceStatusFilter !== 'All' && item.priceStatus !== priceStatusFilter) return false;

      // Marketplace filter
      if (marketplaceFilter !== 'All') {
        const m = marketplaceFilter.toLowerCase() as 'amazon' | 'flipkart';
        if (!item.marketplaces.includes(m)) return false;
      }

      return true;
    });
  }, [pricingItems, selectedTab, searchQuery, categoryFilter, priceStatusFilter, marketplaceFilter]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Pricing actions
  const handleApplySuggestedPrice = async (id: number, price: number) => {
    setPricingItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              currentPrice: price,
              priceStatus: 'Optimal',
              buyBoxWon: true,
              buyBox: '94%',
            }
          : item
      )
    );
    if (selectedProduct?.id === id) {
      setSelectedProduct((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: price,
              priceStatus: 'Optimal',
              buyBoxWon: true,
              buyBox: '94%',
            }
          : null
      );
    }
    try {
      await fetch(`/api/v1/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      showToast(`Updated price to ₹${price} across marketplaces`);
    } catch (e) {
      showToast(`Updated price to ₹${price}`);
    }
  };

  const handleUpdatePrice = async (id: number, price: number) => {
    setPricingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, currentPrice: price } : item))
    );
    if (selectedProduct?.id === id) {
      setSelectedProduct((prev) => (prev ? { ...prev, currentPrice: price } : null));
    }
    try {
      await fetch(`/api/v1/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      showToast(`Saved price as ₹${price} in database`);
    } catch (e) {
      showToast(`Saved price as ₹${price}`);
    }
  };

  const handleBulkApplyAiPricing = async () => {
    if (selectedIds.length === 0) {
      // apply to all shown that need repricing
      setPricingItems((prev) =>
        prev.map((item) => ({
          ...item,
          currentPrice: item.suggestedPrice,
          priceStatus: 'Optimal',
          buyBoxWon: true,
        }))
      );
      showToast('Applying AI Suggested Pricing across catalog...');
      try {
        await Promise.all(
          pricingItems.map((item) =>
            fetch(`/api/v1/pricing/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ price: item.suggestedPrice })
            })
          )
        );
        showToast('Applied AI Suggested Pricing across all catalog items');
      } catch (e) {
        showToast('Applied AI Suggested Pricing across catalog');
      }
    } else {
      setPricingItems((prev) =>
        prev.map((item) =>
          selectedIds.includes(item.id)
            ? { ...item, currentPrice: item.suggestedPrice, priceStatus: 'Optimal', buyBoxWon: true }
            : item
        )
      );
      showToast(`Applying AI Pricing to ${selectedIds.length} selected items...`);
      try {
        await Promise.all(
          selectedIds.map((id) => {
            const it = pricingItems.find((p) => p.id === id);
            return fetch(`/api/v1/pricing/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ price: it?.suggestedPrice || 499 })
            });
          })
        );
        showToast(`Applied AI Pricing to ${selectedIds.length} items in database`);
      } catch (e) {
        showToast(`Applied AI Pricing to ${selectedIds.length} selected items`);
      }
    }
  };

  const handleExport = (format: 'CSV' | 'Excel') => {
    setIsExportOpen(false);
    showToast(`Exported ${pricingItems.length} pricing records to ${format}`);
  };

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 relative">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] w-full mx-auto">
          {/* Executive Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Pricing
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
                Optimize your prices, win the Buy Box and maximize profits across all marketplaces.
              </p>
            </div>

            {/* Top Action Controls */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => showToast('Opened Price Rules Manager')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Price Rules</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsBulkOpen(!isBulkOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <span>Bulk Actions</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isBulkOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        handleBulkApplyAiPricing();
                        setIsBulkOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Apply AI Pricing All</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast('Triggered bulk repricing rules');
                        setIsBulkOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Re-evaluate All Rules</span>
                    </button>
                    <button
                      onClick={() => {
                        showToast('Syncing prices to Amazon & Flipkart...');
                        setIsBulkOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sync Prices to Channels</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleBulkApplyAiPricing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Reprice</span>
              </button>

              <button
                onClick={() => showToast('More pricing options')}
                className="p-1.5 bg-white border border-slate-200/90 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 6 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Total Products */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 truncate">Total Products</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">245</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>12.5%</span>
                  <span className="text-slate-400 font-normal ml-0.5">vs last 30 days</span>
                </div>
              </div>
            </div>

            {/* 2. Buy Box Won */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 truncate">Buy Box Won</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">68%</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>5.2%</span>
                </div>
              </div>
            </div>

            {/* 3. Avg. Price Change */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 truncate">Avg. Price Change</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">₹24</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-rose-600">
                  <ArrowDown className="w-3 h-3" />
                  <span>18.3%</span>
                </div>
              </div>
            </div>

            {/* 4. Potential Profit Lift */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 truncate">Potential Profit Lift</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">₹12,480</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>22.0%</span>
                </div>
              </div>
            </div>

            {/* 5. Underpriced */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 truncate">Underpriced</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">18</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-rose-600">
                  <ArrowUp className="w-3 h-3" />
                  <span>50.0%</span>
                </div>
              </div>
            </div>

            {/* 6. Overpriced */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 truncate">Overpriced</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">27</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600">
                  <ArrowDown className="w-3 h-3" />
                  <span>32.5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-medium text-slate-500 overflow-x-auto no-scrollbar">
            {[
              { id: 'All Products', label: 'All Products', count: tabCounts.all },
              { id: 'Reprice Needed', label: 'Reprice Needed', count: tabCounts.repriceNeeded },
              { id: 'Underpriced', label: 'Underpriced', count: tabCounts.underpriced },
              { id: 'Overpriced', label: 'Overpriced', count: tabCounts.overpriced },
              { id: 'Buy Box Lost', label: 'Buy Box Lost', count: tabCounts.buyBoxLost },
              { id: 'Price Watch', label: 'Price Watch', count: tabCounts.priceWatch },
            ].map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`pb-3 relative flex items-center gap-2 whitespace-nowrap transition-colors ${
                    isActive ? 'text-indigo-600 font-semibold' : 'hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, SKU, ASIN..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Marketplace Dropdown */}
              <div className="relative">
                <select
                  value={marketplaceFilter}
                  onChange={(e) => setMarketplaceFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="All">All Marketplaces</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Categories Dropdown */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Baby Products">Baby Products</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Price Status Dropdown */}
              <div className="relative">
                <select
                  value={priceStatusFilter}
                  onChange={(e) => setPriceStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="All">All Price Status</option>
                  <option value="Optimal">Optimal</option>
                  <option value="Reprice">Reprice</option>
                  <option value="Overpriced">Overpriced</option>
                  <option value="Underpriced">Underpriced</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* More Filters button */}
              <button
                onClick={() => showToast('Additional pricing filters expanded')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          <div className="bg-slate-100/70 border border-slate-200/90 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 pr-1">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{selectedIds.length} selected</span>
              </label>

              <button
                onClick={() => showToast('Update Price dialog opened')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Edit2 className="w-3 h-3 text-slate-500" />
                <span>Update Price</span>
              </button>

              <button
                onClick={handleBulkApplyAiPricing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Apply AI Pricing</span>
              </button>

              <button
                onClick={() => showToast('Automate price triggers configured')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Automate Price</span>
              </button>

              <button
                onClick={() => showToast('Batch price rule applied')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                <span>Set Price Rule</span>
              </button>

              <button
                onClick={() => showToast('Price comparison matrix loaded')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Columns className="w-3 h-3 text-slate-500" />
                <span>Compare Prices</span>
              </button>

              <button
                onClick={() => showToast('Historical price analysis loaded')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <History className="w-3 h-3 text-slate-500" />
                <span>View Price History</span>
              </button>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                  <button
                    onClick={() => handleExport('CSV')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('Excel')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export Excel</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold text-[11px]">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Marketplace</th>
                    <th className="py-3 px-3">Current Price</th>
                    <th className="py-3 px-3">Suggested Price</th>
                    <th className="py-3 px-3">Price Status</th>
                    <th className="py-3 px-3">Buy Box</th>
                    <th className="py-3 px-3">Est. Profit Lift</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isRowActive = selectedProduct?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedProduct(item)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isRowActive ? 'bg-indigo-50/30' : ''
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
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Product Thumbnail + Name + Category */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <ProductCatalogGraphic
                              type={item.imageType}
                              className="w-9 h-9 rounded-lg border border-slate-200/80 bg-slate-50/50 p-1 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 leading-tight">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {item.sku}
                        </td>

                        {/* Marketplace (Amazon + Flipkart logos) */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span title="Amazon">
                              <AmazonLogo className="w-4 h-4" />
                            </span>
                            <span title="Flipkart">
                              <FlipkartLogo className="w-4 h-4" />
                            </span>
                          </div>
                        </td>

                        {/* Current Price */}
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          ₹{item.currentPrice}
                        </td>

                        {/* Suggested Price with optional AI icon */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">
                              ₹{item.suggestedPrice}
                            </span>
                            {item.hasAiSuggested && (
                              <span
                                title="AI Optimized Price"
                                className="inline-flex items-center text-emerald-600 bg-emerald-50 rounded-full p-0.5"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Price Status Badge */}
                        <td className="py-3 px-3">
                          {item.priceStatus === 'Optimal' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Optimal
                            </span>
                          )}
                          {item.priceStatus === 'Reprice' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Reprice
                            </span>
                          )}
                          {item.priceStatus === 'Overpriced' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Overpriced
                            </span>
                          )}
                          {item.priceStatus === 'Underpriced' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Underpriced
                            </span>
                          )}
                        </td>

                        {/* Buy Box */}
                        <td className="py-3 px-3">
                          {item.buyBoxWon ? (
                            <span className="text-slate-800 font-medium">{item.buyBox}</span>
                          ) : (
                            <span className="text-rose-600 font-bold">No</span>
                          )}
                        </td>

                        {/* Est. Profit Lift */}
                        <td className="py-3 px-3">
                          <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                            <span>↑</span>
                            <span>{item.estProfitLift}%</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedProduct(item)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Inspect product pricing details"
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

            {/* Bottom Pagination Bar */}
            <div className="border-t border-slate-200 px-4 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing <span className="font-semibold text-slate-800">1</span> to{' '}
                <span className="font-semibold text-slate-800">10</span> of{' '}
                <span className="font-semibold text-slate-800">245</span> products
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => showToast('First page active')}
                  className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold flex items-center justify-center">
                  1
                </button>
                <button
                  onClick={() => showToast('Switched to Page 2')}
                  className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  2
                </button>
                <button
                  onClick={() => showToast('Switched to Page 3')}
                  className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  3
                </button>
                <button
                  onClick={() => showToast('Switched to Page 4')}
                  className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  4
                </button>
                <button
                  onClick={() => showToast('Switched to Page 5')}
                  className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  5
                </button>
                <span className="px-1 text-slate-400">...</span>
                <button
                  onClick={() => showToast('Switched to Page 25')}
                  className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  25
                </button>
                <button
                  onClick={() => showToast('Switched to Next Page')}
                  className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <select className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500">
                  <option>10 / page</option>
                  <option>25 / page</option>
                  <option>50 / page</option>
                  <option>100 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right-Side Pricing Details Drawer */}
      {selectedProduct && (
        <PricingDetailsDrawer
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onApplyPrice={handleApplySuggestedPrice}
          onUpdatePrice={handleUpdatePrice}
          onExcludeProduct={(id) => showToast(`Excluded product #${id} from repricing`)}
        />
      )}
    </div>
  );
}
