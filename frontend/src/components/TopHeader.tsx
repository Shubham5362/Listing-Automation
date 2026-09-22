import React, { useEffect, useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Sun,
  ChevronDown,
  Menu,
  Check,
  Settings
} from 'lucide-react';
import { AmazonLogo, FlipkartLogo } from './Sidebar';

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onOpenMobileMenu?: () => void;
  onToggleAiDrawer?: () => void;
  selectedMarketplace?: string;
  onSelectMarketplace?: (m: string) => void;
  onNavigateTab?: (tab: string) => void;
  notificationsBadge?: number;
}

export default function TopHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onOpenMobileMenu,
  onToggleAiDrawer,
  selectedMarketplace = 'all',
  onSelectMarketplace,
  onNavigateTab,
  notificationsBadge = 0,
}: TopHeaderProps) {
  const [marketplaceDropdownOpen, setMarketplaceDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{name?: string; role?: string}>({});

  useEffect(() => {
    fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/auth/me').then((res) => res.ok ? res.json() : null).then((data) => data && setProfile(data)).catch(() => undefined);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-7 flex items-center justify-between gap-4">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything... orders, products, SKUs, reports, ask AI..."
            className="w-full bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg pl-10 pr-16 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
          <div className="absolute right-3 flex items-center">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell */}
        <button
          onClick={() => (onNavigateTab ? onNavigateTab('Notifications') : onToggleAiDrawer?.())}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notificationsBadge > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {notificationsBadge}
            </span>
          )}
        </button>

        {/* Help Circle */}
        <button
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Help & Guides"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Sun */}
        <button
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Light Theme"
        >
          <Sun className="w-4 h-4" />
        </button>

        {/* Marketplace Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMarketplaceDropdownOpen(!marketplaceDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            <div className="flex items-center -space-x-1">
              <AmazonLogo className="w-4 h-4" />
              <FlipkartLogo className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline">
              {selectedMarketplace === 'all'
                ? 'All Marketplaces'
                : selectedMarketplace === 'amazon'
                ? 'Amazon India'
                : 'Flipkart'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {marketplaceDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  onSelectMarketplace?.('all');
                  setMarketplaceDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 font-medium text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1">
                    <AmazonLogo className="w-3.5 h-3.5" />
                    <FlipkartLogo className="w-3.5 h-3.5" />
                  </div>
                  <span>All Marketplaces</span>
                </div>
                {selectedMarketplace === 'all' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
              <button
                onClick={() => {
                  onSelectMarketplace?.('amazon');
                  setMarketplaceDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 font-medium text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <AmazonLogo className="w-3.5 h-3.5" />
                  <span>Amazon India</span>
                </div>
                {selectedMarketplace === 'amazon' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
              <button
                onClick={() => {
                  onSelectMarketplace?.('flipkart');
                  setMarketplaceDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 font-medium text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <FlipkartLogo className="w-3.5 h-3.5" />
                  <span>Flipkart</span>
                </div>
                {selectedMarketplace === 'flipkart' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full ring-1 ring-slate-200 bg-slate-900 flex items-center justify-center text-white text-xs font-bold">{(profile.name || 'S').trim().charAt(0).toUpperCase()}</div>            <div className="hidden md:flex flex-col text-left leading-none">
              <span className="text-xs font-bold text-slate-900">{profile.name || 'Seller'}</span>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">{profile.role || 'Seller'}</span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">{profile.name || 'Seller'}</div>
                <div className="text-[11px] text-slate-500">{profile.role || 'Seller'}</div>
              </div>
              <div className="px-3 py-1.5 text-slate-600 font-medium">Plan: {profile.role || 'Plan not configured'}</div>
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab?.('Settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 font-semibold text-slate-700 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
