import React from 'react';
import { SalesTrendData } from '../types';
interface Props { salesTrend: SalesTrendData; }
export default function SalesTrendCard({ salesTrend }: Props) {
  const points = salesTrend.timeline || [];
  const max = Math.max(1, ...points.map(p => p.total));
  const w=520,h=170,pad=30;
  const path = points.map((p,i)=>`${pad+(points.length>1?i/(points.length-1)*(w-pad*2):(w/2))},${h-pad-(p.total/max)*(h-pad*2)}`).join(' L ');
  return <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full"><div className="flex items-center justify-between"><h3 className="text-[15px] font-bold">Sales Trend</h3><span className="text-[11px] text-slate-400">Selected period</span></div><div className="mt-2 text-2xl font-bold">₹{salesTrend.total.toLocaleString('en-IN')}</div>{points.length ? <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40 mt-2"><line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#e2e8f0"/><path d={`M ${path}`} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/><g>{points.map((p,i)=><circle key={i} cx={pad+(points.length>1?i/(points.length-1)*(w-pad*2):(w/2))} cy={h-pad-(p.total/max)*(h-pad*2)} r="3" fill="#3b82f6"/>)}</g></svg> : <div className="h-40 flex items-center justify-center text-sm text-slate-400">No trend data for this period.</div>}<div className="flex flex-wrap gap-2 mt-2">{salesTrend.marketplaces.map(m=><span key={m.name} className="text-[11px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">{m.name}: ₹{m.revenue.toLocaleString('en-IN')}</span>)}</div></section>;
}
