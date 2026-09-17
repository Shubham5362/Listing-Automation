import React from 'react';
import { Check } from 'lucide-react';
import { MarketplaceHealthItem } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';

interface MarketplaceHealthCardProps {
  marketplaces: MarketplaceHealthItem[];
  onViewAll?: () => void;
}

export default function MarketplaceHealthCard({
  marketplaces,
  onViewAll,
}: MarketplaceHealthCardProps) {
  const items = marketplaces?.length
    ? marketplaces
    : [
        {
          id: 1,
          marketplace: 'Amazon',
          status: 'Healthy',
          listings: 1284,
          last_sync: '2 min ago',
          api_status: 'ok',
          connected: true,
        },
        {
          id: 2,
          marketplace: 'Flipkart',
          status: 'Healthy',
          listings: 892,
          last_sync: '5 min ago',
          api_status: 'ok',
          connected: true,
        },
      ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">
          Marketplace Health
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          View all →
        </button>
      </div>

      {/* Rows */}
      <div className="space-y-3.5 mt-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-2 hover:bg-slate-50 transition-colors"
          >
            {/* Top row: Platform Logo + Name + Status Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center p-1">
                  {item.marketplace.toLowerCase().includes('amazon') ? (
                    <AmazonLogo className="w-4 h-4" />
                  ) : (
                    <FlipkartLogo className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {item.marketplace}
                </span>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/70 text-emerald-700">
                {item.status}
              </span>
            </div>

            {/* Bottom row stats: Listings, Sync, API check */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/50">
              <div>
                Listings{' '}
                <span className="font-bold text-slate-900">
                  {item.listings.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-slate-500">Sync {item.last_sync}</div>
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                <span>API</span>
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
