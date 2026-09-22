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
  const rev = kpis?.revenue ?? 0;
  const ords = kpis?.orders ?? 0;
  const netProf = kpis?.net_profit ?? 0;
  const margin = kpis?.profit_margin ?? (rev > 0 ? (netProf / rev) * 100 : 0);
  const rets = kpis?.returns ?? 0;
  const invVal = kpis?.inventory_value || (kpis?.inventory_value_numeric ? `₹${kpis.inventory_value_numeric.toLocaleString('en-IN')}` : '₹0');

  const cards = [
    {
      id: 'revenue',
      label: 'Revenue',
      value: `₹${Math.round(rev).toLocaleString('en-IN')}`,
      trendText: `${kpis?.revenue_growth != null ? kpis.revenue_growth : 0}% vs yesterday`,
      isUp: (kpis?.revenue_growth ?? 0) >= 0,
      color: '#10b981', // emerald
      sparkPoints: [rev * 0.7, rev * 0.85, rev * 0.78, rev * 0.9, rev * 0.95, rev * 0.92, rev || 1],
    },
    {
      id: 'orders',
      label: 'Orders',
      value: ords.toString(),
      trendText: `${kpis?.orders_growth != null ? kpis.orders_growth : 0}% vs yesterday`,
      isUp: (kpis?.orders_growth ?? 0) >= 0,
      color: '#3b82f6', // blue
      sparkPoints: [ords * 0.6, ords * 0.8, ords * 0.75, ords * 0.9, ords * 0.85, ords * 0.95, ords || 1],
    },
    {
      id: 'net_profit',
      label: 'Net Profit',
      value: `₹${Math.round(netProf).toLocaleString('en-IN')}`,
      trendText: `${kpis?.net_profit_growth != null ? kpis.net_profit_growth : 0}% vs yesterday`,
      isUp: (kpis?.net_profit_growth ?? 0) >= 0,
      color: '#8b5cf6', // purple
      sparkPoints: [netProf * 0.65, netProf * 0.8, netProf * 0.7, netProf * 0.85, netProf * 0.9, netProf * 0.95, netProf || 1],
    },
    {
      id: 'profit_margin',
      label: 'Profit Margin',
      value: `${margin.toFixed(1)}%`,
      trendText: `${kpis?.profit_margin_growth != null ? kpis.profit_margin_growth : 0}% vs yesterday`,
      isUp: (kpis?.profit_margin_growth ?? 0) >= 0,
      color: '#14b8a6', // teal
      sparkPoints: [margin * 0.9, margin * 0.92, margin * 0.95, margin * 0.98, margin, margin * 0.99, margin || 1],
    },
    {
      id: 'returns',
      label: 'Returns',
      value: rets.toString(),
      trendText: `${Math.abs(kpis?.returns_growth || 0)}% vs yesterday`,
      isUp: (kpis?.returns_growth ?? 0) <= 0, // Down is good for returns
      color: '#f43f5e', // rose
      sparkPoints: [rets + 2, rets + 1, rets + 2, rets + 1, rets, rets, rets || 1],
    },
    {
      id: 'inventory_value',
      label: 'Inventory Value',
      value: invVal,
      trendText: `${kpis?.inventory_value_growth != null ? kpis.inventory_value_growth : 0}% vs yesterday`,
      isUp: (kpis?.inventory_value_growth ?? 0) >= 0,
      color: '#f59e0b', // amber
      sparkPoints: [10, 11, 11, 12, 12, 12.2, 12.4],
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
