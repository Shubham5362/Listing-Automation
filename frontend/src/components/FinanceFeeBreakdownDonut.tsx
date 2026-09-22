import React, { useEffect, useState } from 'react';

interface FeeSegment {
  name: string;
  percentage: number;
  amount: string;
  color: string;
  hoverColor: string;
}

export default function FinanceFeeBreakdownDonut() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [feeSegments, setFeeSegments] = useState<FeeSegment[]>([]);

  useEffect(() => {
    fetch('/api/v1/finance/reports/summary')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        const rows = [
          ['Marketplace Fees', Number(data.marketplace_fees || 0)],
          ['Shipping', Number(data.shipping || 0)],
          ['Advertising', Number(data.advertising || 0)],
          ['GST', Number(data.gst || 0)],
          ['Refunds', Number(data.refunds || 0)],
          ['Other Expenses', Number(data.other_expenses || 0)],
        ];
        const total = rows.reduce((sum, [, value]) => sum + value, 0);
        setFeeSegments(rows.filter(([, value]) => value > 0).map(([name, value], index) => ({
          name: String(name),
          percentage: total > 0 ? (Number(value) / total) * 100 : 0,
          amount: `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          color: ['#2563eb','#10b981','#f97316','#0ea5e9','#8b5cf6','#64748b'][index % 6],
          hoverColor: ['#1d4ed8','#059669','#ea580c','#0284c7','#7c3aed','#475569'][index % 6],
        })));
      })
      .catch(() => setFeeSegments([]));
  }, []);

  const totalFeeAmount = feeSegments.reduce((sum, seg) => sum + Number(seg.amount.replace(/[₹,]/g, '')), 0);
  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const slices = feeSegments.map((seg, idx) => {
    const strokeDash = (seg.percentage / 100) * circumference;
    const offset = -(accumulatedPercent / 100) * circumference;
    accumulatedPercent += seg.percentage;
    return { ...seg, strokeDash, offset, index: idx };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
          Fee Breakdown
        </h3>
      </div>

      {/* Content layout: Donut on left, stats table on right */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-5 my-auto">
        {/* Donut Chart */}
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
            {/* Background ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {slices.map((slice) => (
              <circle
                key={slice.name}
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke={hoveredIdx === slice.index ? slice.hoverColor : slice.color}
                strokeWidth={hoveredIdx === slice.index ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${slice.strokeDash} ${circumference}`}
                strokeDashoffset={slice.offset}
                strokeLinecap="butt"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {hoveredIdx !== null ? feeSegments[hoveredIdx].amount : `₹${totalFeeAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5">
              {hoveredIdx !== null ? feeSegments[hoveredIdx].name : 'Total Fees'}
            </span>
          </div>
        </div>

        {/* Legend / Metrics List */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {feeSegments.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={item.name}
                className={`flex items-center justify-between py-0.5 px-2 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-50 font-medium' : ''
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 truncate font-medium">{item.name}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400 font-medium text-[11px] w-10 text-right">
                    {item.percentage}%
                  </span>
                  <span className="text-slate-900 font-bold w-18 text-right">
                    {item.amount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
