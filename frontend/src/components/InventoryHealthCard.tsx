import React from 'react';
import { RefreshCw } from 'lucide-react';
import { InventoryHealthData } from '../types';

interface InventoryHealthCardProps {
  inventoryHealth: InventoryHealthData;
  onViewAll?: () => void;
}

export default function InventoryHealthCard({
  inventoryHealth,
  onViewAll,
}: InventoryHealthCardProps) {
  const data = inventoryHealth || {
    health_score: 0,
    total_items: 0,
    healthy: 0,
    low_stock: 0,
    out_of_stock: 0,
    dead_stock: 0,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">
          Inventory Health
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          View all →
        </button>
      </div>

      {/* Stock Health Metric & Progress Bar */}
      <div className="my-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <RefreshCw className="w-3 h-3" />
            </span>
            <span>Stock Health</span>
          </div>
          <span className="font-extrabold text-emerald-600 text-sm">
            {data.health_score}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${data.health_score}%` }}
          />
        </div>
      </div>

      {/* 2x2 Grid of Status Tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5">
          <div className="text-base font-extrabold text-emerald-600">
            {data.healthy.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Healthy
          </div>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5">
          <div className="text-base font-extrabold text-amber-500">
            {data.low_stock.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Low Stock
          </div>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5">
          <div className="text-base font-extrabold text-rose-600">
            {data.out_of_stock.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Out of Stock
          </div>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5">
          <div className="text-base font-extrabold text-slate-700">
            {data.dead_stock.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Dead Stock
          </div>
        </div>
      </div>
    </div>
  );
}
