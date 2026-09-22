import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  TrendingUp,
  Tag,
  Box,
  ChevronRight,
  Edit,
  DollarSign,
  PlusSquare,
  Files,
  Archive,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  Package
} from 'lucide-react';
import { ProductCatalogItem } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';

interface ProductDetailsDrawerProps {
  product: ProductCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePrice?: (product: ProductCatalogItem, newPrice: number) => void;
  onUpdateStock?: (product: ProductCatalogItem, newStock: number) => void;
  onArchiveProduct?: (product: ProductCatalogItem) => void;
  onEditProduct?: (product: ProductCatalogItem) => void;
  onDuplicateProduct?: (product: ProductCatalogItem) => void;
  onShowToast?: (msg: string) => void;
}

export default function ProductDetailsDrawer({
  product,
  isOpen,
  onClose,
  onUpdatePrice,
  onUpdateStock,
  onArchiveProduct,
  onEditProduct,
  onDuplicateProduct,
  onShowToast,
}: ProductDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Listings' | 'Inventory' | 'Pricing' | 'AI Insights'>('Overview');
  const [copiedSku, setCopiedSku] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPriceVal, setNewPriceVal] = useState('');
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [newStockVal, setNewStockVal] = useState('');

  if (!isOpen || !product) return null;

  const handleCopySku = () => {
    navigator.clipboard?.writeText(product.sku);
    setCopiedSku(true);
    onShowToast?.(`Copied SKU: ${product.sku}`);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleSavePrice = () => {
    const val = parseFloat(newPriceVal);
    if (!isNaN(val) && val > 0) {
      onUpdatePrice?.(product, val);
      setIsEditingPrice(false);
      onShowToast?.(`Updated price to ₹${val.toLocaleString('en-IN')}`);
    }
  };

  const handleSaveStock = () => {
    const val = parseInt(newStockVal, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock?.(product, val);
      setIsEditingStock(false);
      onShowToast?.(`Updated stock to ${val} units`);
    }
  };

  return (
    <aside
      className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all"
      id="product-details-drawer"
    >
      {/* Drawer Top Bar */}
      <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/40">
        <div className="flex items-center gap-3">
          {/* Large product graphic */}
          <div className="w-12 h-12 bg-white rounded-lg border border-slate-200/90 flex items-center justify-center p-1 shadow-2xs">
            <ProductCatalogGraphic type={product.imageType || product.sku} className="w-10 h-10" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {product.name}
              </h2>
              {product.listingStatus === 'Active' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              ) : product.listingStatus === 'Suppressed' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Suppressed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Inactive
                </span>
              )}
            </div>

            {/* SKU and Copy */}
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
              <span>SKU:</span>
              <span className="font-mono font-medium text-slate-700">{product.sku}</span>
              <button
                onClick={handleCopySku}
                className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title="Copy SKU"
              >
                {copiedSku ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* Marketplace badges */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Marketplace</span>
              {product.marketplaces.includes('amazon') && (
                <div className="w-4 h-4 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs" title="Amazon">
                  <AmazonLogo className="w-3.5 h-3.5" />
                </div>
              )}
              {product.marketplaces.includes('flipkart') && (
                <div className="w-4 h-4 rounded flex items-center justify-center bg-white border border-slate-200/80 shadow-2xs" title="Flipkart">
                  <FlipkartLogo className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Sub-Tabs */}
      <div className="flex items-center px-3 border-b border-slate-200 bg-white overflow-x-auto scrollbar-none text-xs font-semibold">
        {(['Overview', 'Listings', 'Inventory', 'Pricing', 'AI Insights'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const label = tab === 'Listings' ? 'Listings (2)' : tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 whitespace-nowrap transition-colors border-b-2 font-medium ${
                isSelected
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'Overview' && (
          <>
            {/* 1. Product Information Section */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Product Information</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Product Name</span>
                  <span className="font-medium text-slate-900 text-right">{product.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-800">{product.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Brand</span>
                  <span className="font-medium text-slate-800">{product.brand || ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">HSN Code</span>
                  <span className="font-mono text-slate-800">{product.hsnCode || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Product Weight</span>
                  <span className="font-medium text-slate-800">{product.weight || '350 g'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Dimensions</span>
                  <span className="font-medium text-slate-800">{product.dimensions || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Created On</span>
                  <span className="font-medium text-slate-800">{product.createdOn || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium text-slate-800">{product.lastUpdated || '—'}</span>
                </div>
              </div>
            </div>

            {/* 2. Performance (Last 30 Days) Section */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                <span>Performance <span className="font-normal text-slate-400">(Last 30 Days)</span></span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Revenue</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">
                      ₹{product.revenue30d.toLocaleString('en-IN')}
                    </span>
                    <span className="text-emerald-600 font-semibold text-[11px] flex items-center">
                      ↑ {product.growthMetrics?.revenueGrowth ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Units Sold</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">
                      {product.growthMetrics?.unitsSold ?? product.stock ?? 0}
                    </span>
                    <span className="text-emerald-600 font-semibold text-[11px] flex items-center">
                      —
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Average Price</span>
                  <span className="font-bold text-slate-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Margin</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{product.margin}%</span>
                    <span className="text-emerald-600 font-semibold text-[11px] flex items-center">
                      ↑ 2.1%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Inventory Section */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <Box className="w-3.5 h-3.5 text-slate-500" />
                <span>Inventory</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Stock</span>
                  <span className="font-bold text-slate-900">{product.stock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Available</span>
                  <span className="font-medium text-slate-800">{product.availableStock ?? product.stock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reserved</span>
                  <span className="font-medium text-slate-800">{product.reservedStock ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Inbound</span>
                  <span className="font-medium text-slate-800">{product.inboundStock ?? 50}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stock Status</span>
                  {product.stockStatus === 'In Stock' ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                      In Stock
                    </span>
                  ) : product.stockStatus === 'Low Stock' ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                      Low Stock
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-center">
                  <button
                    onClick={() => {
                      setIsEditingStock(true);
                      setNewStockVal(product.stock.toString());
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>&gt; Manage Inventory</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Actions Section */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-100">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Actions</span>
              </div>

              {/* 2x2 Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onEditProduct?.(product)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>

                <button
                  onClick={() => {
                    setIsEditingPrice(true);
                    setNewPriceVal(product.price.toString());
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  <span>Update Price</span>
                </button>

                <button
                  onClick={() => {
                    onShowToast?.(`Listing sync initiated for ${product.name}`);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PlusSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Create Listing</span>
                </button>

                <button
                  onClick={() => onDuplicateProduct?.(product)}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Files className="w-3.5 h-3.5 text-slate-500" />
                  <span>Duplicate</span>
                </button>
              </div>

              {/* Archive Product Button */}
              <button
                onClick={() => onArchiveProduct?.(product)}
                className="w-full mt-2 px-3 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Product</span>
              </button>
            </div>
          </>
        )}

        {/* Tab 2: Listings */}
        {activeTab === 'Listings' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AmazonLogo className="w-4 h-4" />
                  <span className="font-bold text-slate-900">Amazon India</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Active</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>ASIN: <span className="font-mono text-slate-800">{product.asin || '—'}</span></div>
                <div>Listed Price: <span className="font-semibold text-slate-900">₹{product.price}</span></div>
                <div>Buy Box Share: <span className="font-semibold text-emerald-600">94%</span></div>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlipkartLogo className="w-4 h-4" />
                  <span className="font-bold text-slate-900">Flipkart</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Active</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>FSN: <span className="font-mono text-slate-800">BOTG99XYZA</span></div>
                <div>Listed Price: <span className="font-semibold text-slate-900">₹{product.price}</span></div>
                <div>F-Assured Badge: <span className="font-semibold text-blue-600">Verified</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory */}
        {activeTab === 'Inventory' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
              <div className="font-bold text-slate-900 text-xs">Warehouse Stock Distribution</div>
              <div className="space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span>Central Fulfillment Hub</span>
                  <span className="font-bold text-slate-900">134 units</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Regional Hub (Bhiwandi)</span>
                  <span className="font-bold text-slate-900">50 units (inbound)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Reorder Threshold</span>
                  <span className="font-bold text-amber-600">25 units</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Supplier Lead Time</span>
                  <span className="font-bold text-slate-800">4 days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Pricing */}
        {activeTab === 'Pricing' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
              <div className="font-bold text-slate-900 text-xs">Cost & Profit Breakdown</div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Cost of Goods (COGS)</span>
                  <span className="font-medium text-slate-800">₹{Math.round(product.price * (1 - product.margin / 100))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selling Price</span>
                  <span className="font-bold text-slate-900">₹{product.price}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Estimated Net Margin</span>
                  <span>{product.margin}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: AI Insights */}
        {activeTab === 'AI Insights' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-violet-800 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>AI Catalog Recommendation</span>
              </div>
              <p className="text-xs text-violet-700 leading-relaxed">
                No AI catalog recommendation is available for this product yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Price Modal */}
      {isEditingPrice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Update Selling Price</h3>
            <p className="text-xs text-slate-500">
              Set new price for <span className="font-semibold text-slate-800">{product.name}</span> across connected channels.
            </p>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">New Price (₹)</label>
              <input
                type="number"
                value={newPriceVal}
                onChange={(e) => setNewPriceVal(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                placeholder="Price"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingPrice(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-2xs"
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {isEditingStock && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Update Inventory Units</h3>
            <p className="text-xs text-slate-500">
              Adjust physical on-hand stock for SKU: <span className="font-mono font-semibold">{product.sku}</span>
            </p>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Available Units</label>
              <input
                type="number"
                value={newStockVal}
                onChange={(e) => setNewStockVal(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                placeholder="Stock"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingStock(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-2xs"
              >
                Save Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
