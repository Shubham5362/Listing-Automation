import React from 'react';
import { TrendingUp, ShoppingBag, PlusCircle, ChevronDown } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartsRowProps {
  salesRange?: string;
  onSalesRangeChange?: (range: string) => void;
}

export default function ChartsRow({
  salesRange = 'Last 30 days',
  onSalesRangeChange,
}: ChartsRowProps) {
  // Sales Trend Data matching screenshot
  const salesData = [
    { date: '16 Aug', amazon: 26000, flipkart: 18000 },
    { date: '23 Aug', amazon: 37000, flipkart: 23000 },
    { date: '30 Aug', amazon: 28000, flipkart: 19000 },
    { date: '6 Sep', amazon: 31000, flipkart: 21000 },
    { date: '13 Sep', amazon: 38000, flipkart: 25000 },
  ];

  // Orders by Marketplace donut data
  const ordersData = [
    { name: 'Amazon', value: 212, percentage: 62, color: '#f59e0b' },
    { name: 'Flipkart', value: 130, percentage: 38, color: '#2563eb' },
  ];

  // Inventory Health donut data
  const inventoryData = [
    { name: 'In Stock', value: 176, percentage: 71, color: '#10b981' },
    { name: 'Low Stock', value: 18, percentage: 7, color: '#f59e0b' },
    { name: 'Out of Stock', value: 12, percentage: 5, color: '#ef4444' },
    { name: 'Inactive', value: 42, percentage: 17, color: '#94a3b8' },
  ];

  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return '₹0';
    return `₹${tickItem / 1000}K`;
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      {/* 1. Sales Trend Card (5 cols on lg) */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Sales Trend</h3>
            </div>
            <div className="relative">
              <button className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/50">
                <span>{salesRange}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Sub legend */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span>Amazon</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
              <span>Flipkart</span>
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="h-44 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmazon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFlipkart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                domain={[0, 60000]}
                ticks={[0, 20000, 40000, 60000]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                contentStyle={{
                  borderRadius: '12px',
                  fontSize: '11px',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
              <Area
                type="monotone"
                dataKey="amazon"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAmazon)"
              />
              <Area
                type="monotone"
                dataKey="flipkart"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorFlipkart)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Orders by Marketplace Card (3.5 cols on lg) */}
      <div className="lg:col-span-3.5 bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Orders by Marketplace</h3>
        </div>

        <div className="flex items-center justify-between gap-2 h-44">
          {/* Donut Chart with Center Text */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ordersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-900 leading-tight">342</span>
              <span className="text-[10px] text-slate-400 font-medium">Orders</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5 text-xs flex-1 pl-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                <span className="text-slate-700 font-medium">Amazon</span>
              </div>
              <span className="font-semibold text-slate-900">62%</span>
              <span className="text-slate-500 text-[11px]">212</span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                <span className="text-slate-700 font-medium">Flipkart</span>
              </div>
              <span className="font-semibold text-slate-900">38%</span>
              <span className="text-slate-500 text-[11px]">130</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Inventory Health Card (3.5 cols on lg) */}
      <div className="lg:col-span-3.5 bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Inventory Health</h3>
        </div>

        <div className="flex items-center justify-between gap-2 h-44">
          {/* Donut Chart with Center Text */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-900 leading-tight">248</span>
              <span className="text-[10px] text-slate-400 font-medium">Total SKUs</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs flex-1 pl-1">
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-700 font-medium">In Stock</span>
              </div>
              <span className="text-slate-600 font-medium">176 (71%)</span>
            </div>

            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-700 font-medium">Low Stock</span>
              </div>
              <span className="text-slate-600 font-medium">18 (7%)</span>
            </div>

            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-700 font-medium">Out of Stock</span>
              </div>
              <span className="text-slate-600 font-medium">12 (5%)</span>
            </div>

            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span className="text-slate-700 font-medium">Inactive</span>
              </div>
              <span className="text-slate-600 font-medium">42 (17%)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
