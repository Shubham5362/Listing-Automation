import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, List, Boxes, RotateCcw, Tag, Megaphone, BarChart3, WalletCards, Workflow, Sparkles, Bot, Store, Bell, ShieldCheck, Wrench, FileText, Settings, Menu, X } from 'lucide-react';

interface SidebarProps { activeTab: string; onSelectTab: (tab: string) => void; mobileOpen?: boolean; onCloseMobile?: () => void; ordersBadge?: number; notificationsBadge?: number; }

const groups = [
  { label: 'SELL', items: [['Dashboard', LayoutDashboard], ['Orders', ShoppingBag], ['Products', Package], ['Listings', List], ['Inventory', Boxes], ['Returns', RotateCcw]] },
  { label: 'GROW', items: [['Pricing', Tag], ['Advertising', Megaphone], ['Analytics', BarChart3], ['Finance', WalletCards]] },
  { label: 'AUTOMATE', items: [['Automations', Workflow], ['AI Listing Studio', Sparkles], ['AI Seller Copilot', Bot]] },
  { label: 'SYSTEM', items: [['Marketplaces', Store], ['Notifications', Bell], ['Control Center', ShieldCheck], ['Diagnostics', Wrench], ['Reports', FileText], ['Settings', Settings]] },
] as const;

export const AmazonLogo = ({ className = 'w-4 h-4' }: { className?: string }) => <span className={`${className} inline-flex items-center justify-center font-black text-[10px]`}>a</span>;
export const FlipkartLogo = ({ className = 'w-4 h-4' }: { className?: string }) => <span className={`${className} inline-flex items-center justify-center font-black text-[10px]`}>F</span>;

export default function Sidebar({ activeTab, onSelectTab, mobileOpen = false, onCloseMobile, ordersBadge = 0, notificationsBadge = 0 }: SidebarProps) {
  return <>
    {mobileOpen && <button aria-label="Close navigation" onClick={onCloseMobile} className="fixed inset-0 bg-slate-900/20 z-30 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 w-[240px] bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="h-[60px] px-5 border-b border-slate-100 flex items-center justify-between"><button onClick={() => onSelectTab('Dashboard')} className="text-left"><div className="text-[15px] font-extrabold tracking-tight text-slate-900">SellerHub</div><div className="text-[10px] text-slate-400 font-medium">Your AI-Powered Seller OS</div></button><button onClick={onCloseMobile} className="lg:hidden p-1 text-slate-400"><X className="w-4 h-4" /></button></div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map(group => <div key={group.label}><div className="px-2 mb-1.5 text-[10px] font-bold tracking-[0.12em] text-slate-400">{group.label}</div>{group.items.map(([label, Icon]) => <button key={label} onClick={() => onSelectTab(label)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition ${activeTab === label ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="w-4 h-4" /><span className="truncate">{label}</span>{label === 'Orders' && ordersBadge > 0 && <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center">{ordersBadge}</span>}{label === 'Notifications' && notificationsBadge > 0 && <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-rose-100 text-rose-700 text-[10px] flex items-center justify-center">{notificationsBadge}</span>}</button>)}</div>)}
      </nav>
      <div className="p-3 border-t border-slate-100"><div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"><div className="text-[11px] font-bold text-slate-700">Private workspace</div><div className="text-[10px] text-slate-400 mt-0.5">Connected data only</div></div></div>
    </aside>
  </>;
}
