import React, { useState } from 'react';

interface ChartDataPoint {
  date: string;
  fullDate: string;
  adSpend: number;
  adSpendDisplay: string;
  salesAd: number;
  salesAdDisplay: string;
  acos: number;
  acosDisplay: string;
  spendYVal: number; // for path calculation (0 - 60000)
  salesYVal: number; // for path calculation (0 - 60000)
  acosYVal: number;  // 0 - 40 mapped to 0 - 60000
}

const trendData: ChartDataPoint[] = [
  {
    date: 'Dec 1',
    fullDate: 'Dec 1, 2024',
    adSpend: 19800,
    adSpendDisplay: '₹19,800',
    salesAd: 98000,
    salesAdDisplay: '₹98,000',
    acos: 20.2,
    acosDisplay: '20.2%',
    spendYVal: 19800,
    salesYVal: 32000,
    acosYVal: (20.2 / 40) * 60000,
  },
  {
    date: 'Dec 3',
    fullDate: 'Dec 3, 2024',
    adSpend: 24200,
    adSpendDisplay: '₹24,200',
    salesAd: 114000,
    salesAdDisplay: '₹1,14,000',
    acos: 21.2,
    acosDisplay: '21.2%',
    spendYVal: 24200,
    salesYVal: 35000,
    acosYVal: (21.2 / 40) * 60000,
  },
  {
    date: 'Dec 5',
    fullDate: 'Dec 5, 2024',
    adSpend: 21500,
    adSpendDisplay: '₹21,500',
    salesAd: 128000,
    salesAdDisplay: '₹1,28,000',
    acos: 16.8,
    acosDisplay: '16.8%',
    spendYVal: 21500,
    salesYVal: 39000,
    acosYVal: (16.8 / 40) * 60000,
  },
  {
    date: 'Dec 7',
    fullDate: 'Dec 7, 2024',
    adSpend: 23100,
    adSpendDisplay: '₹23,100',
    salesAd: 139000,
    salesAdDisplay: '₹1,39,000',
    acos: 16.6,
    acosDisplay: '16.6%',
    spendYVal: 23100,
    salesYVal: 44000,
    acosYVal: (16.6 / 40) * 60000,
  },
  {
    date: 'Dec 8',
    fullDate: 'Dec 8, 2024',
    adSpend: 32450,
    adSpendDisplay: '₹32,450',
    salesAd: 162300,
    salesAdDisplay: '₹1,62,300',
    acos: 20.0,
    acosDisplay: '20.0%',
    spendYVal: 32450,
    salesYVal: 48500,
    acosYVal: (20.0 / 40) * 60000,
  },
  {
    date: 'Dec 9',
    fullDate: 'Dec 9, 2024',
    adSpend: 21800,
    adSpendDisplay: '₹21,800',
    salesAd: 138000,
    salesAdDisplay: '₹1,38,000',
    acos: 15.8,
    acosDisplay: '15.8%',
    spendYVal: 21800,
    salesYVal: 43000,
    acosYVal: (15.8 / 40) * 60000,
  },
  {
    date: 'Dec 13',
    fullDate: 'Dec 13, 2024',
    adSpend: 25400,
    adSpendDisplay: '₹25,400',
    salesAd: 146000,
    salesAdDisplay: '₹1,46,000',
    acos: 17.4,
    acosDisplay: '17.4%',
    spendYVal: 25400,
    salesYVal: 47000,
    acosYVal: (17.4 / 40) * 60000,
  },
  {
    date: 'Dec 15',
    fullDate: 'Dec 15, 2024',
    adSpend: 28900,
    adSpendDisplay: '₹28,900',
    salesAd: 151000,
    salesAdDisplay: '₹1,51,000',
    acos: 19.1,
    acosDisplay: '19.1%',
    spendYVal: 28900,
    salesYVal: 46000,
    acosYVal: (19.1 / 40) * 60000,
  },
];

export default function AdPerformanceTrendChart() {
  // Default to index 4 (Dec 8, 2024) to match reference screenshot exactly
  const [activeIdx, setActiveIdx] = useState<number>(4);

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 50;
  const padTop = 20;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const maxVal = 60000;

  const getX = (i: number) => padLeft + (i / (trendData.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  // Generate smooth cardinal/bezier spline path
  const createSplinePath = (getYVal: (d: ChartDataPoint) => number) => {
    const points = trendData.map((d, i) => ({ x: getX(i), y: getY(getYVal(d)) }));
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i != points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const spendPath = createSplinePath((d) => d.spendYVal);
  const salesPath = createSplinePath((d) => d.salesYVal);
  const acosPath = createSplinePath((d) => d.acosYVal);

  const activePoint = trendData[activeIdx];
  const activeX = getX(activeIdx);
  const activeSpendY = getY(activePoint.spendYVal);
  const activeSalesY = getY(activePoint.salesYVal);
  const activeAcosY = getY(activePoint.acosYVal);

  // Y-axis grid points (0, 20k, 40k, 60k)
  const yTicks = [
    { left: '₹60K', right: '40%', yVal: 60000 },
    { left: '₹40K', right: '30%', yVal: 45000 },
    { left: '₹20K', right: '20%', yVal: 30000 },
    { left: '₹0', right: '0%', yVal: 0 },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h3 className="text-sm font-bold text-slate-900">Ad Performance Trend</h3>

        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]" />
            <span>Ad Spend</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]" />
            <span>Sales (Ad)</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]" />
            <span>ACOS</span>
          </div>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Subtle gradients */}
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tick, i) => {
            const y = getY(tick.yVal);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={i === yTicks.length - 1 ? 'none' : '4 4'}
                />
                {/* Left Y-axis Label */}
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-400 font-medium"
                >
                  {tick.left}
                </text>
                {/* Right Y-axis Label */}
                <text
                  x={svgWidth - padRight + 10}
                  y={y + 4}
                  textAnchor="start"
                  className="text-[11px] fill-slate-400 font-medium"
                >
                  {tick.right}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path
            d={`${salesPath} L ${getX(trendData.length - 1)} ${padTop + chartH} L ${padLeft} ${padTop + chartH} Z`}
            fill="url(#salesGrad)"
          />
          <path
            d={`${spendPath} L ${getX(trendData.length - 1)} ${padTop + chartH} L ${padLeft} ${padTop + chartH} Z`}
            fill="url(#spendGrad)"
          />

          {/* Lines */}
          {/* Sales (Ad) - Green */}
          <path
            d={salesPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Ad Spend - Blue */}
          <path
            d={spendPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* ACOS - Orange */}
          <path
            d={acosPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Active Hover Guideline and Markers */}
          {activeIdx !== null && (
            <g>
              {/* Vertical dotted line */}
              <line
                x1={activeX}
                y1={padTop}
                x2={activeX}
                y2={padTop + chartH}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Dots on the curves */}
              {/* Sales dot */}
              <circle
                cx={activeX}
                cy={activeSalesY}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-xs"
              />
              {/* Spend dot */}
              <circle
                cx={activeX}
                cy={activeSpendY}
                r="4.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-xs"
              />
              {/* ACOS dot */}
              <circle
                cx={activeX}
                cy={activeAcosY}
                r="4.5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-xs"
              />
            </g>
          )}

          {/* X-Axis Labels */}
          {trendData.map((d, i) => {
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={padTop + chartH + 20}
                textAnchor="middle"
                className={`text-[11px] font-medium transition-colors ${
                  activeIdx === i ? 'fill-slate-900 font-bold' : 'fill-slate-400'
                }`}
              >
                {d.date}
              </text>
            );
          })}

          {/* Transparent interactive overlay columns for hovering */}
          {trendData.map((_, i) => {
            const width = chartW / trendData.length;
            const x = getX(i) - width / 2;
            return (
              <rect
                key={i}
                x={x}
                y={padTop}
                width={width}
                height={chartH + padBottom}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => setActiveIdx(i)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip matching screenshot */}
        {activePoint && (
          <div
            className="absolute pointer-events-none transition-all duration-150 ease-out z-10"
            style={{
              left: `${((activeX / svgWidth) * 100).toFixed(1)}%`,
              top: '8%',
              transform: 'translate(-50%, 0)',
            }}
          >
            <div className="bg-white/95 backdrop-blur-xs rounded-lg border border-slate-200/90 shadow-lg px-3.5 py-2.5 text-xs min-w-[145px]">
              <div className="font-bold text-slate-800 text-[11px] pb-1.5 border-b border-slate-100">
                {activePoint.fullDate}
              </div>

              <div className="mt-1.5 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                    <span>Ad Spend</span>
                  </div>
                  <span className="font-bold text-slate-900">{activePoint.adSpendDisplay}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span>Sales (Ad)</span>
                  </div>
                  <span className="font-bold text-slate-900">{activePoint.salesAdDisplay}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span>ACOS</span>
                  </div>
                  <span className="font-bold text-slate-900">{activePoint.acosDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
