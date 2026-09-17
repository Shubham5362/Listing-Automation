import React, { useState } from 'react';

interface RevenueExpensesPoint {
  date: string;
  revenue: number;
  revenueDisplay: string;
  fees: number;
  feesDisplay: string;
  netProfit: number;
  netProfitDisplay: string;
}

const revenueExpenseData: RevenueExpensesPoint[] = [
  { date: 'Dec 1', revenue: 165000, revenueDisplay: '₹1,65,000', fees: 48000, feesDisplay: '₹48,000', netProfit: 62000, netProfitDisplay: '₹62,000' },
  { date: 'Dec 5', revenue: 215000, revenueDisplay: '₹2,15,000', fees: 58000, feesDisplay: '₹58,000', netProfit: 85000, netProfitDisplay: '₹85,000' },
  { date: 'Dec 9', revenue: 172000, revenueDisplay: '₹1,72,000', fees: 52000, feesDisplay: '₹52,000', netProfit: 65000, netProfitDisplay: '₹65,000' },
  { date: 'Dec 13', revenue: 245000, revenueDisplay: '₹2,45,000', fees: 72000, feesDisplay: '₹72,000', netProfit: 95000, netProfitDisplay: '₹95,000' },
  { date: 'Dec 17', revenue: 220000, revenueDisplay: '₹2,20,000', fees: 64000, feesDisplay: '₹64,000', netProfit: 88000, netProfitDisplay: '₹88,000' },
  { date: 'Dec 21', revenue: 268000, revenueDisplay: '₹2,68,000', fees: 79000, feesDisplay: '₹79,000', netProfit: 112000, netProfitDisplay: '₹1,12,000' },
  { date: 'Dec 25', revenue: 210000, revenueDisplay: '₹2,10,000', fees: 59000, feesDisplay: '₹59,000', netProfit: 78000, netProfitDisplay: '₹78,000' },
  { date: 'Dec 28', revenue: 248000, revenueDisplay: '₹2,48,000', fees: 71000, feesDisplay: '₹71,000', netProfit: 104000, netProfitDisplay: '₹1,04,000' },
  { date: 'Dec 31', revenue: 236000, revenueDisplay: '₹2,36,000', fees: 68000, feesDisplay: '₹68,000', netProfit: 96000, netProfitDisplay: '₹96,000' },
];

export default function FinanceRevenueChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 640;
  const height = 230;
  const paddingLeft = 46;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxVal = 300000; // ₹3L max scale

  const getX = (idx: number) => paddingLeft + (idx / (revenueExpenseData.length - 1)) * chartWidth;
  const getY = (val: number) => height - paddingBottom - (val / maxVal) * chartHeight;

  // Spline path generator
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const revenuePoints = revenueExpenseData.map((d, i) => ({ x: getX(i), y: getY(d.revenue) }));
  const feesPoints = revenueExpenseData.map((d, i) => ({ x: getX(i), y: getY(d.fees) }));
  const netProfitPoints = revenueExpenseData.map((d, i) => ({ x: getX(i), y: getY(d.netProfit) }));

  const revenuePath = createSmoothPath(revenuePoints);
  const feesPath = createSmoothPath(feesPoints);
  const netProfitPath = createSmoothPath(netProfitPoints);

  const revenueAreaPath = `${revenuePath} L ${getX(revenueExpenseData.length - 1).toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${getX(0).toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;

  const yTicks = [
    { label: '₹3L', val: 300000 },
    { label: '₹2L', val: 200000 },
    { label: '₹1L', val: 100000 },
    { label: '₹0', val: 0 },
  ];

  const xTicks = [
    { label: 'Dec 1', index: 0 },
    { label: 'Dec 5', index: 1 },
    { label: 'Dec 9', index: 2 },
    { label: 'Dec 13', index: 3 },
    { label: 'Dec 17', index: 4 },
    { label: 'Dec 21', index: 5 },
    { label: 'Dec 25', index: 6 },
    { label: 'Dec 31', index: 8 },
  ];

  const activePoint = hoveredIndex !== null ? revenueExpenseData[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full space-y-2">
      {/* Header & Legends */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
          Revenue vs Expenses
        </h3>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            <span>Fees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>Net Profit</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full pt-1 select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="financeRevenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.14" />
              <stop offset="90%" stopColor="#2563eb" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick.val);
            return (
              <g key={`grid-rev-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="inherit"
                  fontWeight="500"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Revenue Area Fill */}
          <path d={revenueAreaPath} fill="url(#financeRevenueGrad)" />

          {/* Curves */}
          {/* Revenue line (blue) */}
          <path
            d={revenuePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Net Profit line (emerald) */}
          <path
            d={netProfitPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Fees line (rose) */}
          <path
            d={feesPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Points */}
          {revenuePoints.map((pt, i) => (
            <circle
              key={`rev-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIndex === i ? '4.5' : '3'}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={hoveredIndex === i ? '2.5' : '2'}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}

          {feesPoints.map((pt, i) => (
            <circle
              key={`fee-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="2.5"
              fill="#ffffff"
              stroke="#f43f5e"
              strokeWidth="1.5"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}

          {netProfitPoints.map((pt, i) => (
            <circle
              key={`np-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="2.5"
              fill="#ffffff"
              stroke="#10b981"
              strokeWidth="1.5"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}

          {/* Hover guideline */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop - 5}
              x2={getX(hoveredIndex)}
              y2={height - paddingBottom}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* X Axis Labels */}
          {xTicks.map((xt, i) => (
            <text
              key={`x-tick-${i}`}
              x={getX(xt.index)}
              y={height - 12}
              textAnchor="middle"
              fill="#64748b"
              fontSize="11"
              fontFamily="inherit"
              fontWeight="500"
            >
              {xt.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-lg px-3 py-2 text-xs transition-all"
            style={{
              left: `${(getX(hoveredIndex!) / width) * 100}%`,
              top: '5%',
              transform: 'translate(-50%, 0)',
            }}
          >
            <div className="font-semibold text-slate-700 pb-1 border-b border-slate-100">
              {activePoint.date}, 2024
            </div>
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">Revenue:</span>
                <span className="font-bold text-blue-600">{activePoint.revenueDisplay}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">Fees:</span>
                <span className="font-bold text-rose-500">{activePoint.feesDisplay}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">Net Profit:</span>
                <span className="font-bold text-emerald-600">{activePoint.netProfitDisplay}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
