import React from 'react';
import { ShoppingBag, Box, Tag, RotateCcw } from 'lucide-react';
import { RecentActivityItem } from '../types';
import { AmazonLogo } from './Sidebar';

interface RecentActivityCardProps {
  activities: RecentActivityItem[];
  onViewAll?: () => void;
}

export default function RecentActivityCard({
  activities,
  onViewAll,
}: RecentActivityCardProps) {
  const getIcon = (type: string, icon: string) => {
    switch (type) {
      case 'order':
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
        );
      case 'inventory':
        return (
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Box className="w-3.5 h-3.5" />
          </div>
        );
      case 'marketplace':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AmazonLogo className="w-3.5 h-3.5" />
          </div>
        );
      case 'pricing':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
        );
      case 'returns':
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-[15px] font-bold text-slate-900">Recent Activity</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          View all →
        </button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-between mt-1">
        {activities?.length > 0 ? (
          activities.map((item) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {getIcon(item.type, item.icon)}
                <span className="font-semibold text-slate-800 truncate">
                  {item.title}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                {item.time}
              </span>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            No recent activity recorded
          </div>
        )}
      </div>
    </div>
  );
}
