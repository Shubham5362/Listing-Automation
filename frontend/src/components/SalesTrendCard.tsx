import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { SalesTrendData } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';

interface SalesTrendCardProps {
  salesTrend: SalesTrendData;
}

export default function SalesTrendCard({ salesTrend }: SalesTrendCardProps) {
  const [metricType, setMetricType] = useState<'Revenue' | 'Orders'>('Revenue');

  const timeline = salesTrend?.timeline?.length ? salesTrend.timeline : [];

  const amazonTotal = salesTrend?.marketplaces?.find((m) => m.name.toLowerCase() === 'amazon') || {
    revenue: timeline.reduce((acc, d) => acc + (d.amazon || 0), 0),
    growth: 0,
  };
  const flipkartTotal = salesTrend?.marketplaces?.find((m) => m.name.toLowerCase() === 'flipkart') || {
    revenue: timeline.reduce((acc, d) => acc + (d.flipkart || 0), 0),
    growth: 0,
    share_percent: 0,
  };

  const totalRevenue = salesTrend?.total || (amazonTotal.revenue + flipkartTotal.revenue);

  // SVG Chart Dimensions
  const width = 480;
  const height = 150;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max scale computed dynamically
  const maxDayVal = timeline.length
    ? Math.max(...timeline.map((d) => Math.max(d.amazon || 0, d.flipkart || 0)))
    : 1000;
  const maxVal = Math.max(maxDayVal * 1.25, 500);

  const getX = (index: number) =>
    timeline.length > 1
      ? paddingLeft + (index / (timeline.length - 1)) * chartWidth
      : paddingLeft + chartWidth / 2;
  const getY = (val: number) =>
    height - paddingBottom - (val / maxVal) * chartHeight;

  // Line paths
  const amazonPoints = timeline.map((d, i) => `${getX(i).toFixed(1)},${getY(d.amazon || 0).toFixed(1)}`);
  const flipkartPoints = timeline.map((d, i) => `${getX(i).toFixed(1)},${getY(d.flipkart || 0).toFixed(1)}`);

  const amazonPath = amazonPoints.length ? `M ${amazonPoints.join(' L ')}` : '';
  const flipkartPath = flipkartPoints.length ? `M ${flipkartPoints.join(' L ')}` : '';

  const formatTick = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}K`;
    return `₹${Math.round(val)}`;
  };

  const yLabels = [
    { label: formatTick(maxVal), y: getY(maxVal) },
    { label: formatTick(maxVal * 0.75), y: getY(maxVal * 0.75) },
    { label: formatTick(maxVal * 0.5), y: getY(maxVal * 0.5) },
    { label: formatTick(maxVal * 0.25), y: getY(maxVal * 0.25) },
    { label: '0', y: height - paddingBottom },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-900">Sales Trend</h3>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs">
          <span>{metricType}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Primary Value Callout */}
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ₹{Math.round(totalRevenue).toLocaleString('en-IN')}
        </div>
        <div className="flex items-center text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>↑ {salesTrend?.growth ?? 0}% vs yesterday</span>
        </div>
      </div>

      {/* SVG Dual-Line Chart */}
      <div className="w-full my-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible"
        >
          {/* Grid lines */}
          {yLabels.map((yl, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={yl.y}
                x2={width - paddingRight}
                y2={yl.y}
                stroke="#f1f5f9"
                strokeDasharray={i === yLabels.length - 1 ? 'none' : '3 3'}
              />
              <text
                x={paddingLeft - 8}
                y={yl.y + 3}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="end"
                fontWeight="500"
              >
                {yl.label}
              </text>
            </g>
          ))}

          {/* Amazon Blue Line */}
          <path
            d={amazonPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Flipkart Yellow Line */}
          <path
            d={flipkartPath}
            fill="none"
            stroke="#eab308"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots */}
          {timeline.map((d, i) => (
            <g key={i}>
              {/* Amazon dot */}
              <circle
                cx={getX(i)}
                cy={getY(d.amazon)}
                r="3.5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              {/* Flipkart dot */}
              <circle
                cx={getX(i)}
                cy={getY(d.flipkart)}
                r="3.5"
                fill="#eab308"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* X Axis Day Labels */}
              <text
                x={getX(i)}
                y={height - 6}
                fill="#94a3b8"
                fontSize="9.5"
                textAnchor="middle"
                fontWeight="500"
              >
                {d.day}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-600 font-medium mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Amazon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span>Flipkart</span>
        </div>
      </div>

      {/* Bottom Marketplace Comparison Boxes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Amazon Box */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AmazonLogo className="w-4 h-4" />
            <div>
              <div className="text-xs font-semibold text-slate-700">Amazon</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                ₹{amazonTotal.revenue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center">
            ↑ {amazonTotal.growth}%
          </div>
        </div>

        {/* Flipkart Box */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FlipkartLogo className="w-4 h-4" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700">Flipkart</span>
                <span className="px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                  {Math.round(flipkartTotal.share_percent || (totalRevenue > 0 ? (flipkartTotal.revenue / totalRevenue) * 100 : 0))}%
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                ₹{flipkartTotal.revenue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center">
            ↑ {flipkartTotal.growth}%
          </div>
        </div>
      </div>
    </div>
  );
}
