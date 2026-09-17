import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Edit,
  Tag,
  Boxes,
  Sparkles,
  AlertTriangle,
  Archive,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { ListingItem } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';

interface ListingDetailsDrawerProps {
  listing: ListingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePrice?: (listing: ListingItem, newPrice: number) => void;
  onUpdateStock?: (listing: ListingItem, newStock: number) => void;
  onArchive?: (listing: ListingItem) => void;
  onFixIssues?: (listing: ListingItem) => void;
  onOptimizeAi?: (listing: ListingItem) => void;
}

export default function ListingDetailsDrawer({
  listing,
  isOpen,
  onClose,
  onUpdatePrice,
  onUpdateStock,
  onArchive,
  onFixIssues,
  onOptimizeAi,
}: ListingDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Content' | 'Images' | 'Pricing' | 'SEO' | 'History'>('Overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [editingStock, setEditingStock] = useState(false);
  const [stockInput, setStockInput] = useState('');

  if (!isOpen || !listing) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSavePrice = () => {
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val > 0 && onUpdatePrice) {
      onUpdatePrice(listing, val);
    }
    setEditingPrice(false);
  };

  const handleSaveStock = () => {
    const val = parseInt(stockInput, 10);
    if (!isNaN(val) && val >= 0 && onUpdateStock) {
      onUpdateStock(listing, val);
    }
    setEditingStock(false);
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'Suppressed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Suppressed
          </span>
        );
      case 'Needs Fix':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Needs Fix
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Circular gauge score calculation for listing quality
  const quality = listing.listingQuality || 92;
  const circumference = 2 * Math.PI * 34; // radius 34 -> circumference ~ 213.6
  const strokeDashoffset = circumference - (circumference * quality) / 100;
  const qualityRatingText =
    quality >= 90 ? 'Excellent' : quality >= 75 ? 'Good' : quality >= 60 ? 'Moderate' : 'Needs Work';

  return (
    <aside
      className="w-full lg:w-[380px] xl:w-[400px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden shadow-sm"
      aria-label="Listing Details"
    >
      {/* Drawer Top Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          {/* Thumbnail & Identifiers */}
          <div className="flex items-start gap-3 min-w-0">
            <ProductCatalogGraphic
              type={listing.imageType || listing.sku}
              className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 p-1 shrink-0"
              large
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-slate-900 text-sm truncate max-w-[200px]" title={listing.name}>
                  {listing.name}
                </h2>
                {getStatusBadge(listing.status)}
              </div>

              {/* ASIN & SKU row */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <span>ASIN: {listing.asin}</span>
                  <button
                    onClick={() => copyToClipboard(listing.asin, 'asin')}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="Copy ASIN"
                  >
                    {copiedField === 'asin' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1">
                  <span>SKU: {listing.sku}</span>
                  <button
                    onClick={() => copyToClipboard(listing.sku, 'sku')}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="Copy SKU"
                  >
                    {copiedField === 'sku' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Marketplace Row */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                <span className="font-medium text-slate-500 text-[11px]">Marketplace</span>
                <div className="flex items-center gap-1 ml-0.5">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs"
                    title="Amazon"
                  >
                    <AmazonLogo className="w-3.5 h-3.5" />
                  </div>
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs"
                    title="Flipkart"
                  >
                    <FlipkartLogo className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Sub-tabs */}
      <div className="flex items-center px-4 border-b border-slate-200 overflow-x-auto scrollbar-none text-xs font-medium">
        {(['Overview', 'Content', 'Images', 'Pricing', 'SEO', 'History'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-2.5 whitespace-nowrap transition-colors relative ${
              activeTab === tab
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600 -mb-[1px]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Drawer Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'Overview' ? (
          <>
            {/* 1. Listing Information Section */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs border-b border-slate-100 pb-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Listing Information</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Product Title</span>
                  <span className="font-semibold text-slate-900 text-right truncate max-w-[200px]" title={listing.name}>
                    {listing.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Brand</span>
                  <span className="font-semibold text-slate-900">{listing.brand || 'AquaPure'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Category</span>
                  <span className="font-semibold text-slate-900">{listing.category || 'Home & Kitchen'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Manufacturing</span>
                  <span className="font-semibold text-slate-900">{listing.manufacturing || 'AquaPure Industries'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">HSN Code</span>
                  <span className="font-semibold text-slate-900 font-mono">{listing.hsnCode || '7323'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Listing Status</span>
                  <div>{getStatusBadge(listing.status)}</div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Created On</span>
                  <span className="font-medium text-slate-700">{listing.createdOn || 'Aug 12, 2024'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium text-slate-700">{listing.lastUpdated || 'Dec 15, 2024'}</span>
                </div>
              </div>
            </div>

            {/* 2. Pricing & Inventory Section */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs border-b border-slate-100 pb-2">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Pricing & Inventory</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Current Price */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Price</span>
                  <div className="flex items-center gap-2">
                    {editingPrice ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="w-20 px-1.5 py-0.5 border border-indigo-400 rounded text-xs font-bold text-slate-900 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleSavePrice}
                          className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900">₹{listing.price}</span>
                        <button
                          onClick={() => {
                            setPriceInput(listing.price.toString());
                            setEditingPrice(true);
                          }}
                          className="px-2 py-0.5 text-indigo-600 hover:text-indigo-700 text-[11px] font-semibold flex items-center gap-1 border border-indigo-200 bg-indigo-50/40 rounded transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* MRP */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">MRP</span>
                  <span className="font-medium text-slate-600">₹{listing.mrp || 799}</span>
                </div>

                {/* Discount */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-semibold text-emerald-600">
                    {listing.discount || Math.round((1 - listing.price / (listing.mrp || 799)) * 100)}%
                  </span>
                </div>

                {/* Stock Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stock Quantity</span>
                  <div className="flex items-center gap-2">
                    {editingStock ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={stockInput}
                          onChange={(e) => setStockInput(e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-indigo-400 rounded text-xs font-bold text-slate-900 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveStock}
                          className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900">{listing.stock}</span>
                        <button
                          onClick={() => {
                            setStockInput(listing.stock.toString());
                            setEditingStock(true);
                          }}
                          className="px-2 py-0.5 text-indigo-600 hover:text-indigo-700 text-[11px] font-semibold flex items-center gap-1 border border-indigo-200 bg-indigo-50/40 rounded transition-colors"
                        >
                          <Boxes className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stock Status</span>
                  <div>
                    {listing.stockStatus === 'In Stock' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        In Stock
                      </span>
                    ) : listing.stockStatus === 'Low Stock' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Fulfilled By */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fulfilled By</span>
                  <span className="font-semibold text-slate-900">{listing.fulfilledBy || 'Amazon (FBA)'}</span>
                </div>
              </div>
            </div>

            {/* 3. Listing Quality Section with Donut & Checklist */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs border-b border-slate-100 pb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Listing Quality</span>
              </div>

              {/* Gauge and Checklist Row */}
              <div className="flex items-center gap-4">
                {/* Donut Gauge */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    {/* Background track */}
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#E2E8F0"
                      strokeWidth="6"
                      fill="none"
                    />
                    {/* Foreground progress */}
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#10B981"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-base font-bold text-slate-900 leading-none">
                      {quality}%
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                      {qualityRatingText}
                    </span>
                  </div>
                </div>

                {/* Checklist */}
                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Title optimized</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Images (6/6)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Bullet points (5/5)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Description</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>A+ Content</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Search keywords</span>
                  </div>
                </div>
              </div>

              {/* View SEO Analysis Button */}
              <button
                onClick={() => setActiveTab('SEO')}
                className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span>View SEO Analysis</span>
              </button>
            </div>

            {/* 4. Listing Actions Section */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs border-b border-slate-100 pb-2">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Listing Actions</span>
              </div>

              {/* 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Edit Listing */}
                <button
                  onClick={() => {
                    setPriceInput(listing.price.toString());
                    setEditingPrice(true);
                  }}
                  className="w-full py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Listing</span>
                </button>

                {/* Optimize with AI */}
                <button
                  onClick={() => onOptimizeAi && onOptimizeAi(listing)}
                  className="w-full py-2 px-2.5 bg-white hover:bg-violet-50/60 border border-violet-200 text-violet-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Optimize with AI</span>
                </button>

                {/* Update Price */}
                <button
                  onClick={() => {
                    setPriceInput(listing.price.toString());
                    setEditingPrice(true);
                  }}
                  className="w-full py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Update Price</span>
                </button>

                {/* Update Stock */}
                <button
                  onClick={() => {
                    setStockInput(listing.stock.toString());
                    setEditingStock(true);
                  }}
                  className="w-full py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Boxes className="w-3.5 h-3.5 text-slate-500" />
                  <span>Update Stock</span>
                </button>
              </div>

              {/* 2 Full-Width Buttons */}
              <div className="space-y-2 pt-1">
                {/* Fix Issues */}
                <button
                  onClick={() => onFixIssues && onFixIssues(listing)}
                  className="w-full py-2 px-3 bg-amber-50/40 hover:bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fix Issues</span>
                </button>

                {/* Archive Listing */}
                <button
                  onClick={() => onArchive && onArchive(listing)}
                  className="w-full py-2 px-3 bg-rose-50/40 hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Archive className="w-3.5 h-3.5 text-rose-600" />
                  <span>Archive Listing</span>
                </button>
              </div>
            </div>
          </>
        ) : activeTab === 'Content' ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-semibold text-slate-900">Catalog & Content Details</h3>
            <p className="text-slate-600 leading-relaxed">
              Optimized title, bullet points, and Amazon backend keywords for {listing.name}.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-800">Bullet Points</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                <li>Grade 304 food-grade stainless steel construction.</li>
                <li>Vacuum insulated double-wall keeps liquids cold 24h / hot 12h.</li>
                <li>100% leak-proof lid with silicone airtight gasket.</li>
                <li>Sweat-free exterior finish with non-slip powder coating.</li>
                <li>BPA-free, eco-friendly reusable design.</li>
              </ul>
            </div>
          </div>
        ) : activeTab === 'Images' ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-semibold text-slate-900">Listing Image Assets (6)</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="aspect-square bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-2">
                  <ProductCatalogGraphic type={listing.imageType || listing.sku} className="w-8 h-8" />
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'Pricing' ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-semibold text-slate-900">Pricing Strategy</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Buy Box Price</span>
                <span className="font-bold text-slate-900">₹{listing.price}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Lowest Competitor</span>
                <span className="font-medium text-slate-700">₹{listing.price - 20}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Target Margin</span>
                <span className="font-semibold text-emerald-600">28.4%</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'SEO' ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-semibold text-slate-900">Search Engine & Keyword Optimization</h3>
            <p className="text-slate-600 text-xs">
              Quality score is <span className="font-bold text-emerald-600">{listing.listingQuality}%</span>. All primary keywords indexed on Amazon A9 & Flipkart search algorithm.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['stainless bottle 1l', 'insulated flask', 'sports water bottle', 'gym shaker', 'thermo bottle'].map((kw) => (
                <span key={kw} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3 text-xs">
            <h3 className="font-semibold text-slate-900">Listing Revision History</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="border-l-2 border-indigo-400 pl-3 py-1">
                <div className="font-semibold text-slate-800">Dec 15, 2024 • 14:22</div>
                <div>Price updated to ₹{listing.price} via automated repricer</div>
              </div>
              <div className="border-l-2 border-slate-200 pl-3 py-1">
                <div className="font-semibold text-slate-800">Dec 10, 2024 • 09:10</div>
                <div>Keywords and backend search terms refreshed by AI Listing Studio</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
