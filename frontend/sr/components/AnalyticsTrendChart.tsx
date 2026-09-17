import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface TrendPoint {
  date: string;
  fullDate: string;
  sales: number;
  salesDisplay: string;
  orders: number;
  ordersDisplay: string;
}

const analyticsTrendData: TrendPoint[] = [
  { date: 'Dec 1', fullDate: 'Dec 1, 2024', sales: 58000, salesDisplay: '₹58,000', orders: 175, ordersDisplay: '175' },
  { date: 'Dec 3', fullDate: 'Dec 3, 2024', sales: 74200, salesDisplay: '₹74,200', orders: 220, ordersDisplay: '220' },
  { date: 'Dec 5', fullDate: 'Dec 5, 2024', sales: 68500, salesDisplay: '₹68,500', orders: 195, ordersDisplay: '195' },
  { date: 'Dec 7', fullDate: 'Dec 7, 2024', sales: 72100, salesDisplay: '₹72,100', orders: 215, ordersDisplay: '215' },
  { date: 'Dec 8', fullDate: 'Dec 8, 2024', sales: 92450, salesDisplay: '₹92,450', orders: 248, ordersDisplay: '248' },
  { date: 'Dec 9', fullDate: 'Dec 9, 2024', sales: 65400, salesDisplay: '₹65,400', orders: 180, ordersDisplay: '180' },
  { date: 'Dec 11', fullDate: 'Dec 11, 2024', sales: 69200, salesDisplay: '₹69,200', orders: 198, ordersDisplay: '198' },
  { date: 'Dec 13', fullDate: 'Dec 13, 2024', sales: 94800, salesDisplay: '₹94,800', orders: 265, ordersDisplay: '265' },
  { date: 'Dec 15', fullDate: 'Dec 15, 2024', sales: 79200, salesDisplay: '₹79,200', orders: 210, ordersDisplay: '210' },
  { date: 'Dec 17', fullDate: 'Dec 17, 2024', sales: 88500, salesDisplay: '₹88,500', orders: 225, ordersDisplay: '225' },
];

export default function AnalyticsTrendChart() {
  const [interval, setInterval] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(4); // Default highlighted at Dec 8, 2024

  // Chart dimensions
  const width = 860;
  const height = 240;
  const paddingLeft = 52;
  const paddingRight = 44;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Scales
  const maxSales = 120000; // Left scale up to ₹1.2L
  const maxOrders = 400;   // Right scale up to 400

  const getX = (idx: number) => paddingLeft + (idx / (analyticsTrendData.length - 1)) * chartWidth;
  const getSalesY = (val: number) => height - paddingBottom - (val / maxSales) * chartHeight;
  const getOrdersY = (val: number) => height - paddingBottom - (val / maxOrders) * chartHeight;

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

  const salesPoints = analyticsTrendData.map((d, i) => ({ x: getX(i), y: getSalesY(d.sales) }));
  const ordersPoints = analyticsTrendData.map((d, i) => ({ x: getX(i), y: getOrdersY(d.orders) }));

  const salesPath = createSmoothPath(salesPoints);
  const ordersPath = createSmoothPath(ordersPoints);

  const salesAreaPath = `${salesPath} L ${getX(analyticsTrendData.length - 1).toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${getX(0).toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;
  const ordersAreaPath = `${ordersPath} L ${getX(analyticsTrendData.length - 1).toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${getX(0).toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;

  // Grid ticks
  const salesYTicks = [
    { label: '₹1.2L', val: 120000 },
    { label: '₹80K', val: 80000 },
    { label: '₹40K', val: 40000 },
    { label: '₹0', val: 0 },
  ];

  const ordersYTicks = [
    { label: '400', val: 400 },
    { label: '300', val: 300 },
    { label: '200', val: 200 },
    { label: '100', val: 100 },
    { label: '0', val: 0 },
  ];

  const xTicks = [
    { label: 'Dec 1', index: 0 },
    { label: 'Dec 3', index: 1 },
    { label: 'Dec 5', index: 2 },
    { label: 'Dec 7', index: 3 },
    { label: 'Dec 9', index: 5 },
    { label: 'Dec 11', index: 6 },
    { label: 'Dec 13', index: 7 },
    { label: 'Dec 15', index: 8 },
    { label: '∞', index: 9 },
  ];

  const activePoint = hoveredIndex !== null ? analyticsTrendData[hoveredIndex] : analyticsTrendData[4];
  const activeX = hoveredIndex !== null ? getX(hoveredIndex) : getX(4);
  const activeSalesY = hoveredIndex !== null ? getSalesY(activePoint.sales) : getSalesY(analyticsTrendData[4].sales);
  const activeOrdersY = hoveredIndex !== null ? getOrdersY(activePoint.orders) : getOrdersY(analyticsTrendData[4].orders);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Sales & Orders Trend
        </h3>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
              <span>Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              <span>Orders</span>
            </div>
          </div>

          {/* Interval dropdown */}
          <div className="relative">
            <button
              onClick={() => setInterval(prev => prev === 'Daily' ? 'Weekly' : prev === 'Weekly' ? 'Monthly' : 'Daily')}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <span>{interval}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full pt-1 select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="analyticsSalesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
              <stop offset="90%" stopColor="#2563eb" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="analyticsOrdersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
              <stop offset="90%" stopColor="#10b981" stopOpacity="0.01" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {salesYTicks.map((tick, idx) => {
            const y = getSalesY(tick.val);
            return (
              <g key={`grid-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                {/* Left Y label (Sales) */}
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

          {/* Right Y labels (Orders) */}
          {ordersYTicks.map((tick, idx) => {
            const y = getOrdersY(tick.val);
            return (
              <text
                key={`orders-lbl-${idx}`}
                x={width - paddingRight + 8}
                y={y + 3.5}
                textAnchor="start"
                fill="#94a3b8"
                fontSize="11"
                fontFamily="inherit"
                fontWeight="500"
              >
                {tick.label}
              </text>
            );
          })}

          {/* Area Fills */}
          <path d={salesAreaPath} fill="url(#analyticsSalesGrad)" />
          <path d={ordersAreaPath} fill="url(#analyticsOrdersGrad)" />

          {/* Spline Lines */}
          <path
            d={salesPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d={ordersPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {salesPoints.map((pt, i) => (
            <circle
              key={`sales-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIndex === i ? '4.5' : '3'}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={hoveredIndex === i ? '2.5' : '2'}
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}

          {ordersPoints.map((pt, i) => (
            <circle
              key={`orders-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIndex === i ? '4.5' : '3'}
              fill="#ffffff"
              stroke="#10b981"
              strokeWidth={hoveredIndex === i ? '2.5' : '2'}
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}

          {/* Highlight Indicator Vertical Line */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={activeX}
                y1={paddingTop - 5}
                x2={activeX}
                y2={height - paddingBottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Highlight Rings */}
              <circle
                cx={activeX}
                cy={activeSalesY}
                r="6"
                fill="#2563eb"
                fillOpacity="0.2"
              />
              <circle
                cx={activeX}
                cy={activeOrdersY}
                r="6"
                fill="#10b981"
                fillOpacity="0.2"
              />
            </g>
          )}

          {/* X Axis Tick Labels */}
          {xTicks.map((xt, i) => {
            const x = getX(xt.index);
            return (
              <text
                key={`xtick-${i}`}
                x={x}
                y={height - 12}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
                fontFamily="inherit"
                fontWeight="500"
              >
                {xt.label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip matching image */}
        {activePoint && (
          <div
            className="absolute pointer-events-none transition-all duration-150 z-20"
            style={{
              left: `${(activeX / width) * 100}%`,
              top: '8%',
              transform: 'translate(-50%, 0)',
            }}
          >
            <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-lg px-3.5 py-2.5 min-w-[140px] text-xs">
              <div className="text-[11px] font-semibold text-slate-700 pb-1.5 border-b border-slate-100">
                {activePoint.fullDate}
              </div>
              <div className="pt-1.5 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    <span className="text-slate-500 font-medium">Sales</span>
                  </div>
                  <span className="font-bold text-slate-900">{activePoint.salesDisplay}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-slate-500 font-medium">Orders</span>
                  </div>
                  <span className="font-bold text-slate-900">{activePoint.ordersDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
