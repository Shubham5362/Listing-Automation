import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  RotateCcw,
  User,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  IndianRupee,
  RefreshCw,
  MessageSquare,
  FileText,
  Clock,
  Printer,
  AlertTriangle,
  ZoomIn
} from 'lucide-react';
import { ReturnRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';

interface ReturnDetailsDrawerProps {
  returnItem: ReturnRecord | null;
  onClose: () => void;
  onUpdateStatus?: (id: string | number, newStatus: ReturnRecord['status']) => void;
  onProcessRefund?: (item: ReturnRecord) => void;
  onCreateReplacement?: (item: ReturnRecord) => void;
}

export default function ReturnDetailsDrawer({
  returnItem,
  onClose,
  onUpdateStatus,
  onProcessRefund,
  onCreateReplacement,
}: ReturnDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Customer' | 'Timeline' | 'Images' | 'Notes'>('Overview');
  const [copiedReturnId, setCopiedReturnId] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isLabelGenerated, setIsLabelGenerated] = useState(false);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  if (!returnItem) return null;

  const handleCopy = (text: string, type: 'return' | 'order') => {
    navigator.clipboard?.writeText(text);
    if (type === 'return') {
      setCopiedReturnId(true);
      setTimeout(() => setCopiedReturnId(false), 2000);
    } else {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note = {
      id: `n-${Date.now()}`,
      author: 'Shubham',
      date: 'Just now',
      text: newNoteText.trim(),
    };
    setNotesList([note, ...notesList]);
    setNewNoteText('');
  };

  const getStatusBadge = (status: ReturnRecord['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Approved
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Refunded
          </span>
        );
      case 'Replacement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Replacement
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[350px] lg:w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Product Thumbnail */}
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
              <ProductCatalogGraphic type={returnItem.product.imageType} className="w-9 h-9" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900 text-[13px] sm:text-sm truncate">
                  {returnItem.product.name}
                </h3>
                {getStatusBadge(returnItem.status)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Return ID, Order ID & Marketplace badges */}
        <div className="space-y-1.5 text-xs text-slate-600 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Return ID</span>
            <div className="flex items-center gap-1 font-medium text-slate-800">
              <span>{returnItem.returnId}</span>
              <button
                onClick={() => handleCopy(returnItem.returnId, 'return')}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Copy Return ID"
              >
                {copiedReturnId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Order ID</span>
            <div className="flex items-center gap-1 font-medium text-slate-800">
              <span>{returnItem.orderId}</span>
              <button
                onClick={() => handleCopy(returnItem.orderId, 'order')}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Copy Order ID"
              >
                {copiedOrderId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-400">Marketplace</span>
            <div className="flex items-center gap-1.5">
              {returnItem.marketplace === 'Amazon' ? (
                <div className="flex items-center gap-1">
                  <AmazonLogo className="w-4 h-4" />
                  <FlipkartLogo className="w-4 h-4 opacity-40 grayscale" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AmazonLogo className="w-4 h-4 opacity-40 grayscale" />
                  <FlipkartLogo className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200 px-4 gap-4 sm:gap-6 text-xs font-medium text-slate-500 overflow-x-auto shrink-0 scrollbar-none">
        {(['Overview', 'Customer', 'Timeline', 'Images', 'Notes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 relative whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'Overview' && (
          <>
            {/* 1. Return Details Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs pb-1 border-b border-slate-100">
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Return Details</span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Return ID</span>
                  <span className="font-semibold text-slate-800">{returnItem.returnId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Order ID</span>
                  <span className="font-semibold text-slate-800">{returnItem.orderId}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Product</span>
                  <span className="font-semibold text-slate-800 truncate block" title={returnItem.product.name}>
                    {returnItem.product.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">SKU</span>
                  <span className="font-semibold text-slate-800">{returnItem.product.sku}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Return Reason</span>
                  <span className="font-medium text-slate-800">{returnItem.reason}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Status</span>
                  <div className="mt-0.5">{getStatusBadge(returnItem.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Requested On</span>
                  <span className="font-medium text-slate-800">{returnItem.requestedOnFull}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Return Window</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                    {returnItem.returnWindow}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Refund Amount</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{returnItem.refundAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="col-span-2 pt-1">
                  <span className="text-slate-400 block text-[11px] mb-1">Return Label</span>
                  <button
                    onClick={() => setIsLabelGenerated(true)}
                    className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isLabelGenerated ? 'Print Reverse Label (Ready)' : 'Generate Label'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Customer Information Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs pb-1 border-b border-slate-100">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Customer Information</span>
              </div>

              <div
                onClick={() => setActiveTab('Customer')}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {returnItem.customer.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">
                      {returnItem.customer.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {returnItem.customer.email}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {returnItem.customer.phone}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* 3. Return Images Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Return Images</span>
                </div>
                <button
                  onClick={() => setActiveTab('Images')}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View All (5)
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* Image 1: Main Product */}
                <div
                  onClick={() => setSelectedImagePreview('product-damage')}
                  className="relative aspect-square rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors group overflow-hidden"
                >
                  <ProductCatalogGraphic type={returnItem.product.imageType} className="w-10 h-10" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Image 2: Cap / Component Macro */}
                <div
                  onClick={() => setSelectedImagePreview('cap-scratch')}
                  className="relative aspect-square rounded-lg bg-slate-900/10 border border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors group overflow-hidden"
                >
                  <svg viewBox="0 0 40 40" className="w-9 h-9 text-slate-700">
                    <circle cx="20" cy="20" r="14" fill="#334155" />
                    <circle cx="20" cy="20" r="8" fill="#64748B" />
                    <line x1="14" y1="17" x2="26" y2="23" stroke="#F87171" strokeWidth="1.5" strokeDasharray="2,2" />
                  </svg>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Image 3: Packaging Box */}
                <div
                  onClick={() => setSelectedImagePreview('box-damage')}
                  className="relative aspect-square rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors group overflow-hidden"
                >
                  <svg viewBox="0 0 40 40" className="w-9 h-9">
                    <rect x="8" y="10" width="24" height="20" rx="2" fill="#D97706" opacity="0.85" />
                    <line x1="8" y1="20" x2="32" y2="20" stroke="#92400E" strokeWidth="1.5" />
                    <line x1="20" y1="10" x2="20" y2="30" stroke="#92400E" strokeWidth="1.5" />
                  </svg>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Image 4: +2 Count */}
                <div
                  onClick={() => setActiveTab('Images')}
                  className="aspect-square rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-xs text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  +2
                </div>
              </div>
            </div>

            {/* 4. Resolution Actions Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs pb-1 border-b border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Resolution Actions</span>
              </div>

              {/* Primary Decision Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateStatus?.(returnItem.id, 'Approved')}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Return</span>
                </button>

                <button
                  onClick={() => onUpdateStatus?.(returnItem.id, 'Rejected')}
                  className="py-2 px-3 bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Return</span>
                </button>
              </div>

              {/* 2x2 Secondary Actions Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onProcessRefund?.(returnItem);
                    onUpdateStatus?.(returnItem.id, 'Refunded');
                  }}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                  <span>Process Refund</span>
                </button>

                <button
                  onClick={() => {
                    onCreateReplacement?.(returnItem);
                    onUpdateStatus?.(returnItem.id, 'Replacement');
                  }}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Create Replacement</span>
                </button>

                <button
                  onClick={() => {
                    window.location.href = `mailto:${returnItem.customer.email}?subject=Return ${returnItem.returnId} Support - SellerHub`;
                  }}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Contact Customer</span>
                </button>

                <button
                  onClick={() => setActiveTab('Notes')}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Customer Tab */}
        {activeTab === 'Customer' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center">
                  {returnItem.customer.initials}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{returnItem.customer.name}</h4>
                  <div className="text-xs text-slate-500">{returnItem.customer.email}</div>
                  <div className="text-xs text-slate-500">{returnItem.customer.phone}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Total Orders</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">14 Orders</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Return Frequency</div>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5">Low (7.1%)</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Shipping / Pickup Address:</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg leading-relaxed">
                  Flat 402, Sunshine Heights, Sector 18,<br />
                  Dwarka, New Delhi - 110075, India
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'Timeline' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Return Lifecycle History</span>
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                <div className="text-xs font-semibold text-slate-800">Return Requested by Customer</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{returnItem.requestedOnFull}</div>
                <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded">
                  Reason: {returnItem.reason}. Photos provided.
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white"></div>
                <div className="text-xs font-semibold text-slate-800">Reverse Pickup Scheduled</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Estimated Pickup: Tomorrow</div>
                <div className="text-xs text-slate-600 mt-1">Courier: Delhivery Express</div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white"></div>
                <div className="text-xs font-semibold text-slate-800">Inspection at Warehouse</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Pending receipt</div>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'Images' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Proof Images Uploaded by Buyer</h4>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedImagePreview('product-damage')}
                className="aspect-square bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400"
              >
                <ProductCatalogGraphic type={returnItem.product.imageType} className="w-16 h-16" />
                <span className="text-[11px] text-slate-500 mt-2 font-medium">Front View (Dent)</span>
              </div>

              <div
                onClick={() => setSelectedImagePreview('cap-scratch')}
                className="aspect-square bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400"
              >
                <svg viewBox="0 0 40 40" className="w-16 h-16 text-slate-700">
                  <circle cx="20" cy="20" r="14" fill="#334155" />
                  <circle cx="20" cy="20" r="8" fill="#64748B" />
                  <line x1="14" y1="17" x2="26" y2="23" stroke="#F87171" strokeWidth="2" strokeDasharray="2,2" />
                </svg>
                <span className="text-[11px] text-slate-500 mt-2 font-medium">Cap Crack Closeup</span>
              </div>

              <div
                onClick={() => setSelectedImagePreview('box-damage')}
                className="aspect-square bg-amber-50/60 border border-amber-200 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400"
              >
                <svg viewBox="0 0 40 40" className="w-16 h-16">
                  <rect x="8" y="10" width="24" height="20" rx="2" fill="#D97706" opacity="0.85" />
                  <line x1="8" y1="20" x2="32" y2="20" stroke="#92400E" strokeWidth="2" />
                  <line x1="20" y1="10" x2="20" y2="30" stroke="#92400E" strokeWidth="2" />
                </svg>
                <span className="text-[11px] text-slate-500 mt-2 font-medium">Original Packaging</span>
              </div>

              <div
                onClick={() => setSelectedImagePreview('barcode-label')}
                className="aspect-square bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400"
              >
                <div className="w-12 h-10 border border-slate-300 flex items-center justify-center bg-white p-1">
                  <div className="flex gap-0.5 h-6">
                    <span className="w-1 bg-black"></span>
                    <span className="w-0.5 bg-black"></span>
                    <span className="w-1 bg-black"></span>
                    <span className="w-0.5 bg-black"></span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-medium">Shipping Label Proof</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'Notes' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Internal Seller Notes</h4>

            <div className="space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write an internal operational note..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Save Note
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {notesList.map((note) => (
                <div key={note.id} className="p-2.5 bg-slate-50 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{note.author}</span>
                    <span className="text-slate-400">{note.date}</span>
                  </div>
                  <p className="text-xs text-slate-600">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal Lightbox */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Proof Image Inspection</h3>
              <button
                onClick={() => setSelectedImagePreview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden p-6">
              <ProductCatalogGraphic type={returnItem.product.imageType} className="w-32 h-32" large />
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>High resolution proof image</span>
              <button
                onClick={() => setSelectedImagePreview(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
