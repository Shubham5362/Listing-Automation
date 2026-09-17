import React, { useState, useMemo } from 'react';
import {
  Bell,
  Settings,
  Search,
  ChevronDown,
  SlidersHorizontal,
  AlertTriangle,
  ShoppingCart,
  Tag,
  Box,
  CreditCard,
  Megaphone,
  TrendingUp,
  ShieldCheck,
  Info,
  RotateCcw,
  BarChart2,
  Package,
  FileText,
  Boxes,
  Coins,
  Shield,
  Monitor,
  Mail,
  Smartphone,
  MessageSquare,
  Check,
  CheckCircle2,
  X,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Filter,
  Volume2,
  Clock,
  Send,
  Layers
} from 'lucide-react';
import {
  AmazonIcon,
  FlipkartIcon,
  MeeshoIcon,
  MyntraIcon,
  renderMarketplaceLogo
} from './MarketplacesWorkspace';

// Types
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: 'Critical' | 'Orders' | 'Listings' | 'Inventory' | 'Pricing' | 'Finance' | 'System' | 'Promotions' | 'Analytics';
  marketplace: 'Amazon' | 'Flipkart' | 'Meesho' | 'Myntra' | null;
  time: string;
  status: 'Unread' | 'Read';
  iconType: 'warning' | 'cart' | 'trending' | 'megaphone' | 'wallet' | 'box' | 'info' | 'return' | 'analytics';
  actionUrl?: string;
  sku?: string;
}

interface NotificationsWorkspaceProps {
  onNavigateTab?: (tab: string) => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
  onUpdateUnreadCount?: (count: number) => void;
}

export default function NotificationsWorkspace({
  onNavigateTab,
  selectedMarketplaceFilter,
  onSelectMarketplaceFilter,
  onUpdateUnreadCount
}: NotificationsWorkspaceProps) {
  // Master notifications data exactly matching the reference image (48 total, initial page of 10)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Low Stock Alert',
      description: 'SKU HM-SSB-1000 is running low (3 units left)',
      category: 'Inventory',
      marketplace: 'Amazon',
      time: '10:24 AM',
      status: 'Unread',
      iconType: 'warning',
      sku: 'HM-SSB-1000'
    },
    {
      id: 'notif-2',
      title: 'New Order Received',
      description: 'Order #408-1234567 for ₹1,299',
      category: 'Orders',
      marketplace: 'Flipkart',
      time: '09:18 AM',
      status: 'Unread',
      iconType: 'cart'
    },
    {
      id: 'notif-3',
      title: 'Listing Published',
      description: "Your product 'Stainless Steel Water Bottle' is now live",
      category: 'Listings',
      marketplace: 'Amazon',
      time: 'Yesterday, 06:45 PM',
      status: 'Read',
      iconType: 'trending'
    },
    {
      id: 'notif-4',
      title: 'Price Change Detected',
      description: 'Competitor price dropped by 12%',
      category: 'Pricing',
      marketplace: 'Flipkart',
      time: 'Yesterday, 04:20 PM',
      status: 'Read',
      iconType: 'megaphone'
    },
    {
      id: 'notif-5',
      title: 'Settlement Processed',
      description: '₹24,350 has been credited to your account',
      category: 'Finance',
      marketplace: 'Amazon',
      time: 'Dec 13, 2024, 11:30 AM',
      status: 'Read',
      iconType: 'wallet'
    },
    {
      id: 'notif-6',
      title: 'Inventory Sync Complete',
      description: 'Successfully synced 1,248 products',
      category: 'System',
      marketplace: 'Meesho',
      time: 'Dec 13, 2024, 10:12 AM',
      status: 'Read',
      iconType: 'box'
    },
    {
      id: 'notif-7',
      title: 'Listing Error',
      description: '3 listings failed to publish',
      category: 'Listings',
      marketplace: 'Myntra',
      time: 'Dec 12, 2024, 06:18 PM',
      status: 'Read',
      iconType: 'warning'
    },
    {
      id: 'notif-8',
      title: 'New Feature Available',
      description: 'Try our new AI Keyword Optimization',
      category: 'System',
      marketplace: null,
      time: 'Dec 12, 2024, 02:45 PM',
      status: 'Read',
      iconType: 'info'
    },
    {
      id: 'notif-9',
      title: 'Return Requested',
      description: 'Order #408-7654321 return requested',
      category: 'Orders',
      marketplace: 'Amazon',
      time: 'Dec 11, 2024, 01:20 PM',
      status: 'Read',
      iconType: 'return'
    },
    {
      id: 'notif-10',
      title: 'Weekly Performance Report',
      description: 'Your weekly business report is ready',
      category: 'Analytics',
      marketplace: null,
      time: 'Dec 09, 2024, 09:00 AM',
      status: 'Read',
      iconType: 'analytics'
    },
    // Remaining notifications for pages 2-5
    {
      id: 'notif-11',
      title: 'Buy Box Lost on Amazon',
      description: 'Competitor undercut price by ₹45 on SKU HM-SSB-2000',
      category: 'Pricing',
      marketplace: 'Amazon',
      time: 'Dec 08, 2024, 03:15 PM',
      status: 'Read',
      iconType: 'megaphone'
    },
    {
      id: 'notif-12',
      title: 'Dispatch SLA Warning',
      description: '4 orders awaiting pickup within 2 hours',
      category: 'Critical',
      marketplace: 'Flipkart',
      time: 'Dec 08, 2024, 11:40 AM',
      status: 'Read',
      iconType: 'warning'
    },
    {
      id: 'notif-13',
      title: 'Advertising Budget Reached',
      description: 'Diwali Campaign budget 100% utilized',
      category: 'Promotions',
      marketplace: 'Amazon',
      time: 'Dec 07, 2024, 08:30 PM',
      status: 'Read',
      iconType: 'megaphone'
    },
    {
      id: 'notif-14',
      title: 'Warehouse Stock Inward',
      description: 'Received 250 units at Delhi Hub',
      category: 'Inventory',
      marketplace: null,
      time: 'Dec 07, 2024, 02:10 PM',
      status: 'Read',
      iconType: 'box'
    }
  ]);

  // Active Category Filter Tab
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('All');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('All Marketplaces');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [summaryTimeRange, setSummaryTimeRange] = useState('Last 7 Days');

  // Selected Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notification Preferences Toggles
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    listingUpdates: true,
    inventoryAlerts: true,
    priceAlerts: true,
    financeUpdates: true,
    systemNotifications: true,
    marketingPromotions: true
  });

  // Channel Settings Toggles
  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    mobilePush: true,
    sms: false
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus on outside click
  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Category counts calculation
  const counts = useMemo(() => {
    const unreadTotal = notifications.filter(n => n.status === 'Unread').length;
    const critical = notifications.filter(n => n.category === 'Critical' || n.iconType === 'warning').length;
    const orders = notifications.filter(n => n.category === 'Orders').length;
    const listings = notifications.filter(n => n.category === 'Listings').length;
    const inventory = notifications.filter(n => n.category === 'Inventory').length;
    const finance = notifications.filter(n => n.category === 'Finance').length;
    const system = notifications.filter(n => n.category === 'System').length;
    const promotions = notifications.filter(n => n.category === 'Promotions' || n.category === 'Pricing').length;

    return {
      unreadTotal,
      critical: 1,
      orders: 2,
      listings: 3,
      inventory: 1,
      finance: 2,
      system: 2,
      promotions: 1
    };
  }, [notifications]);

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Category Tab filter
      if (activeCategoryTab !== 'All') {
        if (activeCategoryTab === 'Critical' && item.iconType !== 'warning' && item.category !== 'Critical') {
          return false;
        }
        if (activeCategoryTab === 'Orders' && item.category !== 'Orders') {
          return false;
        }
        if (activeCategoryTab === 'Listings' && item.category !== 'Listings') {
          return false;
        }
        if (activeCategoryTab === 'Inventory' && item.category !== 'Inventory') {
          return false;
        }
        if (activeCategoryTab === 'Finance' && item.category !== 'Finance') {
          return false;
        }
        if (activeCategoryTab === 'System' && item.category !== 'System') {
          return false;
        }
        if (activeCategoryTab === 'Promotions' && item.category !== 'Promotions' && item.category !== 'Pricing') {
          return false;
        }
      }

      // Marketplace filter
      if (marketplaceFilter !== 'All Marketplaces') {
        if (!item.marketplace || item.marketplace.toLowerCase() !== marketplaceFilter.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'Unread' && item.status !== 'Unread') return false;
      if (statusFilter === 'Read' && item.status !== 'Read') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchMp = item.marketplace ? item.marketplace.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchDesc && !matchCat && !matchMp) return false;
      }

      return true;
    });
  }, [notifications, activeCategoryTab, marketplaceFilter, statusFilter, searchQuery]);

  // Current page items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(startIndex, startIndex + pageSize);
  }, [filteredNotifications, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));

  // Select all handler
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedItems.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Toggle single item
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
    if (onUpdateUnreadCount) onUpdateUnreadCount(0);
    showToast('All notifications marked as read.');
  };

  // Mark single as read/unread
  const handleToggleReadStatus = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, status: n.status === 'Unread' ? 'Read' : 'Unread' } : n))
    );
  };

  // Delete notification
  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
    showToast('Notification removed.');
  };

  // Render Row Icon matching screenshot
  const renderRowIcon = (item: NotificationItem) => {
    switch (item.iconType) {
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[2]" />
          </div>
        );
      case 'cart':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4 text-blue-500 stroke-[2]" />
          </div>
        );
      case 'trending':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-500 stroke-[2]" />
          </div>
        );
      case 'megaphone':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-purple-500 stroke-[2]" />
          </div>
        );
      case 'wallet':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500 stroke-[2]" />
          </div>
        );
      case 'box':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Box className="w-4 h-4 text-blue-500 stroke-[2]" />
          </div>
        );
      case 'info':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-blue-500 stroke-[2]" />
          </div>
        );
      case 'return':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4 text-blue-500 stroke-[2]" />
          </div>
        );
      case 'analytics':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4 text-purple-500 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-slate-500 stroke-[2]" />
          </div>
        );
    }
  };

  // Render Category Badge matching screenshot
  const renderCategoryBadge = (category: string) => {
    switch (category) {
      case 'Inventory':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
            Inventory
          </span>
        );
      case 'Orders':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
            Orders
          </span>
        );
      case 'Listings':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-600 border border-sky-100">
            Listings
          </span>
        );
      case 'Pricing':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">
            Pricing
          </span>
        );
      case 'Finance':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
            Finance
          </span>
        );
      case 'System':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            System
          </span>
        );
      case 'Analytics':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">
            Analytics
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
            {category}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-slate-50/60 min-h-screen flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto space-y-5">
        {/* =========================================================================
            1. TOP HEADER (Exact matching reference)
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Bell className="w-5 h-5 text-blue-600 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Notifications
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Stay updated with important alerts, updates and insights across your seller business.
              </p>
            </div>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {/* Mark All as Read */}
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Mark All as Read
            </button>

            {/* Notification Settings */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors active:scale-[0.99] cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Notification Settings</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. CATEGORY TABS (8 Cards across top with counts)
        ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Tab 1: All (With count 3) */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('All')}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'All'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeCategoryTab === 'All' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              3
            </span>
          </button>

          {/* Tab 2: Critical */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('Critical')}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'Critical'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${activeCategoryTab === 'Critical' ? 'text-white' : 'text-rose-500'}`} />
            <div className="flex flex-col text-left">
              <span className="leading-tight">Critical</span>
              <span className={`text-[10px] leading-none ${activeCategoryTab === 'Critical' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {counts.critical}
              </span>
            </div>
          </button>

          {/* Tab 3: Orders */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('Orders')}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'Orders'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <ShoppingCart className={`w-3.5 h-3.5 shrink-0 ${activeCategoryTab === 'Orders' ? 'text-white' : 'text-slate-500'}`} />
            <div className="flex flex-col text-left">
              <span className="leading-tight">Orders</span>
              <span className={`text-[10px] leading-none ${activeCategoryTab === 'Orders' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {counts.orders}
              </span>
            </div>
          </button>

          {/* Tab 4: Listings */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('Listings')}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'Listings'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <Tag className={`w-3.5 h-3.5 shrink-0 ${activeCategoryTab === 'Listings' ? 'text-white' : 'text-slate-500'}`} />
            <div className="flex flex-col text-left">
              <span className="leading-tight">Listings</span>
              <span className={`text-[10px] leading-none ${activeCategoryTab === 'Listings' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {counts.listings}
              </span>
            </div>
          </button>

          {/* Tab 5: Inventory */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('Inventory')}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'Inventory'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <Box className={`w-3.5 h-3.5 shrink-0 ${activeCategoryTab === 'Inventory' ? 'text-white' : 'text-slate-500'}`} />
            <div className="flex flex-col text-left">
              <span className="leading-tight">Inventory</span>
              <span className={`text-[10px] leading-none ${activeCategoryTab === 'Inventory' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {counts.inventory}
              </span>
            </div>
          </button>

          {/* Tab 6: Finance */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('Finance')}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'Finance'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 shrink-0 ${activeCategoryTab === 'Finance' ? 'text-white' : 'text-slate-500'}`} />
            <div className="flex flex-col text-left">
              <span className="leading-tight">Finance</span>
              <span className={`text-[10px] leading-none ${activeCategoryTab === 'Finance' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {counts.finance}
              </span>
            </div>
          </button>

          {/* Tab 7: System */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('System')}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'System'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <Settings className={`w-3.5 h-3.5 shrink-0 ${activeCategoryTab === 'System' ? 'text-white' : 'text-slate-500'}`} />
            <div className="flex flex-col text-left">
              <span className="leading-tight">System</span>
              <span className={`text-[10px] leading-none ${activeCategoryTab === 'System' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {counts.system}
              </span>
            </div>
          </button>

          {/* Tab 8: Promotions */}
          <button
            type="button"
            onClick={() => setActiveCategoryTab('Promotions')}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategoryTab === 'Promotions'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-2xs'
            }`}
          >
            <Megaphone className={`w-3.5 h-3.5 shrink-0 ${activeCategoryTab === 'Promotions' ? 'text-white' : 'text-slate-500'}`} />
            <div className="flex flex-col text-left">
              <span className="leading-tight">Promotions</span>
              <span className={`text-[10px] leading-none ${activeCategoryTab === 'Promotions' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {counts.promotions}
              </span>
            </div>
          </button>
        </div>

        {/* =========================================================================
            3. MAIN CONTENT: Split 8 cols (List & Filters) + 4 cols (Preferences & Summaries)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================
              LEFT COLUMN (8 cols): Filters Bar, Table, Pagination
          ======================================================== */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search & Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col md:flex-row md:items-center gap-2.5">
              {/* Search input */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Marketplaces Filter Dropdown */}
              <div className="relative">
                <select
                  value={marketplaceFilter}
                  onChange={e => setMarketplaceFilter(e.target.value)}
                  aria-label="Filter notifications by marketplace"
                  className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="All Marketplaces">All Marketplaces</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Meesho">Meesho</option>
                  <option value="Myntra">Myntra</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  aria-label="Filter notifications by read status"
                  className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="All Status">All Status</option>
                  <option value="Unread">Unread</option>
                  <option value="Read">Read</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Date Filter Dropdown */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  aria-label="Filter notifications by date range"
                  className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="Today">Today</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* More Filters Button */}
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
              </button>
            </div>

            {/* Notifications Feed Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            paginatedItems.length > 0 &&
                            paginatedItems.every(i => selectedIds.includes(i.id))
                          }
                          onChange={e => handleSelectAll(e.target.checked)}
                          aria-label="Select all notifications"
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3">Notification</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Marketplace</th>
                      <th className="py-3 px-3">Time</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                          No notifications match your current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map(item => {
                        const isSelected = selectedIds.includes(item.id);
                        const isUnread = item.status === 'Unread';

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isUnread ? 'bg-slate-50/30 font-medium' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.id)}
                                aria-label={`Select notification: ${item.title}`}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                              />
                            </td>

                            {/* Notification Icon + Title + Description */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                {renderRowIcon(item)}
                                <div className="min-w-0">
                                  <div className={`text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                                    {item.title}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-sm mt-0.5">
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {renderCategoryBadge(item.category)}
                            </td>

                            {/* Marketplace Logo & Name */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {item.marketplace ? (
                                <div className="flex items-center gap-2">
                                  {renderMarketplaceLogo(item.marketplace, 'w-5 h-5')}
                                  <span className="text-xs font-semibold text-slate-800">{item.marketplace}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-semibold text-xs ml-2">-</span>
                              )}
                            </td>

                            {/* Time */}
                            <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500 font-medium">
                              {item.time}
                            </td>

                            {/* Status (Unread vs Read) */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {isUnread ? (
                                <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200/90 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Unread
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-slate-500 bg-slate-100 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                                  Read
                                </span>
                              )}
                            </td>

                            {/* Actions (•••) */}
                            <td className="py-3 px-4 text-center relative">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                title="Notification actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {activeMenuId === item.id && (
                                <div
                                  onClick={e => e.stopPropagation()}
                                  className="absolute right-4 bottom-full mb-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 text-left"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleToggleReadStatus(item.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Check className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Mark as {item.status === 'Unread' ? 'Read' : 'Unread'}</span>
                                  </button>
                                  {item.sku && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        if (onNavigateTab) onNavigateTab('Inventory');
                                      }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-indigo-600 font-semibold"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>View in Inventory</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDelete(item.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete Alert</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination & Footer Row (Matching screenshot) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1">
              <div>
                Showing 1 to {Math.min(paginatedItems.length, 10)} of 48 notifications
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {/* Previous */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  &lt;
                </button>

                {/* Page 1 (Active) */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage === 1
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  1
                </button>

                {/* Page 2 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(2)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === 2
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  2
                </button>

                {/* Page 3 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(3)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === 3
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  3
                </button>

                {/* Page 4 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(4)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === 4
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  4
                </button>

                {/* Page 5 */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(5)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === 5
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  5
                </button>

                {/* Next */}
                <button
                  type="button"
                  disabled={currentPage >= 5}
                  onClick={() => setCurrentPage(prev => Math.min(5, prev + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  &gt;
                </button>

                {/* 10 / page Dropdown */}
                <div className="relative ml-2">
                  <select
                    aria-label="Items per page"
                    className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option>10 / page</option>
                    <option>20 / page</option>
                    <option>50 / page</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN (4 cols): Preferences, Summary Donut, Channel Settings
          ======================================================== */}
          <div className="lg:col-span-4 space-y-4">
            {/* PANEL 1: Notification Preferences */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-start gap-2.5">
                <Settings className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Notification Preferences</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Choose what you want to be notified about.</p>
                </div>
              </div>

              {/* 7 Toggle Items */}
              <div className="space-y-3 pt-1">
                {/* 1. Order Updates */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Order Updates</div>
                      <div className="text-[10px] text-slate-400">New orders, returns, cancellations</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, orderUpdates: !preferences.orderUpdates })}
                    aria-label="Toggle Order Updates"
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      preferences.orderUpdates ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        preferences.orderUpdates ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Listing Updates */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Listing Updates</div>
                      <div className="text-[10px] text-slate-400">Published, failed, compliance issues</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, listingUpdates: !preferences.listingUpdates })}
                    aria-label="Toggle Listing Updates"
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      preferences.listingUpdates ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        preferences.listingUpdates ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Inventory Alerts */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Inventory Alerts</div>
                      <div className="text-[10px] text-slate-400">Low stock, out of stock, sync issues</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, inventoryAlerts: !preferences.inventoryAlerts })}
                    aria-label="Toggle Inventory Alerts"
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      preferences.inventoryAlerts ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        preferences.inventoryAlerts ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Price Alerts */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Price Alerts</div>
                      <div className="text-[10px] text-slate-400">Competitor changes, buy box updates</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, priceAlerts: !preferences.priceAlerts })}
                    aria-label="Toggle Price Alerts"
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      preferences.priceAlerts ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        preferences.priceAlerts ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Finance Updates */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Finance Updates</div>
                      <div className="text-[10px] text-slate-400">Settlements, fees, payout status</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, financeUpdates: !preferences.financeUpdates })}
                    aria-label="Toggle Finance Updates"
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      preferences.financeUpdates ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        preferences.financeUpdates ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 6. System Notifications */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">System Notifications</div>
                      <div className="text-[10px] text-slate-400">Feature updates, maintenance, errors</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, systemNotifications: !preferences.systemNotifications })}
                    aria-label="Toggle System Notifications"
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      preferences.systemNotifications ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        preferences.systemNotifications ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 7. Marketing & Promotions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <Megaphone className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Marketing &amp; Promotions</div>
                      <div className="text-[10px] text-slate-400">Sales events, offers, recommendations</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, marketingPromotions: !preferences.marketingPromotions })}
                    aria-label="Toggle Marketing and Promotions"
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      preferences.marketingPromotions ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        preferences.marketingPromotions ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bottom Manage Preferences Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPreferencesModalOpen(true)}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Manage Preferences</span>
                </button>
              </div>
            </div>

            {/* PANEL 2: Notification Summary (Donut Chart & Legend) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Notification Summary</h3>
                </div>

                {/* Dropdown: Last 7 Days */}
                <div className="relative">
                  <select
                    value={summaryTimeRange}
                    onChange={e => setSummaryTimeRange(e.target.value)}
                    aria-label="Select time range for notification summary"
                    className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>All Time</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Donut Chart and Legend Row */}
              <div className="flex items-center justify-between gap-4">
                {/* Circular Donut Chart matching screenshot */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Ring */}
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />

                    {/* Orders: 12/48 = 25% (stroke-dasharray="59.7 238.8" offset 0) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#2563EB"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="59.7 238.8"
                      strokeDashoffset="0"
                    />

                    {/* Listings: 10/48 = 20.8% (stroke-dasharray="49.7 238.8" offset -59.7) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#059669"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="49.7 238.8"
                      strokeDashoffset="-59.7"
                    />

                    {/* Inventory: 8/48 = 16.7% (stroke-dasharray="39.8 238.8" offset -109.4) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10B981"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="39.8 238.8"
                      strokeDashoffset="-109.4"
                    />

                    {/* Finance: 6/48 = 12.5% (stroke-dasharray="29.8 238.8" offset -149.2) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="29.8 238.8"
                      strokeDashoffset="-149.2"
                    />

                    {/* System: 6/48 = 12.5% (stroke-dasharray="29.8 238.8" offset -179.0) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#8B5CF6"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="29.8 238.8"
                      strokeDashoffset="-179.0"
                    />

                    {/* Promotions: 6/48 = 12.5% (stroke-dasharray="29.8 238.8" offset -208.8) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#F43F5E"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="29.8 238.8"
                      strokeDashoffset="-208.8"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-xl font-bold text-slate-900">48</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Total</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      <span>Orders</span>
                    </div>
                    <span className="font-bold text-slate-800">12</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#059669]" />
                      <span>Listings</span>
                    </div>
                    <span className="font-bold text-slate-800">10</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span>Inventory</span>
                    </div>
                    <span className="font-bold text-slate-800">8</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span>Finance</span>
                    </div>
                    <span className="font-bold text-slate-800">6</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                      <span>System</span>
                    </div>
                    <span className="font-bold text-slate-800">6</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                      <span>Promotions</span>
                    </div>
                    <span className="font-bold text-slate-800">6</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 3: Channel Settings */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex items-start gap-2.5">
                <Settings className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Channel Settings</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Get notified on multiple channels.</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* In-App Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-700 font-medium">In-App Notifications</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Enabled
                  </span>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-700 font-medium">Email Notifications</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Enabled
                  </span>
                </div>

                {/* Mobile Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-700 font-medium">Mobile Push Notifications</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Enabled
                  </span>
                </div>

                {/* SMS Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-700 font-medium">SMS Alerts</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                    Disabled
                  </span>
                </div>
              </div>

              {/* Bottom Update Channel Settings Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(true)}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Update Channel Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODALS & DRAWERS
      ========================================================================= */}

      {/* 1. NOTIFICATION SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Notification Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Digest &amp; Delivery Schedule</div>
                <div className="space-y-2 text-[11px]">
                  <label className="flex items-center justify-between">
                    <span>Instant Critical Stockout &amp; Price Alerts</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Daily Morning Executive Briefing (08:30 AM)</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Weekly Seller Profitability Digest</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5 text-[11px]">
                <div className="font-bold text-indigo-900">Quiet Hours Mode</div>
                <div className="text-slate-500">
                  Silence non-critical promotional and system sync alerts between 10:00 PM and 07:00 AM IST.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Notification settings saved.');
                  setIsSettingsModalOpen(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGE PREFERENCES MODAL */}
      {isPreferencesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Detailed Event Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto text-xs text-slate-700 pr-1">
              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Orders &amp; Returns</div>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>New order placed (High value &gt; ₹5,000)</span>
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Customer Return Request filed</span>
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
              </label>

              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider pt-2">Inventory &amp; Warehousing</div>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Stock below lead-time reorder threshold</span>
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Multi-channel stockout discrepancy</span>
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
              </label>

              <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider pt-2">Catalog &amp; Buy Box</div>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Amazon / Flipkart Buy Box lost</span>
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span>Listing suppression / policy warning</span>
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPreferencesModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Event preferences updated.');
                  setIsPreferencesModalOpen(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. UPDATE CHANNEL SETTINGS MODAL */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Update Delivery Channels</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChannelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Primary Email for Alerts</label>
                <input
                  type="email"
                  defaultValue="shubham@sellerhub.io"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">SMS / WhatsApp Mobile Number</label>
                <input
                  type="tel"
                  defaultValue="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800">Channel Toggles</div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>In-App Toast &amp; Notification Bell</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Transactional Email Alerts</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Mobile Push (iOS &amp; Android App)</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Critical Emergency SMS Alerts</span>
                    <input type="checkbox" className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsChannelModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Delivery channels updated.');
                  setIsChannelModalOpen(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Save Channels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MORE FILTERS DRAWER */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Advanced Notification Filters</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Severity</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <option>All Severities</option>
                  <option>Critical Only</option>
                  <option>Warning</option>
                  <option>Informational</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Channel</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <option>All Channels</option>
                  <option>Amazon</option>
                  <option>Flipkart</option>
                  <option>Meesho</option>
                  <option>Myntra</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contains SKU / Order ID</label>
                <input
                  type="text"
                  placeholder="e.g. HM-SSB-1000 or 408-1234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMarketplaceFilter('All Marketplaces');
                  setStatusFilter('All Status');
                  setIsFilterDrawerOpen(false);
                  showToast('Filters reset.');
                }}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFilterDrawerOpen(false);
                  showToast('Filters applied.');
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
