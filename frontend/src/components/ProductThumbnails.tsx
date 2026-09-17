import React from 'react';
import { OrderProductItem } from '../types';

interface ProductThumbnailsProps {
  products: OrderProductItem[];
  moreCount?: number;
}

export default function ProductThumbnails({ products, moreCount = 0 }: ProductThumbnailsProps) {
  const renderProductGraphic = (type: string) => {
    switch (type) {
      case 'bottle-black':
        return (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800 fill-current">
              <path d="M10 2h4v2h-4zM9 5h6v2H9zM8 8h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
            </svg>
          </div>
        );
      case 'bottle-steel':
        return (
          <div className="w-full h-full flex items-center justify-center bg-emerald-50">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-800 fill-current">
              <path d="M10 2h4v2h-4zM9 5h6v2H9zM8 8h8v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
            </svg>
          </div>
        );
      case 'tumbler':
        return (
          <div className="w-full h-full flex items-center justify-center bg-amber-50">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-800 fill-current">
              <path d="M7 3h10l-1.5 16a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2L7 3z" />
            </svg>
          </div>
        );
      case 'mug':
        return (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800 fill-current">
              <path d="M5 5h10v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5zm10 2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2V7z" />
            </svg>
          </div>
        );
      case 'flask':
        return (
          <div className="w-full h-full flex items-center justify-center bg-indigo-50">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-800 fill-current">
              <path d="M9 2h6v2H9zM8 5h8v2H8zm-1 3h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z" />
            </svg>
          </div>
        );
      case 'bowl':
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-blue-50">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-800 fill-current">
              <path d="M4 8h16c0 6-3 10-8 10S4 14 4 8z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {products.map((item, index) => (
        <div
          key={index}
          title={`${item.name} (${item.sku})`}
          className="w-7 h-7 rounded-md border border-slate-200 overflow-hidden shrink-0 shadow-2xs hover:border-slate-300 transition-colors"
        >
          {renderProductGraphic(item.imageType)}
        </div>
      ))}

      {moreCount > 0 && (
        <span className="h-6 px-1.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center justify-center border border-slate-200">
          +{moreCount}
        </span>
      )}
    </div>
  );
}
