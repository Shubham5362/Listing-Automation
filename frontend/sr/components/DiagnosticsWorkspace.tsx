import React, { useState, useEffect } from 'react';
import {
  Activity,
  RotateCw,
  Plus,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Link2,
  Database,
  Clock,
  Play,
  Globe,
  Folder,
  Mail,
  MessageSquare,
  MoreHorizontal,
  UploadCloud,
  FileText,
  Headphones,
  BookOpen,
  MessageSquarePlus,
  X,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Server,
  Workflow,
  Cpu,
  ShieldCheck,
  Check,
  ExternalLink,
  Code
} from 'lucide-react';
import { renderMarketplaceLogo } from './MarketplacesWorkspace';

interface DiagnosticsWorkspaceProps {
  onNavigateTab?: (tab: string) => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

interface HealthCheckItem {
  id: string;
  name: string;
  type: 'app' | 'database' | 'marketplace' | 'engine' | 'storage' | 'email' | 'sms';
  marketplace?: string;
  status: 'Healthy' | 'Warning' | 'Error';
  responseTime: string;
  responseTimeMs: number;
  lastChecked: string;
  hasViewAction?: boolean;
}

interface CriticalIssue {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  actionLabel: 'Fix' | 'View';
  component: string;
  details?: string;
}

interface ResolvedIssue {
  id: string;
  title: string;
  resolution: string;
  time: string;
}

interface DiagnosticActivity {
  id: string;
  time: string;
  type: 'System' | 'API' | 'Listings' | 'Inventory' | 'Database';
  details: string;
  status: 'Success' | 'Failed' | 'Issues Found';
}

export default function DiagnosticsWorkspace({
  onNavigateTab,
  selectedMarketplaceFilter,
  onSelectMarketplaceFilter
}: DiagnosticsWorkspaceProps) {
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningFullDiagnostics, setIsRunningFullDiagnostics] = useState(false);
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastScanTimestamp, setLastScanTimestamp] = useState('Dec 15, 2024, 10:24 AM');

  // Modals
  const [selectedIssueModal, setSelectedIssueModal] = useState<CriticalIssue | null>(null);
  const [selectedToolModal, setSelectedToolModal] = useState<{ id: string; title: string; desc: string } | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [toolRunning, setToolRunning] = useState(false);
  const [toolLogs, setToolLogs] = useState<string[]>([]);

  // 1. Health Checks (Matching table in image)
  const [healthChecks, setHealthChecks] = useState<HealthCheckItem[]>([
    {
      id: 'hc-1',
      name: 'Web Application',
      type: 'app',
      status: 'Healthy',
      responseTime: '120ms',
      responseTimeMs: 120,
      lastChecked: '10:24 AM'
    },
    {
      id: 'hc-2',
      name: 'Database',
      type: 'database',
      status: 'Healthy',
      responseTime: '85ms',
      responseTimeMs: 85,
      lastChecked: '10:24 AM'
    },
    {
      id: 'hc-3',
      name: 'Amazon API',
      type: 'marketplace',
      marketplace: 'Amazon',
      status: 'Healthy',
      responseTime: '240ms',
      responseTimeMs: 240,
      lastChecked: '10:23 AM'
    },
    {
      id: 'hc-4',
      name: 'Flipkart API',
      type: 'marketplace',
      marketplace: 'Flipkart',
      status: 'Healthy',
      responseTime: '310ms',
      responseTimeMs: 310,
      lastChecked: '10:23 AM'
    },
    {
      id: 'hc-5',
      name: 'Meesho API',
      type: 'marketplace',
      marketplace: 'Meesho',
      status: 'Warning',
      responseTime: '1,240ms',
      responseTimeMs: 1240,
      lastChecked: '10:22 AM',
      hasViewAction: true
    },
    {
      id: 'hc-6',
      name: 'Myntra API',
      type: 'marketplace',
      marketplace: 'Myntra',
      status: 'Healthy',
      responseTime: '280ms',
      responseTimeMs: 280,
      lastChecked: '10:23 AM'
    },
    {
      id: 'hc-7',
      name: 'Automation Engine',
      type: 'engine',
      status: 'Healthy',
      responseTime: '190ms',
      responseTimeMs: 190,
      lastChecked: '10:24 AM'
    },
    {
      id: 'hc-8',
      name: 'File Storage',
      type: 'storage',
      status: 'Healthy',
      responseTime: '160ms',
      responseTimeMs: 160,
      lastChecked: '10:24 AM'
    },
    {
      id: 'hc-9',
      name: 'Email Service',
      type: 'email',
      status: 'Healthy',
      responseTime: '320ms',
      responseTimeMs: 320,
      lastChecked: '10:23 AM'
    },
    {
      id: 'hc-10',
      name: 'SMS Service',
      type: 'sms',
      status: 'Healthy',
      responseTime: '410ms',
      responseTimeMs: 410,
      lastChecked: '10:23 AM'
    }
  ]);

  // 2. Critical Issues (Matching image)
  const [criticalIssues, setCriticalIssues] = useState<CriticalIssue[]>([
    {
      id: 'issue-1',
      title: 'Meesho API Timeout',
      subtitle: 'API response time > 1s',
      time: 'Today, 09:45 AM',
      actionLabel: 'Fix',
      component: 'Meesho API',
      details: 'Gateway latency spike detected on endpoint /v2/orders/fetch. Request timed out after 1,240ms. Recommended action: switch to fallback replica cluster and apply query batching.'
    },
    {
      id: 'issue-2',
      title: '3 Listings Failed to Publish',
      subtitle: 'Validation error',
      time: 'Today, 08:18 AM',
      actionLabel: 'View',
      component: 'Listings',
      details: 'Flipkart catalog validation error for 3 SKUs (HM-SSB-1000, HM-SSB-750, HM-CT-500). Required attribute "brand_compliance_doc" is missing or malformed.'
    },
    {
      id: 'issue-3',
      title: 'Inventory Sync Failed',
      subtitle: 'Flipkart inventory not updating',
      time: 'Today, 06:32 AM',
      actionLabel: 'Fix',
      component: 'Inventory',
      details: 'HTTP 429 Too Many Requests received from Flipkart Seller Edge API during SKU stock reconciliation. 48 items pending in sync queue.'
    }
  ]);

  // 3. Resolved Issues (Matching image)
  const [resolvedIssues, setResolvedIssues] = useState<ResolvedIssue[]>([
    {
      id: 'res-1',
      title: 'Amazon Order Sync Error',
      resolution: 'Resolved automatically',
      time: 'Today, 07:12 AM'
    },
    {
      id: 'res-2',
      title: 'Price Update Delay',
      resolution: 'Resolved manually',
      time: 'Yesterday, 11:20 PM'
    },
    {
      id: 'res-3',
      title: 'Email Notification Failure',
      resolution: 'Resolved automatically',
      time: 'Yesterday, 06:45 PM'
    }
  ]);

  // 4. Diagnostic Activity (Matching image)
  const [diagnosticActivity, setDiagnosticActivity] = useState<DiagnosticActivity[]>([
    {
      id: 'act-1',
      time: '10:24 AM',
      type: 'System',
      details: 'Full system diagnostic scan',
      status: 'Success'
    },
    {
      id: 'act-2',
      time: '09:45 AM',
      type: 'API',
      details: 'Meesho API connection test',
      status: 'Failed'
    },
    {
      id: 'act-3',
      time: '08:18 AM',
      type: 'Listings',
      details: 'Listing validation check',
      status: 'Issues Found'
    },
    {
      id: 'act-4',
      time: '06:32 AM',
      type: 'Inventory',
      details: 'Inventory sync test',
      status: 'Failed'
    },
    {
      id: 'act-5',
      time: '04:15 AM',
      type: 'Database',
      details: 'Database performance check',
      status: 'Success'
    }
  ]);

  // 5. Issues by Component counts
  const [componentIssues, setComponentIssues] = useState([
    { name: 'APIs', count: 3, max: 5, color: 'bg-rose-500', icon: Link2 },
    { name: 'Automations', count: 2, max: 5, color: 'bg-amber-500', icon: Settings },
    { name: 'Listings', count: 1, max: 5, color: 'bg-amber-500', icon: FileText },
    { name: 'Inventory', count: 0, max: 5, color: 'bg-slate-200', icon: Folder },
    { name: 'Orders', count: 0, max: 5, color: 'bg-slate-200', icon: ShieldCheck },
    { name: 'Database', count: 0, max: 5, color: 'bg-slate-200', icon: Database },
    { name: 'System', count: 1, max: 5, color: 'bg-amber-500', icon: Server }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real Health Check Simulation
  const handleRunHealthCheck = () => {
    setIsRunningHealthCheck(true);
    showToast('Executing real-time ping and health check across all services...');

    setTimeout(() => {
      const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setHealthChecks(prev =>
        prev.map(hc => {
          // Slight jitter around real ms
          const variance = Math.floor(Math.random() * 20) - 10;
          const newMs = Math.max(25, hc.responseTimeMs + variance);
          return {
            ...hc,
            lastChecked: nowTime,
            responseTime: `${newMs.toLocaleString()}ms`,
            responseTimeMs: newMs
          };
        })
      );
      setIsRunningHealthCheck(false);
      showToast('All 10 services checked. Health status updated.');
    }, 1200);
  };

  // Run Full Diagnostics
  const handleRunFullDiagnostics = () => {
    setIsRunningFullDiagnostics(true);
    showToast('Starting comprehensive system diagnostics and deep telemetry scan...');

    setTimeout(() => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const newTimestamp = `${formattedDate}, ${formattedTime}`;
      setLastScanTimestamp(newTimestamp);

      // Append new diagnostic activity
      const newAct: DiagnosticActivity = {
        id: `act-${Date.now()}`,
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: 'System',
        details: 'Full system diagnostic scan completed',
        status: 'Success'
      };
      setDiagnosticActivity(prev => [newAct, ...prev.slice(0, 4)]);
      setIsRunningFullDiagnostics(false);
      showToast('Full diagnostic scan finished: 0 critical infrastructure blockages.');
    }, 1500);
  };

  // Fix Critical Issue Action
  const handleFixIssue = (issue: CriticalIssue) => {
    showToast(`Initiating automated remediation for: ${issue.title}...`);

    setTimeout(() => {
      // Remove from critical issues
      setCriticalIssues(prev => prev.filter(i => i.id !== issue.id));

      // Add to resolved issues
      const newResolved: ResolvedIssue = {
        id: `res-${Date.now()}`,
        title: issue.title,
        resolution: 'Resolved automatically via diagnostics recovery',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setResolvedIssues(prev => [newResolved, ...prev]);

      // Add to activity
      const newAct: DiagnosticActivity = {
        id: `act-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        type: issue.component === 'Meesho API' ? 'API' : 'Inventory',
        details: `${issue.title} remediation completed`,
        status: 'Success'
      };
      setDiagnosticActivity(prev => [newAct, ...prev.slice(0, 4)]);

      // If Meesho API was fixed, update health check to Healthy
      if (issue.component === 'Meesho API') {
        setHealthChecks(prev =>
          prev.map(hc =>
            hc.name === 'Meesho API'
              ? { ...hc, status: 'Healthy', responseTime: '340ms', responseTimeMs: 340, hasViewAction: false }
              : hc
          )
        );
      }

      showToast(`Successfully resolved: ${issue.title}`);
    }, 1100);
  };

  // Launch Diagnostic Tool Modal & Runner
  const handleLaunchTool = (tool: { id: string; title: string; desc: string }) => {
    setSelectedToolModal(tool);
    setToolRunning(true);
    setToolLogs([
      `[INFO] Initializing ${tool.title}...`,
      `[INFO] Connecting to internal telemetry agent...`,
      `[TEST] Probing endpoints and handshake protocols...`
    ]);

    setTimeout(() => {
      setToolLogs(prev => [
        ...prev,
        `[OK] DNS resolution verified (0.8ms)`,
        `[OK] TLS 1.3 socket established with remote endpoints`,
        `[OK] Payload exchange completed with zero dropped packets`,
        `[SUCCESS] Test run completed with status 200 OK.`
      ]);
      setToolRunning(false);
    }, 1400);
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
            1. TOP HEADER (Exact matching reference image)
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Activity className="w-5 h-5 text-blue-600 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Diagnostics
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Identify, troubleshoot, and resolve issues across your seller operations.
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {/* Time Window Dropdown */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                aria-label="Diagnostic time range"
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>All Time</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRunHealthCheck}
              disabled={isRunningHealthCheck}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Run Full Diagnostics Button */}
            <button
              type="button"
              onClick={handleRunFullDiagnostics}
              disabled={isRunningFullDiagnostics}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors active:scale-[0.99] cursor-pointer"
            >
              <Plus className={`w-3.5 h-3.5 ${isRunningFullDiagnostics ? 'animate-spin' : ''}`} />
              <span>Run Full Diagnostics</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. TOP METRIC CARDS (6 Cards in a row, exact match)
        ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: System Status */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">System Status</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">Healthy</div>
            <div className="text-[11px] text-slate-400 font-normal">All systems operational</div>
          </div>

          {/* Card 2: Issues Detected */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Issues Detected</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">
              {criticalIssues.length + 4} Issues
            </div>
            <div className="text-[11px] text-slate-400 font-normal">
              {criticalIssues.length} critical, 4 warning
            </div>
          </div>

          {/* Card 3: Automations */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Automations</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">98.5%</div>
            <div className="text-[11px] text-slate-400 font-normal">Success rate</div>
          </div>

          {/* Card 4: Marketplace APIs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Marketplace APIs</div>
            <div className="text-base sm:text-lg font-bold text-emerald-600">3 Online</div>
            <div className="text-[11px] text-rose-500 font-medium">1 Issue</div>
          </div>

          {/* Card 5: Database */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Database</div>
            <div className="text-base sm:text-lg font-bold text-slate-900">Healthy</div>
            <div className="text-[11px] text-slate-400 font-normal">Response time: 120ms</div>
          </div>

          {/* Card 6: Last Diagnostic Scan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">Last Diagnostic Scan</div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {lastScanTimestamp}
            </div>
            <div className="text-[11px] text-slate-400 font-normal">Completed successfully</div>
          </div>
        </div>

        {/* =========================================================================
            3. MIDDLE SECTION (System Health Checks + Issue Breakdown + Critical Issues)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 3.1. Left: System Health Checks (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">System Health Checks</h3>
                <p className="text-[11px] text-slate-400">Real-time status of all system components.</p>
              </div>

              {/* Run Health Check button */}
              <button
                type="button"
                onClick={handleRunHealthCheck}
                disabled={isRunningHealthCheck}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
                <span>Run Health Check</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="pb-2 font-semibold">Component</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Response Time</th>
                    <th className="pb-2 font-semibold">Last Checked</th>
                    <th className="pb-2 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {healthChecks.map(hc => (
                    <tr key={hc.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Component Icon + Name */}
                      <td className="py-2.5 flex items-center gap-2 font-medium text-slate-800">
                        {hc.type === 'app' && <Globe className="w-4 h-4 text-blue-500 shrink-0" />}
                        {hc.type === 'database' && <Database className="w-4 h-4 text-indigo-500 shrink-0" />}
                        {hc.type === 'marketplace' && hc.marketplace && (
                          <div className="shrink-0">{renderMarketplaceLogo(hc.marketplace, 'w-4 h-4')}</div>
                        )}
                        {hc.type === 'engine' && <Cpu className="w-4 h-4 text-purple-500 shrink-0" />}
                        {hc.type === 'storage' && <Folder className="w-4 h-4 text-amber-500 shrink-0" />}
                        {hc.type === 'email' && <Mail className="w-4 h-4 text-blue-500 shrink-0" />}
                        {hc.type === 'sms' && <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />}
                        <span className="truncate">{hc.name}</span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5">
                        {hc.status === 'Healthy' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● Healthy
                          </span>
                        )}
                        {hc.status === 'Warning' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ● Warning
                          </span>
                        )}
                        {hc.status === 'Error' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ● Error
                          </span>
                        )}
                      </td>

                      {/* Response Time */}
                      <td className={`py-2.5 text-[11px] font-medium ${hc.status === 'Warning' ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                        {hc.responseTime}
                      </td>

                      {/* Last Checked */}
                      <td className="py-2.5 text-[11px] text-slate-400">
                        {hc.lastChecked}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 text-center">
                        {hc.hasViewAction ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIssueModal({
                                id: 'hc-modal',
                                title: `${hc.name} Latency Investigation`,
                                subtitle: `High response time detected: ${hc.responseTime}`,
                                time: hc.lastChecked,
                                actionLabel: 'Fix',
                                component: hc.name,
                                details: 'High latency observed during outbound sync. The remote webhook server is responding slowly. Recommend activating local cache buffer and retrying failed requests.'
                              });
                            }}
                            className="px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Options for ${hc.name}`}
                            onClick={() => showToast(`Detailed telemetry verified for ${hc.name}. Latency: ${hc.responseTime}`)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
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

          {/* 3.2. Middle: Issue Breakdown + Issues by Component (3.5 cols) */}
          <div className="lg:col-span-3.5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
            {/* Section A: Issue Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Issue Breakdown</h3>
                  <p className="text-[11px] text-slate-400">Distribution of detected issues.</p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Displaying full issue audit (7 active issues).')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Donut Chart and Legend */}
              <div className="flex items-center justify-center gap-4 py-1">
                {/* SVG Donut */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />

                    {/* Critical: 3/7 of active (~43% of active loop) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#EF4444"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="102 238.8"
                      strokeDashoffset="0"
                    />

                    {/* Warning: 4/7 of active (~57% of active loop) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray="136 238.8"
                      strokeDashoffset="-102"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-xl font-bold text-slate-900">{criticalIssues.length + 4}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Total Issues</span>
                  </div>
                </div>

                {/* Legend matching image */}
                <div className="space-y-1.5 text-xs w-full">
                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span>Critical</span>
                    </div>
                    <span className="font-bold text-slate-800">{criticalIssues.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span>Warning</span>
                    </div>
                    <span className="font-bold text-slate-800">4</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      <span>Info</span>
                    </div>
                    <span className="font-bold text-slate-800">0</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Resolved</span>
                    </div>
                    <span className="font-bold text-slate-800">12</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Issues by Component */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">Issues by Component</h4>
                <button
                  type="button"
                  onClick={() => showToast('Component issue logs filtered.')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {componentIssues.map(comp => (
                  <div key={comp.name} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 w-24 shrink-0 text-slate-600">
                      <comp.icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{comp.name}</span>
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${comp.color}`}
                        style={{ width: `${(comp.count / comp.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-700 font-semibold w-4 text-right">
                      {comp.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3.3. Right: Critical Issues + Recent Resolved Issues (3.5 cols) */}
          <div className="lg:col-span-3.5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
            {/* Section A: Critical Issues */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Critical Issues</h3>
                <button
                  type="button"
                  onClick={() => showToast('Showing all critical operational issues.')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {criticalIssues.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No active critical issues. All services running normal.
                  </div>
                ) : (
                  criticalIssues.map(issue => (
                    <div key={issue.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {issue.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {issue.subtitle}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {issue.time}
                          </div>
                        </div>
                      </div>

                      {issue.actionLabel === 'Fix' ? (
                        <button
                          type="button"
                          onClick={() => handleFixIssue(issue)}
                          className="px-2.5 py-0.5 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                        >
                          Fix
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedIssueModal(issue)}
                          className="px-2.5 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                        >
                          View
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section B: Recent Resolved Issues */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs">Recent Resolved Issues</h4>
                <button
                  type="button"
                  onClick={() => showToast('Full history of 24 resolved issues displayed.')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {resolvedIssues.map(res => (
                  <div key={res.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 text-[11px] leading-tight">
                        {res.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {res.resolution}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {res.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. BOTTOM SECTION (Diagnostic Tools + Recent Diagnostic Activity + Need Help)
        ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* 4.1. Diagnostic Tools (4.5 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Diagnostic Tools</h3>
              <p className="text-[11px] text-slate-400">Use these tools to troubleshoot specific issues.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Tool 1 */}
              <div
                onClick={() =>
                  handleLaunchTool({
                    id: 'api-test',
                    title: 'API Connection Test',
                    desc: 'Test marketplace API connections and handshake latency across Amazon, Flipkart, Meesho, and Myntra.'
                  })
                }
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 transition-all cursor-pointer space-y-1"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">API Connection Test</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Test marketplace API connections
                </div>
              </div>

              {/* Tool 2 */}
              <div
                onClick={() =>
                  handleLaunchTool({
                    id: 'db-test',
                    title: 'Database Health Check',
                    desc: 'Check database performance, active connection pool, cache hit ratio, and slow query executions.'
                  })
                }
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 transition-all cursor-pointer space-y-1"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Database className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">Database Health Check</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Check database performance
                </div>
              </div>

              {/* Tool 3 */}
              <div
                onClick={() =>
                  handleLaunchTool({
                    id: 'auto-test',
                    title: 'Automation Test',
                    desc: 'Dry-run pricing, inventory synchronization, and catalog publishing automation triggers.'
                  })
                }
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 transition-all cursor-pointer space-y-1"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">Automation Test</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Test automation workflows
                </div>
              </div>

              {/* Tool 4 */}
              <div
                onClick={() =>
                  handleLaunchTool({
                    id: 'upload-test',
                    title: 'File Upload Test',
                    desc: 'Verify cloud image upload buckets, CDN distribution nodes, and image transformations.'
                  })
                }
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 transition-all cursor-pointer space-y-1"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">File Upload Test</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Test media upload functionality
                </div>
              </div>

              {/* Tool 5 */}
              <div
                onClick={() =>
                  handleLaunchTool({
                    id: 'email-test',
                    title: 'Email Service Test',
                    desc: 'Send a synthetic transaction confirmation and test SMTP routing and deliverability.'
                  })
                }
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 transition-all cursor-pointer space-y-1"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">Email Service Test</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Test email notifications
                </div>
              </div>

              {/* Tool 6 */}
              <div
                onClick={() =>
                  handleLaunchTool({
                    id: 'logs-test',
                    title: 'System Logs',
                    desc: 'Inspect real-time system logs, server container events, and operational audits.'
                  })
                }
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70 transition-all cursor-pointer space-y-1"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Code className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-bold text-slate-900">System Logs</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  View detailed system logs
                </div>
              </div>
            </div>
          </div>

          {/* 4.2. Recent Diagnostic Activity (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Recent Diagnostic Activity</h3>
              <button
                type="button"
                onClick={() => showToast('Full diagnostic activity stream loaded (40 records).')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="pb-2 font-semibold">Time</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold">Details</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {diagnosticActivity.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        {act.time}
                      </td>

                      <td className="py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            act.type === 'System'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : act.type === 'API'
                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                              : act.type === 'Listings'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : act.type === 'Inventory'
                              ? 'bg-sky-50 text-sky-700 border border-sky-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          ● {act.type}
                        </span>
                      </td>

                      <td className="py-2.5 text-slate-800 text-[11px] font-medium max-w-[200px] truncate">
                        {act.details}
                      </td>

                      <td className="py-2.5 whitespace-nowrap">
                        {act.status === 'Success' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● Success
                          </span>
                        )}
                        {act.status === 'Failed' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ● Failed
                          </span>
                        )}
                        {act.status === 'Issues Found' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ● Issues Found
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4.3. Need Help? (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Headphones className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Need Help?</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Our support team is here to help you with any technical issues.
              </p>
            </div>

            {/* Buttons matching image */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDocsModalOpen(true)}
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>View Documentation</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 text-slate-500" />
                <span>Contact Support</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTicketModalOpen(true)}
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Support Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODALS & INTERACTION WORKFLOWS
      ========================================================================= */}

      {/* 1. Critical Issue Root-Cause Modal */}
      {selectedIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedIssueModal.title}</h3>
                  <p className="text-xs text-slate-500">{selectedIssueModal.subtitle} · {selectedIssueModal.time}</p>
                </div>
              </div>
              <button onClick={() => setSelectedIssueModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="font-semibold text-slate-900">Root Cause Analysis</div>
              <p className="leading-relaxed">{selectedIssueModal.details}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedIssueModal(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFixIssue(selectedIssueModal);
                  setSelectedIssueModal(null);
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                Apply Safe Auto-Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Diagnostic Tool Interactive Runner Modal */}
      {selectedToolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedToolModal.title}</h3>
                <p className="text-xs text-slate-500">{selectedToolModal.desc}</p>
              </div>
              <button onClick={() => setSelectedToolModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal output box */}
            <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-3 rounded-xl space-y-1 max-h-48 overflow-y-auto">
              {toolLogs.map((log, idx) => (
                <div key={idx} className={log.includes('[SUCCESS]') || log.includes('[OK]') ? 'text-emerald-400' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
              {toolRunning && (
                <div className="text-blue-400 flex items-center gap-1.5 animate-pulse">
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Executing test sequence...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedToolModal(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Contact Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Contact Technical Support</h3>
                  <p className="text-xs text-slate-500">24/7 dedicated marketplace engineering support</p>
                </div>
              </div>
              <button onClick={() => setIsSupportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">Priority Hotline</div>
                <div className="text-slate-600">+91 80 4567 8900 (Toll Free)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Average wait time: &lt; 2 minutes</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">Engineering Email</div>
                <div className="text-slate-600">seller-ops@sellerhub.in</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Includes automatic attachment of system telemetry</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSupportModalOpen(false);
                  showToast('Support request recorded. An engineer will reach out.');
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                Request Call Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Open Support Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Open Support Ticket</h3>
                  <p className="text-xs text-slate-500">File an incident report directly to technical team</p>
                </div>
              </div>
              <button onClick={() => setIsTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Affected Service</label>
                <select className="w-full border border-slate-200 rounded-xl p-2 bg-white text-slate-800 focus:outline-none">
                  <option>Meesho API Timeout</option>
                  <option>Flipkart Inventory Sync</option>
                  <option>Listing Validation</option>
                  <option>Order Processing Pipeline</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Severity Level</label>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-bold text-[11px] cursor-pointer">
                    High (P1)
                  </span>
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-bold text-[11px] cursor-pointer">
                    Medium (P2)
                  </span>
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] cursor-pointer">
                    Low (P3)
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Notes</label>
                <textarea
                  rows={3}
                  defaultValue="Observed intermittent latency spikes during catalog sync."
                  className="w-full border border-slate-200 rounded-xl p-2 bg-white text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTicketModalOpen(false);
                  showToast('Ticket #TKT-89421 created. Telemetry attached.');
                }}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Documentation Modal */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Seller Operations Knowledge Base</h3>
                  <p className="text-xs text-slate-500">Troubleshooting guides and API documentation</p>
                </div>
              </div>
              <button onClick={() => setIsDocsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 cursor-pointer">
                <div className="font-bold text-slate-900">1. Resolving SP-API Rate Limits (Amazon)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Learn how exponential backoff and request pooling prevent 429 errors.</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 cursor-pointer">
                <div className="font-bold text-slate-900">2. Flipkart Mandatory Attribute Guidelines</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Checklist of required catalog attributes for Electronics and Apparel.</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 cursor-pointer">
                <div className="font-bold text-slate-900">3. Setting Up Webhook Resiliency & Failover</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Configure secondary endpoints for Meesho and Myntra sync pipelines.</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDocsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
