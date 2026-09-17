import React from 'react';
import { Search, Menu, Bell, CircleHelp, Sun, ChevronDown } from 'lucide-react';
import { AmazonLogo, FlipkartLogo } from './Sidebar';

interface TopHeaderProps { searchQuery: string; onSearchChange: (v: string) => void; onSearchSubmit?: (v: string) => void; onOpenMobileMenu?: () => void; onToggleAiDrawer?: () => void; selectedMarketplace?: string; onSelectMarketplace?: (m: string) => void; onNavigateTab?: (tab: string) => void; notificationsBadge?: number; }

export default function TopHeader({ searchQuery, onSearchChange, onSearchSubmit, onOpenMobileMenu, onToggleAiDrawer, selectedMarketplace = 'all', onSelectMarketplace, onNavigateTab, notificationsBadge = 0 }: TopHeaderProps) {
  return <header className="h-[60px] shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-20">
    <button onClick={onOpenMobileMenu} className="lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-600"><Menu className="w-5 h-5" /></button>
    <div className="relative flex-1 max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={searchQuery} onChange={e => onSearchChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSearchSubmit?.(searchQuery)} placeholder="Search products, orders, SKUs…" className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-300" /></div>
    <div className="relative"><select value={selectedMarketplace} onChange={e => onSelectMarketplace?.(e.target.value)} className="appearance-none h-9 pl-8 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"><option value="all">All Marketplaces</option><option value="amazon">Amazon India</option><option value="flipkart">Flipkart</option></select><StoreIcon marketplace={selectedMarketplace} /></div>
    <button onClick={() => onToggleAiDrawer?.()} className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold">✦ AI</button>
    <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500"><Bell className="w-4 h-4" />{notificationsBadge > 0 && <span className="absolute" />}</button>
    <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500"><CircleHelp className="w-4 h-4" /></button>
    <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-500"><Sun className="w-4 h-4" /></button>
    <button onClick={() => onNavigateTab?.('Settings')} className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200"><div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">S</div><div className="hidden md:block text-left"><div className="text-xs font-bold text-slate-900">Seller</div><div className="text-[10px] text-slate-500">Account</div></div><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></button>
  </header>;
}
function StoreIcon({ marketplace }: { marketplace: string }) { return <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">{marketplace === 'amazon' ? <AmazonLogo /> : marketplace === 'flipkart' ? <FlipkartLogo /> : '•'}</span>; }
