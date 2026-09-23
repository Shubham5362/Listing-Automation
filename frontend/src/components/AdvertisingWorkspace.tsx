import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  Sparkles,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Pause,
  Play,
  Copy,
  Edit2,
  Archive,
  Download,
  Plus,
  Filter,
  Check,
  TrendingUp,
  TrendingDown,
  Layers,
  MousePointer,
  Eye,
  Wallet,
  ShoppingBag,
  Percent,
  Target,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { CampaignRecord } from '../types';
import { AmazonLogo, FlipkartLogo } from './Sidebar';
import ProductCatalogGraphic from './ProductCatalogGraphic';
import AdPerformanceTrendChart from './AdPerformanceTrendChart';
import CampaignDetailsDrawer from './CampaignDetailsDrawer';

interface AdvertisingWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (m: string) => void;
}

const initialCampaigns: CampaignRecord[] = [];

export default function AdvertisingWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter = 'All Marketplaces',
  onSelectMarketplaceFilter,
}: AdvertisingWorkspaceProps) {
  // Campaigns list state
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(initialCampaigns);
  // Active campaign for the right-side drawer (null by default until user clicks a campaign)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);

  // Tab filter: 'All Campaigns' (48) | 'Sponsored Products' (28) | 'Sponsored Brands' (12) | 'Sponsored Display' (8)
  const [activeTab, setActiveTab] = useState<'All Campaigns' | 'Sponsored Products' | 'Sponsored Brands' | 'Sponsored Display'>('All Campaigns');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('All Marketplaces');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('All Campaign Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalCampaignsCount = campaigns.length;

  // Feedback notification
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Sync with real backend advertising API
  React.useEffect(() => {
    const fetchBackendCampaigns = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1/advertising');
        if (res.ok) {
          const json = await res.json();
          const rows = Array.isArray(json) ? json : (json.items || []);
          if (rows.length > 0) {
            const mapped: CampaignRecord[] = rows.map((c: any, idx: number) => {
              const spend = c.spend ?? c.ad_spend ?? 0;
              const sales = c.sales ?? c.sales_ad ?? 0;
              const acos = c.acos ?? 0;
              const roas = c.roas ?? 0;

              return {
                id: c.id || idx + 1,
                campaignName: c.campaign_name || c.name || '',
                productName: c.product_name || '',
                type: (c.campaign_type || c.type || '') as any,
                marketplace: c.marketplace || '',
                status: c.status === 'enabled' ? 'Active' : c.status === 'paused' ? 'Paused' : c.status === 'archived' ? 'Ended' : (c.status || '') as any,
                dailyBudget: c.daily_budget ?? c.dailyBudget ?? 0,
                adSpend: spend,
                salesAd: sales,
                acos,
                roas,
                imageType: c.sku?.includes('TUM') ? 'tumbler' : c.sku?.includes('MUG') ? 'mug' : 'bottle-black',
                startDate: c.created_at ? c.created_at.split(' ')[0] : (c.start_date || ''),
                endDate: c.end_date || '',
                clicks: c.clicks ?? 0,
                clicksGrowth: '',
                impressions: c.impressions ?? 0,
                impressionsGrowth: '',
                ctr: c.ctr ?? 0,
                ctrGrowth: '',
                cpc: c.cpc ?? 0,
                cpcGrowth: '',
                ordersAd: c.orders ?? c.orders_ad ?? 0,
                ordersAdGrowth: '',
                salesAdGrowth: '',
                topKeywords: Array.isArray(c.top_keywords) ? c.top_keywords : [],
              };
            });
            setCampaigns(mapped);
          }
        }
      } catch (err) {
        console.warn('Backend advertising sync notice:', err);
      }
    };
    fetchBackendCampaigns();
  }, []);

  const showAlert = (msg: string) => {
    setBannerAlert(msg);
    setTimeout(() => setBannerAlert(null), 3500);
  };

  // Toggle single selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all visible
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredCampaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCampaigns.map((c) => c.id));
    }
  };

  // Bulk actions
  const handleBulkPause = async () => {
    if (selectedIds.length === 0) {
      showAlert('Select at least one campaign to pause');
      return;
    }
    const ids = [...selectedIds];
    setCampaigns((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, status: 'Paused' } : c))
    );
    showAlert(`Paused ${ids.length} campaign(s)`);
    setSelectedIds([]);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/v1/advertising/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'paused' })
          })
        )
      );
    } catch (e) {
      console.warn(e);
    }
  };

  const handleBulkResume = async () => {
    if (selectedIds.length === 0) {
      showAlert('Select at least one campaign to resume');
      return;
    }
    const ids = [...selectedIds];
    setCampaigns((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, status: 'Active' } : c))
    );
    showAlert(`Resumed ${ids.length} campaign(s)`);
    setSelectedIds([]);
    try {
      await Promise.all(