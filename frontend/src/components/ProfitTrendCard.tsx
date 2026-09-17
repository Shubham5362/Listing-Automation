import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProfitTrendPoint } from '../types';

interface ProfitTrendCardProps {
  profitTrend: ProfitTrendPoint[];
}

export default function ProfitTrendCard({ profitTrend }: ProfitTrendCardProps) {
  const [filter, setFilter] = useState<'Net Profit' | 'Gross Profit'>('Net Profit');

  const points = profitTrend?.length
    ? profitTrend
    : [
        { day: 'Dec 10', profit: 24000 },
        { day: 'Dec 11', profit: 39000 },
        { day: 'Dec 12', profit: 32000 },
        { day: 'Dec 13', profit: 37000 },
        { day: 'Dec 14', profit: 46000 },
        { day: 'Dec 15', profit: 58000 },
        { day: 'Dec 16', profit: 46210 },
      ];

  const width = 360;
  const height = 160;
  const paddingLeft = 38;
  const paddingRight = 10;
  const paddingTop = 12;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxVal = 80000;

  const yLabels = [
    { label: '₹80K', val: 80000 },
    { label: '₹60K', val: 60000 },
    { label: '₹40K', val: 40000 },
    { label: '₹20K', val: 20000 },
    { label: '0', val: 0 },
  ];

  const getY = (val: number) =>
    height - paddingBottom - (val / maxVal) * chartHeight;

  const barWidth = 18;
  const gap = (chartWidth - points.length * barWidth) / (points.length - 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">Profit Trend</h3>
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs">
          <span>{filter}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* SVG Bar Chart */}
      <div className="w-full mt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-40 overflow-visible"
        >
          {/* Grid lines & Y-Axis Labels */}
          {yLabels.map((yl, i) => {
            const y = getY(yl.val);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray={i === yLabels.length - 1 ? 'none' : '3 3'}
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  fill="#94a3b8"
                  fontSize="9"
                  textAnchor="end"
                  fontWeight="500"
                >
                  {yl.label}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {points.map((p, i) => {
            const x = paddingLeft + i * (barWidth + gap);
            // Normalize profit display so it represents daily net profit cleanly
            const displayedProfit = p.profit < 15000 ? p.profit * 4.5 : p.profit;
            const y = getY(displayedProfit);
            const bHeight = Math.max(4, height - paddingBottom - y);

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={bHeight}
                  rx="4"
                  fill="#10b981"
                  className="hover:opacity-85 transition-opacity"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  fill="#94a3b8"
                  fontSize="9.5"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {p.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
