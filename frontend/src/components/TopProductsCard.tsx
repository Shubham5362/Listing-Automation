import React from 'react';
import { TopProductItem } from '../types';

interface TopProductsCardProps {
  products: TopProductItem[];
  onViewAll?: () => void;
}

export default function TopProductsCard({
  products,
  onViewAll,
}: TopProductsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">
          Top Products (by Revenue)
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          View all →
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="pb-2 w-8">#</th>
              <th className="pb-2">Product</th>
              <th className="pb-2 text-right">Revenue</th>
              <th className="pb-2 text-right">Units</th>
              <th className="pb-2 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {products.map((p, idx) => {
              const rowKey = p.id ?? p.product_id ?? p.sku ?? `prod-${p.rank || idx}`;
              return (
                <tr key={rowKey} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 font-bold text-slate-400">{p.rank}</td>
                  <td className="py-2.5 font-semibold text-slate-900 pr-2 truncate max-w-[150px]">
                    {p.name}
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900">
                    ₹{p.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-right text-slate-600">{p.units}</td>
                  <td className="py-2.5 text-right font-bold text-emerald-600">
                    {p.margin}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
