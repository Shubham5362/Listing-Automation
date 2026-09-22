import React from 'react';
import {
  Home,
  ShoppingBag,
  Package,
  List,
  Boxes,
  RotateCcw,
  Tag,
  Megaphone,
  BarChart2,
  DollarSign,
  Workflow,
  Sparkles,
  Bot,
  Store,
  Bell,
  Sliders,
  Activity,
  FileText,
  Settings,
  X,
  Clock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  ordersBadge?: number;
  notificationsBadge?: number;
  marketplaceHealth?: Array<{ marketplace?: string; connected?: boolean; last_sync?: string | null }>;
}

export const AmazonLogo = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M14.5 16.5c-3.5 2.2-7.5 1.5-10.2-.2-.4-.3-.1-.7.3-.5 2.8 1.4 6.5 1.7 9.6-.3.4-.3.7.6.3 1z"
      fill="#F97316"
    />
    <path
      d="M15.4 15.2c-.3-.4-1.8-.2-2.7-.1-.3 0-.3-.3 0-.5 1.6-.9 4.1-.7 4.4-.3.3.4-.1 2.9-1.6 3.9-.3.2-.5.1-.4-.2.4-.9.6-2.4.3-2.8z"
      fill="#F97316"
    />
    <path
      d="M12.8 7.3c-.2-.2-.5-.3-.9-.3-1.6 0-2.8 1.4-2.8 3.5 0 2 1.1 3.2 2.6 3.2 1.1 0 1.9-.6 2.3-1.4v1.1h1.7V7.5h-1.7v1.1c-.4-.7-1.2-1.3-2.2-1.3zm.2 4.9c-.8 0-1.4-.7-1.4-1.9 0-1.2.6-1.9 1.4-1.9.8 0 1.4.7 1.4 1.9 0 1.2-.6 1.9-1.4 1.9z"
      fill="#1E293B"
    />
  </svg>
);

export const FlipkartLogo = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#FBBF24" />
    <path
      d="M11 6h4v2.5h-2.5v2H15V13h-2.5v5H10v-5H8.5v-2.5H10V8.5C10 7.1 10.5 6 11 6z"
      fill="#1D4ED8"
    />
  </svg>
);

export default function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
  ordersBadge = 0,
  notificationsBadge = 0,
  marketplaceHealth = [],
}: SidebarProps) {
  const amazon = marketplaceHealth.find((m) => (m.marketplace || '').toLowerCase().includes('amazon'));
  const flipkart = marketplaceHealth.find((m) => (m.marketplace || '').toLowerCase().includes('flipkart'));
  const marketplaceStatus = (m?: { connected?: boolean }) => m?.connected ? 'Connected' : 'Setup Required';
  const navSections = [
    {
      group: 'SELL',
      items: [
        { id: 'Orders', label: 'Orders', icon: ShoppingBag, badge: ordersBadge },
        { id: 'Products', label: 'Products', icon: Package },
        { id: 'Listings', label: 'Listings', icon: List },
        { id: 'Inventory', label: 'Inventory', icon: Boxes },
        { id: 'Returns', label: 'Returns', icon: RotateCcw },
      ],
    },
    {
      group: 'GROW',
      items: [
        { id: 'Pricing', label: 'Pricing', icon: Tag },
        { id: 'Advertising', label: 'Advertising', icon: Megaphone },
        { id: 'Analytics', label: 'Analytics', icon: BarChart2 },
        { id: 'Finance', label: 'Finance', icon: DollarSign },
      ],
    },
    {
      group: 'AUTOMATE',
      items: [
        { id: 'Automations', label: 'Automations', icon: Workflow },
        { id: 'AI Listing Studio', label: 'AI Listing Studio', icon: Sparkles },
        { id: 'AI Seller Copilot', label: 'AI Seller Copilot', icon: Bot },
        { id: 'AI Seller OS', label: 'AI Seller OS', icon: Sparkles },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'Marketplaces', label: 'Marketplaces', icon: Store },
        { id: 'Notifications', label: 'Notifications', icon: Bell, badge: notificationsBadge },
        { id: 'Control Center', label: 'Control Center', icon: Sliders },
        { id: 'Diagnostics', label: 'Diagnostics', icon: Activity },
        { id: 'Reports', label: 'Reports', icon: FileText },
        { id: 'Settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Logo Swirl Icon */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-800">
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 0 1 10 10c0 3.3-1.6 6.3-4.2 8.1l-1.3-1.5A8 8 0 1 0 4 12c0-1.8.6-3.4 1.6-4.8l-1.5-1.3A10 10 0 0 1 12 2z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-[17px] tracking-tight text-slate-900 leading-none">
                SellerHub
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                Your AI-Powered Seller OS
              </div>
            </div>
          </div>

          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
          {/* Main Dashboard item */}
          <div>
            <button
              onClick={() => onSelectTab('Dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'Dashboard' || activeTab === 'Overview'
                  ? 'bg-[#ede9fe]/80 text-[#4f46e5]'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <Home className={`w-4 h-4 ${activeTab === 'Dashboard' || activeTab === 'Overview' ? 'text-[#4f46e5]' : 'text-slate-500'}`} />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Grouped Sections */}
          {navSections.map((section) => (
            <div key={section.group} className="space-y-1">
              <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {section.group}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-[#ede9fe]/80 text-[#4f46e5]'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#4f46e5]' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom System Status Widget */}
        <div className="p-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">System Healthy</span>
            </div>

            <div className="space-y-1.5 pt-0.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AmazonLogo className="w-3.5 h-3.5" />
                  <span className="font-medium text-[12px]">Amazon</span>
                </div>
                <div className={`flex items-center gap-1 font-medium text-[11px] ${amazon?.connected ? "text-emerald-600" : "text-amber-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${amazon?.connected ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {marketplaceStatus(amazon)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FlipkartLogo className="w-3.5 h-3.5" />
                  <span className="font-medium text-[12px]">Flipkart</span>
                </div>
                <div className={`flex items-center gap-1 font-medium text-[11px] ${flipkart?.connected ? "text-emerald-600" : "text-amber-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${flipkart?.connected ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {marketplaceStatus(flipkart)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{amazon?.last_sync ? `Last sync: ${new Date(amazon.last_sync).toLocaleString()}` : 'No marketplace sync yet'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
