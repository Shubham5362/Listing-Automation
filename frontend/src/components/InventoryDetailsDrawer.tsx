import React, { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Edit2,
  Package,
  DollarSign,
  TrendingUp,
  Zap,
  Info,
  Maximize2,
  FileText,
  ArrowLeftRight,
  Sliders,
  Bookmark,
  Printer,
  ChevronRight,
  Truck,
  History,
  Sparkles,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { InventoryItem } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';

interface InventoryDetailsDrawerProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStock?: (item: InventoryItem, newStock: number) => void;
  onUpdateReorderPoint?: (item: InventoryItem, newPoint: number) => void;
  onUpdatePrice?: (item: InventoryItem, newPrice: number) => void;
  onQuickAction?: (actionName: string, item: InventoryItem) => void;
}

export default function InventoryDetailsDrawer({
  item,
  isOpen,
  onClose,
  onUpdateStock,
  onUpdateReorderPoint,
  onUpdatePrice,
  onQuickAction,
}: InventoryDetailsDrawerProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Stock' | 'Suppliers' | 'Movements' | 'Forecast'>('Overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick edit modal states
  const [editingField, setEditingField] = useState<'stock' | 'reorder' | 'maxStock' | 'price' | null>(null);
  const [editInputValue, setEditInputValue] = useState('');

  useEffect(() => {
    if (!isOpen || !item?.id) return;
    fetch(`/api/v1/inventory/${item.id}/movements`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setMovements(Array.isArray(data) ? data : []))
      .catch(() => setMovements([]));
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
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

  const handleSaveEdit = () => {
    const num = parseFloat(editInputValue);
    if (!isNaN(num)) {
      if (editingField === 'stock' && onUpdateStock) {
        onUpdateStock(item, Math.max(0, Math.round(num)));
      } else if (editingField === 'reorder' && onUpdateReorderPoint) {
        onUpdateReorderPoint(item, Math.max(0, Math.round(num)));
      } else if (editingField === 'price' && onUpdatePrice) {
        onUpdatePrice(item, Math.max(1, num));
      }
    }
    setEditingField(null);
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <ProductCatalogGraphic
              type={item.imageType}
              className="w-12 h-12 rounded-lg border border-slate-200/90 bg-slate-50 shrink-0 p-1"
              large
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 truncate leading-snug" title={item.name}>
                  {item.name}
                </h2>
                {getStatusBadge(item.status)}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-mono">
                <div className="flex items-center gap-1">
                  <span>SKU: {item.sku}</span>
                  <button
                    onClick={() => copyToClipboard(item.sku, 'sku')}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="Copy SKU"
                  >
                    {copiedField === 'sku' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                {item.asin && (
                  <div className="flex items-center gap-1">
                    <span>ASIN: {item.asin}</span>
                    <button
                      onClick={() => copyToClipboard(item.asin, 'asin')}
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
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Marketplace Logos Row */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500 text-xs">Marketplace</span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-50 border border-slate-200/90 shadow-2xs">
              <AmazonLogo className="w-3.5 h-3.5" />
            </span>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-50/70 border border-blue-200/80 shadow-2xs">
              <FlipkartLogo className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center border-b border-slate-200 px-4 gap-4 overflow-x-auto text-xs font-semibold scrollbar-none bg-slate-50/50">
        {(['Overview', 'Stock', 'Suppliers', 'Movements', 'Forecast'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Drawer Tab Content */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {activeTab === 'Overview' && (
          <>
            {/* 1. Stock Information */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Package className="w-4 h-4 text-slate-500" />
                <span>Stock Information</span>
              </div>
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Stock</span>
                  <span className="font-bold text-slate-900">{item.currentStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Available Stock</span>
                  <span className="font-bold text-slate-900">{item.availableStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reserved Stock</span>
                  <span className="font-bold text-slate-900">{item.reservedStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Reorder Point</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.reorderPoint}</span>
                    <button
                      onClick={() => {
                        setEditingField('reorder');
                        setEditInputValue(String(item.reorderPoint));
                      }}
                      className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5 text-[11px] font-semibold"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Max Stock Level</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.maxStockLevel}</span>
                    <button
                      onClick={() => {
                        setEditingField('maxStock');
                        setEditInputValue(String(item.maxStockLevel));
                      }}
                      className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5 text-[11px] font-semibold"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Stock Status</span>
                  {getStatusBadge(item.status)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Last Updated</span>
                  <span className="font-medium text-slate-700">{item.lastUpdated}</span>
                </div>
              </div>
            </div>

            {/* 2. Pricing Information */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span>Pricing Information</span>
              </div>
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Price</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">₹{item.price}</span>
                    <button
                      onClick={() => {
                        setEditingField('price');
                        setEditInputValue(String(item.price));
                      }}
                      className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5 text-[11px] font-semibold"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">MRP</span>
                  <span className="font-semibold text-slate-700">₹{item.mrp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cost Price</span>
                  <span className="font-semibold text-slate-700">₹{item.costPrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Margin</span>
                  <span className="font-bold text-emerald-600">{item.margin}%</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Total Stock Value</span>
                  <span className="font-bold text-slate-900">₹{item.totalStockValue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 3. Sales & Forecast */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span>Sales & Forecast</span>
              </div>
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Avg. Daily Sales</span>
                  <span className="font-bold text-slate-900">{item.avgDailySales} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Estimated Days</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="font-bold text-slate-900">{item.estimatedDays} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Demand Trend</span>
                  <span className="font-bold text-emerald-600">{item.demandTrend}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">AI Forecast (30d)</span>
                  <span className="font-bold text-slate-900">{item.aiForecast30d} units</span>
                </div>

                <button
                  onClick={() => setActiveTab('Forecast')}
                  className="w-full mt-2 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-2xs transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Forecast</span>
                </button>
              </div>
            </div>

            {/* 4. Quick Actions */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Zap className="w-4 h-4 text-slate-500" />
                <span>Quick Actions</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setEditingField('stock');
                    setEditInputValue(String(item.currentStock));
                  }}
                  className="py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs text-center"
                >
                  Update Stock
                </button>
                <button
                  onClick={() => onQuickAction?.('Create Purchase Order', item)}
                  className="py-2 px-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors text-center shadow-2xs"
                >
                  Create Purchase Order
                </button>
                <button
                  onClick={() => onQuickAction?.('Transfer Stock', item)}
                  className="py-2 px-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors text-center shadow-2xs"
                >
                  Transfer Stock
                </button>
                <button
                  onClick={() => onQuickAction?.('Adjust Stock', item)}
                  className="py-2 px-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors text-center shadow-2xs"
                >
                  Adjust Stock
                </button>
                <button
                  onClick={() => {
                    setEditingField('reorder');
                    setEditInputValue(String(item.reorderPoint));
                  }}
                  className="py-2 px-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors text-center shadow-2xs"
                >
                  Set Reorder Point
                </button>
                <button
                  onClick={() => onQuickAction?.('Print Labels', item)}
                  className="py-2 px-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors text-center shadow-2xs"
                >
                  Print Labels
                </button>
              </div>
            </div>
          </>
        )}

        {/* Stock Breakdown Tab */}
        {activeTab === 'Stock' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2">
              <h3 className="font-bold text-slate-900 text-xs">Warehouse Distribution</h3>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">{item.warehouse || 'Warehouse not specified'}</span>
                  <span className="font-bold text-slate-900">{Math.round(item.currentStock * 0.65)} units</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">Flipkart FBF (DEL2 - Gurgaon)</span>
                  <span className="font-bold text-slate-900">{Math.round(item.currentStock * 0.25)} units</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Self-Fulfill Hub (Mumbai)</span>
                  <span className="font-bold text-slate-900">
                    {item.currentStock - Math.round(item.currentStock * 0.65) - Math.round(item.currentStock * 0.25)} units
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
              <h3 className="font-bold text-slate-900 text-xs">Stock Ageing Analysis</h3>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 font-medium">0 - 30 days</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">85%</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 font-medium">31 - 60 days</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">12%</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <div className="text-[10px] text-slate-500 font-medium">60+ days</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">3%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'Suppliers' && (
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900">Apex Steel Fabrications Ltd</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pune Industrial Area, Maharashtra</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                  Primary
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-500">Lead Time:</span> <span className="font-bold text-slate-800">4-5 Days</span>
                </div>
                <div>
                  <span className="text-slate-500">MOQ:</span> <span className="font-bold text-slate-800">100 units</span>
                </div>
                <div>
                  <span className="text-slate-500">Unit Cost:</span> <span className="font-bold text-slate-800">₹{item.costPrice}</span>
                </div>
                <div>
                  <span className="text-slate-500">Payment:</span> <span className="font-bold text-slate-800">Net 30</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onQuickAction?.('Create Purchase Order', item)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Draft Reorder PO</span>
            </button>
          </div>
        )}

        {/* Movements Tab */}
        {activeTab === 'Movements' && (
          <div className="space-y-2.5 text-xs">
            {movements.map((m: any, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{m.type}</div>
                  <div className="text-[11px] text-slate-500">{m.dest} • {m.date}</div>
                </div>
                <div className={`text-xs ${m.color}`}>{m.qty}</div>
              </div>
            ))}
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'Forecast' && (
          <div className="space-y-3 text-xs">
            <div className="bg-gradient-to-br from-indigo-50/90 to-purple-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>AI Predictive Stock Optimizer</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Based on festive search spikes and 30-day run-rates, this SKU is forecasted to experience{' '}
                <strong className="text-slate-900">+18% demand lift</strong> next week.
              </p>
              <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between">
                <span className="text-indigo-900 font-semibold">Recommended Reorder Date:</span>
                <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {item.lastUpdated || 'Date not available'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Runway Remaining:</span>
                <span className="font-bold text-slate-900">{item.estimatedDays} Days</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.estimatedDays <= 5
                      ? 'bg-rose-500 w-1/5'
                      : item.estimatedDays <= 15
                      ? 'bg-amber-500 w-2/5'
                      : 'bg-emerald-500 w-4/5'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Field Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Edit {editingField === 'stock' ? 'Current Stock' : editingField === 'reorder' ? 'Reorder Point' : editingField === 'maxStock' ? 'Max Stock Level' : 'Price (₹)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{item.name}</p>
            </div>
            <input
              type="number"
              value={editInputValue}
              onChange={(e) => setEditInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-2xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
