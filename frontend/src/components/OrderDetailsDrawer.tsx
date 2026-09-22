import React, { useState } from 'react';
import {
  X,
  Package,
  User,
  Truck,
  Sliders,
  Copy,
  Check,
  ExternalLink,
  Download,
  RotateCcw,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';
import { OrderRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';

interface OrderDetailsDrawerProps {
  order: OrderRecord;
  onClose: () => void;
  onAction?: (actionName: string, order: OrderRecord) => void;
}

export default function OrderDetailsDrawer({
  order,
  onClose,
  onAction,
}: OrderDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Items' | 'Tracking' | 'Customer' | 'Timeline'>('Overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Delivered
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Shipped
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Processing
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      case 'Return Requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Return Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Drawer Top Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
            Order #{order.orderNumber}
          </h2>
          {getStatusBadge(order.status)}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Close order details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-200 px-5 text-xs font-semibold shrink-0">
        {(['Overview', `Items (${order.products.length + (order.moreProductsCount || 0)})`, 'Tracking', 'Customer', 'Timeline'] as const).map((tab) => {
          const tabKey = tab.startsWith('Items') ? 'Items' : tab as any;
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tabKey)}
              className={`py-2.5 px-2.5 -mb-px border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin text-xs">
        {activeTab === 'Overview' && (
          <>
            {/* 1. Order Information Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Package className="w-4 h-4 text-slate-700" />
                <span>Order Information</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order ID</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span>#{order.orderNumber}</span>
                    <button
                      onClick={() => copyToClipboard(`#${order.orderNumber}`, 'orderId')}
                      className="p-0.5 text-slate-400 hover:text-slate-600"
                      title="Copy Order ID"
                    >
                      {copiedField === 'orderId' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Marketplace</span>
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    {order.marketplace === 'Amazon' ? (
                      <AmazonLogo className="w-4 h-4" />
                    ) : (
                      <FlipkartLogo className="w-4 h-4" />
                    )}
                    <span>{order.marketplace === 'Amazon' ? 'Amazon India' : 'Flipkart'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order Date</span>
                  <span className="text-slate-800">{order.date}, {order.time}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="text-slate-800">{order.paymentMethod || 'Prepaid (UPI)'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order Amount</span>
                  <span className="font-bold text-slate-900 text-sm">₹{order.amount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Order Status</span>
                  {getStatusBadge(order.status)}
                </div>

                {order.deliveredOn && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Delivered On</span>
                    <span className="text-slate-800">{order.deliveredOn}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* 2. Customer Details Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <User className="w-4 h-4 text-slate-700" />
                <span>Customer Details</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{order.customer.name}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{order.customer.phone}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{order.customer.email}</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-600 whitespace-pre-line leading-relaxed">
                    {order.customer.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* 3. Shipping & Tracking Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Truck className="w-4 h-4 text-slate-700" />
                <span>Shipping & Tracking</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Courier Partner</span>
                  <span className="font-medium text-slate-900">{order.tracking.courier}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tracking ID</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span>{order.tracking.trackingId}</span>
                    <button
                      onClick={() => copyToClipboard(order.tracking.trackingId, 'trackingId')}
                      className="p-0.5 text-slate-400 hover:text-slate-600"
                      title="Copy Tracking ID"
                    >
                      {copiedField === 'trackingId' ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tracking Status</span>
                  {getStatusBadge(order.tracking.status)}
                </div>

                {order.tracking.deliveredOn && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Delivered On</span>
                    <span className="text-slate-800">{order.tracking.deliveredOn}</span>
                  </div>
                )}

                <button
                  onClick={() => onAction?.('view_tracking', order)}
                  className="w-full mt-2 py-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Tracking Details</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* 4. Order Actions Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Sliders className="w-4 h-4 text-slate-700" />
                <span>Order Actions</span>
              </div>

              {/* 2x2 Action Button Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAction?.('download_invoice', order)}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Invoice</span>
                </button>

                <button
                  onClick={() => onAction?.('buy_again', order)}
                  className="py-2 px-2.5 bg-white hover:bg-indigo-50/50 border border-slate-200 text-indigo-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Buy Again</span>
                </button>

                <button
                  onClick={() => onAction?.('create_return', order)}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Create Return</span>
                </button>

                <button
                  onClick={() => onAction?.('contact_customer', order)}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Contact Customer</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Items' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900">Ordered Items ({order.products.length}):</div>
            <div className="space-y-2">
              {order.products.map((item, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                    <div className="text-[11px] text-slate-500">SKU: {item.sku} • Qty: {item.quantity}</div>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Tracking' && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-900">Live Carrier Milestones:</div>
            <div className="space-y-3 border-l-2 border-indigo-200 pl-4 ml-1">
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <div className="font-bold text-slate-900 text-xs">Package Delivered</div>
                <div className="text-[11px] text-slate-500">{order.tracking.deliveredOn || 'Delivery time not available'}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{(order.tracking as any).deliveryNote || 'Delivery confirmation details not available.'}</div>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-500" />
                <div className="font-bold text-slate-900 text-xs">Out for Delivery</div>
                <div className="text-[11px] text-slate-500">Shipment time not available</div>
              </div>
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-slate-300" />
                <div className="font-bold text-slate-900 text-xs">Dispatch</div>
                <div className="text-[11px] text-slate-500">Pickup time not available</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Customer' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900">Buyer Profile:</div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">{order.customer.name}</div>
              <div className="text-slate-600">{order.customer.phone}</div>
              <div className="text-slate-600">{order.customer.email}</div>
              <div className="text-slate-600 pt-1 border-t border-slate-200">{order.customer.address}</div>
            </div>
          </div>
        )}

        {activeTab === 'Timeline' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900">Order Audit Trail:</div>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Order placed: {order.date}, {order.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Payment captured via UPI</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                <span>Shipping label generated ({order.tracking.trackingId})</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
