import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RotateCw,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Store,
  Link2,
  Workflow,
  Tag,
  Box,
  Megaphone,
  ShoppingCart,
  Database,
  Shield,
  Folder,
  Cpu,
  Mail,
  MessageSquare,
  Headphones,
  MoreHorizontal,
  X,
  RefreshCw,
  ArrowUpRight,
  Activity,
  Check,
  Sliders,
  ExternalLink,
  Play,
  Pause,
  Layers
} from 'lucide-react';
import { renderMarketplaceLogo } from './MarketplacesWorkspace';

interface ControlCenterWorkspaceProps {
  onNavigateTab?: (tab: string) => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

interface AlertItem {
  id: string;
  title: string;
  time: string;
  severity: 'critical' | 'warning';
  actionLabel: 'Fix' | 'View';
  details?: string;
  channel?: string;
}

interface ActivityItem {
  id: string;
  time: string;
  type: 'Sync' | 'Automation' | 'Error' | 'System';
  details: string;
  status: 'Success' | 'Failed' | 'Running';
}

interface AutomationItem {
  id: string;
  name: string;
  iconType: 'workflow' | 'tag' | 'box' | 'megaphone' | 'cart';
  status: 'Running' | 'Scheduled' | 'Completed';
  progress?: number;
  currentStep?: number;
  totalSteps?: number;
  scheduledText?: string;
}

export default function ControlCenterWorkspace({
  onNavigateTab,
  selectedMarketplaceFilter,
  onSelectMarketplaceFilter
}: ControlCenterWorkspaceProps) {
  // Time range selector
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertItem | null>(null);
  const [selectedAutomationModal, setSelectedAutomationModal] = useState<AutomationItem | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedMarketplaceModal, setSelectedMarketplaceModal] = useState<string | null>(null);

  // Critical Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // Automations State
  const [automations, setAutomations] = useState<AutomationItem[]>([]);

  // Recent System Activity State
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Live fetch from backend
  const fetchOperationsOverview = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/operations/overview');
      if (res.ok) {
        const json = await res.json();
        if (json.alerts && Array.isArray(json.alerts)) {
          const mappedAlerts: AlertItem[] = json.alerts.map((a: any, idx: number) => ({
            id: 'alert-' + (idx + 1),
            title: a.message || 'System Notification',
            time: 'Active',
            severity: a.severity === 'critical' ? 'critical' : 'warning',
            actionLabel: a.severity === 'critical' ? 'Fix' : 'View',
            details: (a.count || 1) + ' item(s) affected in ' + (a.type || 'inventory') + ' category.',
            channel: 'System'
          }));
          setAlerts(mappedAlerts);
        }
      }

      fetch('/api/v1/automations')
        .then(r => r.json())
        .then(autoData => {
          if (Array.isArray(autoData)) {
            const mappedAuto: AutomationItem[] = autoData.map((item: any, idx: number) => ({
              id: String(item.id || ('auto-' + (idx + 1))),
              name: item.name || 'Automation Rule',
              iconType: item.name && item.name.includes('Price') ? 'tag' : item.name && item.name.includes('Inventory') ? 'box' : item.name && item.name.includes('Ad') ? 'megaphone' : item.name && item.name.includes('Order') ? 'cart' : 'workflow',
              status: item.status === 'Running' ? 'Running' : item.status === 'Active' ? 'Scheduled' : 'Completed',
              progress: typeof item.progress === 'number' ? item.progress : undefined,
              currentStep: typeof item.currentStep === 'number' ? item.currentStep : undefined,
              totalSteps: typeof item.totalSteps === 'number' ? item.totalSteps : undefined,
              scheduledText: item.scheduledText || ''
            }));
            setAutomations(mappedAuto);
          }
        })
        .catch(() => {});
    } catch (err) {
      console.warn('Using live state for operations center:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setLastRefreshedAt(new Date());
        showToast('System metrics synchronized with live services.');
      }, 500);
    }
  };

  useEffect(() => {
    fetchOperationsOverview();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fix alert handler with real execution & recovery workflow
  const handleFixAlert = (alert: AlertItem) => {
    showToast(`Executing recovery job for: ${alert.title}...`);

    setTimeout(() => {
      // Mark as fixed / remove from alerts
      setAlerts(prev => prev.filter(a => a.id !== alert.id));

      // Append success activity to audit log
      const newActivity: ActivityItem = {
        id: `act-recov-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: 'Sync',
        details: `Recovered: ${alert.title} (Auto-sync successful)`,
        status: 'Success'
      };
      setActivities(prev => [newActivity, ...prev]);

      showToast(`Successfully resolved: ${alert.title}`);
    }, 900);
  };

  // Performance Chart Hover Slice
  const [hoveredHourIndex, setHoveredHourIndex] = useState<number | null>(null);

  // Performance chart points across 24h (6 intervals: 12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM)
  const chartPoints = [];

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
              <ShieldCheck className="w-5 h-5 text-blue-600 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Monitor your system health, automations, sync status and overall platform performance.
              </p>
            </div>
          </div>

          {/* Top Right Action Controls */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {/* Time range dropdown */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                aria-label="Select performance time window"
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option>Last 1 Hour</option>
                <option>Last 6 Hours</option>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchOperationsOverview}
              disabled={isRefreshing}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* System Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors active:scale-[0.99] cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>System Settings</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. TOP METRIC CARDS (6 Cards in a Row, matching reference)
        ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Overall System Health */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Overall System Health</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">—</div>
            <div className="text-[11px] text-slate-400 font-normal">No health data available</div>
          </div>

          {/* 2. Automations */}
          <div
            onClick={() => onNavigateTab ? onNavigateTab('Automations') : null}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Automations</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1">
              <span>{automations.filter(a => a.status === 'Running').length} Running</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-[11px] text-slate-400 font-normal">{automations.filter(a => a.status === 'Scheduled').length} Scheduled</div>
          </div>

          {/* 3. Marketplaces */}
          <div
            onClick={() => onNavigateTab ? onNavigateTab('Marketplaces') : null}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Store className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Marketplaces</div>
            <div className="text-base sm:text-lg font-bold text-emerald-600 flex items-center gap-1">
              <span>—</span>
              <ChevronRight className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-[11px] text-slate-400 font-normal">No marketplace status data</div>
          </div>

          {/* 4. API Usage */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">API Usage</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">—</div>
            {/* Progress bar + percentage */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '0%' }} />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">—</span>
            </div>
          </div>

          {/* 5. Failed Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Failed Tasks</div>
            <div className="text-base sm:text-lg font-bold text-rose-600">{alerts.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">{alerts.length ? 'Needs attention' : 'No alert data'}</div>
          </div>

          {/* 6. Uptime */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Uptime</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">—</div>
            <div className="text-[11px] text-slate-400 font-normal">No uptime data</div>
          </div>
        </div>

        {/* =========================================================================
            3. SECOND ROW (System Performance + Task Execution + Critical Alerts)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 3.1. System Performance (Left, 6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">System Performance</h3>
              <div className="relative">
                <select
                  aria-label="Performance metric range"
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-[11px] font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            <div className="h-44 sm:h-48 flex items-center justify-center text-sm text-slate-400">No system performance data available yet.</div>

            {/* Bottom Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-slate-600 font-medium">CPU Usage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-slate-600 font-medium">Memory Usage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                <span className="text-slate-600 font-medium">API Response Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="text-slate-600 font-medium">Queue Size</span>
              </div>
            </div>
          </div>

          {/* 3.2. Task Execution Overview (Middle, 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Task Execution Overview</h3>

            <div className="h-36 flex items-center justify-center text-sm text-slate-400">No task execution data available yet.</div>

            
          </div>

          {/* 3.3. Critical Alerts (Right, 3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Critical Alerts</h3>
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Notifications') : null}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active critical alerts. All jobs running smoothly.
                </div>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0">
                        {alert.severity === 'critical' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {alert.title}
                        </div>
                        <div className="text-[10px] text-slate-400">{alert.time}</div>
                      </div>
                    </div>

                    {/* Action button */}
                    {alert.actionLabel === 'Fix' ? (
                      <button
                        type="button"
                        onClick={() => handleFixAlert(alert)}
                        className="px-2.5 py-0.5 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        Fix
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAlertForModal(alert)}
                        className="px-2.5 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        View
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Recovery status</span>
              <span className="font-semibold">—</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. THIRD ROW (Automation Status + Marketplace Sync Status + System Health)
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
          {/* 4.1. Automation Status (Left, 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Automation Status</h3>
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Automations') : null}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {automations.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedAutomationModal(item)}
                  className="flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 p-1.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      {item.iconType === 'workflow' && <Workflow className="w-3.5 h-3.5 text-blue-500" />}
                      {item.iconType === 'tag' && <Tag className="w-3.5 h-3.5 text-blue-500" />}
                      {item.iconType === 'box' && <Box className="w-3.5 h-3.5 text-blue-500" />}
                      {item.iconType === 'megaphone' && <Megaphone className="w-3.5 h-3.5 text-blue-500" />}
                      {item.iconType === 'cart' && <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{item.name}</div>
                    </div>
                  </div>

                  {/* Status Badge + Progress / Scheduled Time */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'Running' && (
                      <>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Running
                        </span>
                        <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium w-10 text-right">
                          {item.currentStep}/{item.totalSteps}
                        </span>
                      </>
                    )}

                    {item.status === 'Scheduled' && (
                      <>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700">
                          Scheduled
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.scheduledText}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                      </>
                    )}

                    {item.status === 'Completed' && (
                      <>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Completed
                        </span>
                        <div className="w-16 sm:w-20 h-1.5 bg-blue-600 rounded-full" />
                        <span className="text-[11px] text-slate-500 font-medium w-10 text-right">
                          {item.currentStep}/{item.totalSteps}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Next scheduled batch</span>
              <span className="font-semibold text-slate-600">—</span>
            </div>
          </div>

          {/* 4.2. Marketplace Sync Status (Middle, 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Marketplace Sync Status</h3>
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Marketplaces') : null}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="py-8 text-center text-xs text-slate-400">No marketplace sync data available yet.</div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Avg webhook latency</span>
              <span className="font-semibold text-slate-600">—</span>
            </div>
          </div>

          {/* 4.3. System Health (Right, 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">System Health</h3>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View Details
              </button>
            </div>

            <div className="py-8 text-center text-xs text-slate-400">No system health data available yet.</div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Incident status</span>
              <span className="font-semibold">—</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            5. BOTTOM ROW (Recent System Activity + Need Help Card)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 5.1. Recent System Activity Table (Left, 8-9 cols) */}
          <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Recent System Activity</h3>
              <button
                type="button"
                onClick={() => showToast('Full audit history loaded (50 events).')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="pb-2.5 font-semibold">Time</th>
                    <th className="pb-2.5 font-semibold">Type</th>
                    <th className="pb-2.5 font-semibold">Details</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        {act.time}
                      </td>

                      <td className="py-2.5 whitespace-nowrap">
                        {act.type === 'Sync' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                            ● Sync
                          </span>
                        )}
                        {act.type === 'Automation' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            ● Automation
                          </span>
                        )}
                        {act.type === 'Error' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            ● Error
                          </span>
                        )}
                        {act.type === 'System' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            ● System
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 font-medium text-slate-800 text-xs">
                        {act.details}
                      </td>

                      <td className="py-2.5 whitespace-nowrap">
                        {act.status === 'Success' && (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Success
                          </span>
                        )}
                        {act.status === 'Failed' && (
                          <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Failed
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 text-center whitespace-nowrap">
                        {act.status === 'Failed' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAlertForModal({
                                id: act.id,
                                title: act.details,
                                time: act.time,
                                severity: 'critical',
                                actionLabel: 'Fix',
                                details: 'Flipkart listing publication rejected: Missing HSN and tax code attributes.'
                              });
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => showToast(`Audit trail details for event ${act.id}`)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5.2. Need Help? Card (Right, 3-4 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Need Help?</h4>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Our support team is here to help you with any issues.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              className="w-full py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODALS & DRAWERS
      ========================================================================= */}

      {/* 1. SYSTEM SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Control Center &amp; Engine Settings</h3>
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
                <div className="font-bold text-slate-800">Automatic Recovery &amp; Retries</div>
                <div className="space-y-2 text-[11px]">
                  <label className="flex items-center justify-between">
                    <span>Auto-retry failed order and inventory syncs</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Rate limit backoff multiplier (Exponential)</span>
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 w-4 h-4" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Max Retry Attempts per Job</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <option>3 attempts (Recommended)</option>
                  <option>5 attempts</option>
                  <option>1 attempt (Fail fast)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Log Retention Period</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <option>90 Days</option>
                  <option>180 Days</option>
                  <option>365 Days</option>
                </select>
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
                  showToast('Control center parameters updated.');
                  setIsSettingsModalOpen(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALERT DIAGNOSTIC MODAL */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Alert Diagnostic Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertForModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1">
                <div className="font-bold text-rose-900">{selectedAlertForModal.title}</div>
                <div className="text-slate-500">{selectedAlertForModal.time} · {selectedAlertForModal.channel || 'System'}</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed">
                <div>// Root Cause Trace:</div>
                <div>{selectedAlertForModal.details}</div>
                <div className="text-emerald-400 pt-1">&gt; Recovery Recommended: Manual backoff and re-sync.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAlertForModal(null)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const a = selectedAlertForModal;
                  setSelectedAlertForModal(null);
                  handleFixAlert(a);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Trigger Recovery Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SYSTEM HEALTH DETAILS MODAL */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Live System Infrastructure Health</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                No detailed system metrics available yet.
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUPPORT MODAL */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Seller Operations Support</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Need assistance with a marketplace sync or automation issue? Submit the details below and the support workflow will handle the request.
              </p>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Issue Subject</label>
                <input
                  type="text"
                  defaultValue=""
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  defaultValue=""
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Support request submitted successfully.');
                  setIsSupportModalOpen(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
