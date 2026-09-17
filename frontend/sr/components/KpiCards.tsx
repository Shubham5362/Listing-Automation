import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { KpisData } from '../types';

interface KpiCardsProps {
  kpis: KpisData;
}

// Crisp Sparkline SVG component
const Sparkline = ({
  color,
  points,
}: {
  color: string;
  points: number[];
}) => {
  const width = 120;
  const height = 34;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="w-full h-8 mt-2 overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    {
      id: 'revenue',
      label: 'Revenue',
      value: `₹${(kpis.revenue || 241820).toLocaleString('en-IN')}`,
      trendText: `${kpis.revenue_growth || 14.2}% vs yesterday`,
      isUp: true,
      color: '#10b981', // emerald
      sparkPoints: [18, 25, 22, 24, 28, 31, 29],
    },
    {
      id: 'orders',
      label: 'Orders',
      value: (kpis.orders || 184).toString(),
      trendText: `${kpis.orders_growth || 12.8}% vs yesterday`,
      isUp: true,
      color: '#3b82f6', // blue
      sparkPoints: [14, 18, 16, 20, 22, 26, 25],
    },
    {
      id: 'net_profit',
      label: 'Net Profit',
      value: `₹${(kpis.net_profit || 46210).toLocaleString('en-IN')}`,
      trendText: `${kpis.net_profit_growth || 18.4}% vs yesterday`,
      isUp: true,
      color: '#8b5cf6', // purple
      sparkPoints: [5.4, 7.8, 6.2, 6.9, 8.9, 8.8, 10.2],
    },
    {
      id: 'profit_margin',
      label: 'Profit Margin',
      value: `${kpis.profit_margin || 19.1}%`,
      trendText: `${kpis.profit_margin_growth || 2.4}% vs yesterday`,
      isUp: true,
      color: '#14b8a6', // teal
      sparkPoints: [18.2, 18.5, 18.4, 18.7, 18.9, 19.0, 19.1],
    },
    {
      id: 'returns',
      label: 'Returns',
      value: (kpis.returns || 8).toString(),
      trendText: `${Math.abs(kpis.returns_growth || 20.0)}% vs yesterday`,
      isUp: false, // Down is good for returns, but shown with down arrow in red
      color: '#f43f5e', // rose
      sparkPoints: [12, 11, 10, 9, 11, 9, 8],
    },
    {
      id: 'inventory_value',
      label: 'Inventory Value',
      value: kpis.inventory_value || '₹12.4L',
      trendText: `${kpis.inventory_value_growth || 5.1}% vs yesterday`,
      isUp: true,
      color: '#f59e0b', // amber
      sparkPoints: [11.8, 11.9, 12.0, 12.1, 12.2, 12.3, 12.4],
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
        >
          <div>
            <div className="text-[13px] font-medium text-slate-500">{card.label}</div>
            <div className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight mt-1">
              {card.value}
            </div>

            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold">
              {card.isUp ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span className="text-emerald-600">↑ {card.trendText}</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                  <span className="text-rose-600">↓ {card.trendText}</span>
                </>
              )}
            </div>
          </div>

          <Sparkline color={card.color} points={card.sparkPoints} />
        </div>
      ))}
    </div>
  );
}
