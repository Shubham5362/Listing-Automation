import React from 'react';
import { KpisData } from '../types';
interface KpiCardsProps { kpis: KpisData; }
export default function KpiCards({ kpis }: KpiCardsProps) {
  const cards = [
    ['Revenue', `₹${kpis.revenue.toLocaleString('en-IN')}`, 'Selected period'],
    ['Expenses', `₹${kpis.expenses.toLocaleString('en-IN')}`, 'Tracked expenses'],
    ['Net Profit', `₹${kpis.net_profit.toLocaleString('en-IN')}`, 'Revenue less expenses'],
    ['Orders', kpis.orders.toLocaleString('en-IN'), 'Unified orders'],
    ['Units Sold', kpis.units.toLocaleString('en-IN'), 'Order item quantity'],
    ['Average Order Value', `₹${kpis.average_order_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Selected period'],
  ];
  return <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">{cards.map(([label,value,sub]) => <article key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><div className="text-[12px] font-medium text-slate-500">{label}</div><div className="text-xl font-bold text-slate-900 mt-1 tracking-tight">{value}</div><div className="text-[10px] text-slate-400 mt-1">{sub}</div></article>)}</div>;
}
