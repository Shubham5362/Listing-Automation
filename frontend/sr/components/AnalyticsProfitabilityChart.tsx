import React, { useState } from 'react';

interface ProfitDayData {
  day: string;
  revenue: number;
  profit: number;
}

const profitData: ProfitDayData[] = [
  { day: 'Dec 1', revenue: 48000, profit: 12500 },
  { day: 'Dec 2', revenue: 62000, profit: 15400 },
  { day: 'Dec 3', revenue: 78000, profit: 19200 },
  { day: 'Dec 4', revenue: 71000, profit: 17800 },
  { day: 'Dec 5', revenue: 65000, profit: 16100 },
  { day: 'Dec 6', revenue: 84000, profit: 21500 },
  { day: 'Dec 7', revenue: 89000, profit: 22800 },
  { day: 'Dec 8', revenue: 98000, profit: 25400 },
  { day: 'Dec 9', revenue: 68000, profit: 17200 },
  { day: 'Dec 10', revenue: 76000, profit: 19500 },
  { day: 'Dec 11', revenue: 72000, profit: 18400 },
  { day: 'Dec 12', revenue: 91000, profit: 23600 },
  { day: 'Dec 13', revenue: 104000, profit: 27100 },
  { day: 'Dec 14', revenue: 88000, profit: 22400 },
  { day: 'Dec 15', revenue: 82000, profit: 20900 },
];

export default function AnalyticsProfitabilityChart() {
  const [hoveredDay, setHoveredDay] = useState<ProfitDayData | null>(null);

  const width = 340;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxRevenue = 120000; // ₹1.2L max

  const getY = (val: number) => height - paddingBottom - (val / maxRevenue) * chartHeight;
  const getX = (idx: number) => paddingLeft + (idx / (profitData.length - 1)) * chartWidth;

  // Generate profit line path
  const linePoints = profitData.map((d, i) => `${getX(i).toFixed(1)},${getY(d.profit * 3.6).toFixed(1)}`);
  const profitLinePath = `M ${linePoints.join(' L ')}`;

  const yTicks = [
    { label: '₹1.2L', val: 120000 },
    { label: '₹80K', val: 80000 },
    { label: '₹40K', val: 40000 },
    { label: '₹0', val: 0 },
  ];

  const xTicks = [
    { label: 'Dec 1', index: 0 },
    { label: 'Dec 5', index: 4 },
    { label: 'Dec 9', index: 8 },
    { label: 'Dec 13', index: 12 },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full">
      {/* Header & Legend */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Profitability</h3>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Profit</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative w-full my-auto select-none pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick.val);
            return (
              <g key={`profit-y-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="inherit"
                  fontWeight="500"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Revenue Bars */}
          {profitData.map((d, i) => {
            const x = getX(i);
            const barY = getY(d.revenue);
            const barHeight = height - paddingBottom - barY;
            const barWidth = 4;
            const isHovered = hoveredDay?.day === d.day;

            return (
              <rect
                key={`bar-${i}`}
                x={x - barWidth / 2}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx={1.5}
                fill={isHovered ? '#1d4ed8' : '#2563eb'}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
              />
            );
          })}

          {/* Profit Trend Line */}
          <path
            d={profitLinePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Profit dots */}
          {profitData.map((d, i) => {
            const x = getX(i);
            const y = getY(d.profit * 3.6);
            return (
              <circle
                key={`dot-${i}`}
                cx={x}
                cy={y}
                r="2.5"
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth="1.5"
              />
            );
          })}

          {/* X Axis Labels */}
          {xTicks.map((xt, i) => (
            <text
              key={`xtick-profit-${i}`}
              x={getX(xt.index)}
              y={height - 10}
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontFamily="inherit"
              fontWeight="500"
            >
              {xt.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredDay && (
          <div className="absolute top-0 right-2 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-md shadow-md pointer-events-none">
            <div className="font-semibold text-slate-200">{hoveredDay.day}</div>
            <div>Rev: ₹{hoveredDay.revenue.toLocaleString('en-IN')}</div>
            <div className="text-emerald-400">Profit: ₹{hoveredDay.profit.toLocaleString('en-IN')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
