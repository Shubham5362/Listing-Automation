import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function AnalyticsTrendChart() {
  const [interval, setInterval] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  return <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
    <div className="flex items-center justify-between gap-3"><h3 className="text-base font-bold text-slate-900">Sales & Orders Trend</h3><button onClick={() => setInterval(p => p === 'Daily' ? 'Weekly' : p === 'Weekly' ? 'Monthly' : 'Daily')} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"><span>{interval}</span><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></button></div>
    <div className="h-56 flex items-center justify-center text-sm text-slate-400">No sales or order data available yet.</div>
  </div>;
}
