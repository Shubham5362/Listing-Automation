import React from 'react';
import { OrderStatusData } from '../types';

interface OrderStatusCardProps {
  orderStatus: OrderStatusData;
  onViewAll?: () => void;
}

export default function OrderStatusCard({
  orderStatus,
  onViewAll,
}: OrderStatusCardProps) {
  const breakdown = orderStatus.breakdown || [
    { name: 'Delivered', count: 124, percent: 67, color: '#10b981' },
    { name: 'Shipped', count: 28, percent: 15, color: '#3b82f6' },
    { name: 'Processing', count: 18, percent: 10, color: '#f59e0b' },
    { name: 'Cancelled', count: 8, percent: 4, color: '#ef4444' },
    { name: 'Return Requested', count: 6, percent: 3, color: '#8b5cf6' },
  ];

  // SVG Donut calculation
  const size = 110;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">Order Status</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          View all →
        </button>
      </div>

      {/* Donut and Legend row */}
      <div className="flex items-center justify-between gap-4 mt-3">
        {/* Donut Chart with Center Text */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            {breakdown.map((seg, idx) => {
              const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += seg.percent;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold text-slate-900 leading-none">
              {orderStatus.total || 184}
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
              Total Orders
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 text-xs">
          {breakdown.map((seg, idx) => (
            <div key={idx} className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-medium">{seg.name}</span>
              </div>
              <span className="font-bold text-slate-900">
                {seg.count} <span className="font-normal text-slate-400 text-[11px]">({seg.percent}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
