import React, { useState } from 'react';

interface MarketplaceShare {
  name: string;
  share: number; // percentage
  amount: string;
  color: string;
}

const marketplaceData: MarketplaceShare[] = [
  { name: 'Amazon', share: 54.2, amount: '₹6,76,450', color: '#2563eb' },
  { name: 'Flipkart', share: 32.8, amount: '₹4,09,230', color: '#10b981' },
  { name: 'Myntra', share: 8.4, amount: '₹1,04,620', color: '#ec4899' },
  { name: 'Others', share: 4.6, amount: '₹57,050', color: '#8b5cf6' },
];

export default function AnalyticsMarketplaceDonut() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between h-full">
      <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
        Sales by Marketplace
      </h3>

      <div className="flex items-center justify-between gap-3 my-auto py-2">
        {/* Donut Chart */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {marketplaceData.map((item, index) => {
              const strokeDasharray = `${(item.share / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.share;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={item.name}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {hoveredIndex !== null ? marketplaceData[hoveredIndex].amount : '₹12.48L'}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {hoveredIndex !== null ? marketplaceData[hoveredIndex].name : 'Total Sales'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 text-xs">
          {marketplaceData.map((item, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-1 rounded-md transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 truncate font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-slate-400 font-normal">{item.share}%</span>
                  <span className="font-semibold text-slate-900">{item.amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
