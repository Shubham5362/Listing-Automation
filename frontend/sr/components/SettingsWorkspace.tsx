import React, { useState } from 'react';
import {
  Settings,
  User,
  Building2,
  Shield,
  Store,
  Sliders,
  Package,
  FileText,
  Boxes,
  ShoppingCart,
  Truck,
  RotateCcw,
  Tag,
  Megaphone,
  Receipt,
  Sparkles,
  Zap,
  Bell,
  BarChart3,
  Layers,
  Palette,
  Database,
  Cpu,
  CreditCard,
  History,
  AlertTriangle,
  Check,
  Save,
  RotateCcw as ResetIcon,
  ChevronRight,
  ExternalLink,
  Plus,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Key,
} from 'lucide-react';
import { AmazonIcon, FlipkartIcon, MeeshoIcon, MyntraIcon } from './MarketplacesWorkspace';

// Custom Shopify Icon
export const ShopifyIcon = ({ className = 'w-9 h-9' }: { className?: string }) => (
  <div className={`${className} rounded-xl bg-[#95BF47] flex items-center justify-center p-1.5 shadow-2xs shrink-0 overflow-hidden`}>
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <path
        d="M17.5 7.5L15.8 4.2C15.6 3.8 15.2 3.5 14.7 3.5H9.3c-.5 0-.9.3-1.1.7L6.5 7.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 7.5h15l-1.5 13H6L4.5 7.5z"
        fill="#FFFFFF"
        fillOpacity="0.25"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 7.5V6a2 2 0 0 1 4 0v1.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11 11.5c.5-.8 1.5-1 2.2-.6.7.4 1 1.2.6 1.9-.5 1-2.2 1.4-2.2 2.7h2.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

// Toggle Switch Component
const Toggle = ({
  checked,
  onChange,
  disabled = false,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  id?: string;
}) => (
  <button
    type="button"
    id={id}
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
      checked ? 'bg-indigo-600' : 'bg-slate-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

interface SettingsWorkspaceProps {
  onNavigateTab?: (tab: string) => void;
  user?: {
    name: string;
    role: string;
    store: string;
    email: string;
  };
}

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  onNavigateTab,
  user,
}) => {
  // Notification banner state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // 1. Account & Profile
  const [fullName, setFullName] = useState(user?.name || 'Shubham');
  const [email, setEmail] = useState(user?.email || 'shubham@example.com');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('98765 43210');
  const [role, setRole] = useState(user?.role || 'Seller Pro');

  // 2. Business & Legal
  const [businessName, setBusinessName] = useState('Shubham Retail Private Limited');
  const [businessType, setBusinessType] = useState('Private Limited');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');
  const [timezone, setTimezone] = useState('(GMT+05:30) India Standard Time');

  // 3. Security & Privacy
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes');
  const [ipWhitelisting, setIpWhitelisting] = useState(false);
  const [dataSharingConsent, setDataSharingConsent] = useState(true);

  // 4. Marketplace Accounts
  const [marketplaces, setMarketplaces] = useState([
    { id: 'amazon', name: 'Amazon', connected: true },
    { id: 'flipkart', name: 'Flipkart', connected: true },
    { id: 'meesho', name: 'Meesho', connected: true },
    { id: 'myntra', name: 'Myntra', connected: true },
    { id: 'shopify', name: 'Shopify', connected: false },
  ]);

  // 5. Marketplace Configuration
  const [defaultMarketplace, setDefaultMarketplace] = useState('Amazon India');
  const [syncFrequency, setSyncFrequency] = useState('Every 15 minutes');
  const [autoSyncProducts, setAutoSyncProducts] = useState(true);
  const [autoSyncOrders, setAutoSyncOrders] = useState(true);
  const [autoSyncInventory, setAutoSyncInventory] = useState(true);
  const [autoSyncPricing, setAutoSyncPricing] = useState(true);

  // 6. Products & Catalog
  const [defaultHsnCode, setDefaultHsnCode] = useState('');
  const [productSkuFormat, setProductSkuFormat] = useState('SKU-{(YYYY)}-{(###)}');
  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [imageOptimization, setImageOptimization] = useState(true);
  const [duplicateCheck, setDuplicateCheck] = useState(true);

  // 7. Listings
  const [defaultTitleTemplate, setDefaultTitleTemplate] = useState('{Brand} {Product Name}');
  const [defaultDescriptionTemplate, setDefaultDescriptionTemplate] = useState('Standard E-Commerce Description');
  const [aiContentOptimization, setAiContentOptimization] = useState(true);
  const [autoCategorization, setAutoCategorization] = useState(true);
  const [marketplaceSpecificRules, setMarketplaceSpecificRules] = useState(true);

  // 8. Inventory
  const [defaultWarehouse, setDefaultWarehouse] = useState('Main Warehouse');
  const [safetyStock, setSafetyStock] = useState('10');
  const [autoInventorySync, setAutoInventorySync] = useState(true);
  const [stockAllocation, setStockAllocation] = useState(true);
  const [outOfStockNotification, setOutOfStockNotification] = useState(true);

  // 9. Orders
  const [orderSyncFrequency, setOrderSyncFrequency] = useState('Every 5 minutes');
  const [autoAcknowledgeOrders, setAutoAcknowledgeOrders] = useState(true);
  const [autoGenerateLabels, setAutoGenerateLabels] = useState(true);
  const [autoUpdateTracking, setAutoUpdateTracking] = useState(true);
  const [cancellationRules, setCancellationRules] = useState('Standard');
  const [slaAlertHours, setSlaAlertHours] = useState('24');

  // 10. Shipping & Fulfillment
  const [defaultShippingProvider, setDefaultShippingProvider] = useState('Amazon Shipping');
  const [autoGenerateShippingLabel, setAutoGenerateShippingLabel] = useState(true);
  const [autoUpdateShippingTracking, setAutoUpdateShippingTracking] = useState(true);
  const [codOrders, setCodOrders] = useState(true);
  const [labelFormat, setLabelFormat] = useState('PDF');

  // 11. Returns & Refunds
  const [autoApproveReturns, setAutoApproveReturns] = useState(false);
  const [returnReasonMapping, setReturnReasonMapping] = useState(true);
  const [refundNotification, setRefundNotification] = useState(true);
  const [fraudDetection, setFraudDetection] = useState(true);

  // 12. Pricing
  const [minimumMargin, setMinimumMargin] = useState('15');
  const [repricingStrategy, setRepricingStrategy] = useState('Buy Box Match');
  const [repriceOnPriceDrop, setRepriceOnPriceDrop] = useState(true);
  const [floorPriceProtection, setFloorPriceProtection] = useState(true);
  const [autoPriceMatching, setAutoPriceMatching] = useState(true);
  const [priceRulePreset, setPriceRulePreset] = useState('Standard');
  const [maxPriceAlertThreshold, setMaxPriceAlertThreshold] = useState('24');

  // 13. Advertising
  const [adBudgetFrequency, setAdBudgetFrequency] = useState('Daily Budget ₹500');
  const [targetAcos, setTargetAcos] = useState('Target ACOS: 15%');
  const [automatedOptimization, setAutomatedOptimization] = useState(true);
  const [budgetAlert, setBudgetAlert] = useState(true);
  const [keywordHarvesting, setKeywordHarvesting] = useState(true);

  // 14. Finance & Tax
  const [taxCalculationMode, setTaxCalculationMode] = useState('Inclusive (GST)');
  const [tdsDeductionReporting, setTdsDeductionReporting] = useState(true);
  const [autoTcsReconciliation, setAutoTcsReconciliation] = useState(true);
  const [settlementCycle, setSettlementCycle] = useState('T+2 Days');
  const [profitMarginWarning, setProfitMarginWarning] = useState('12%');

  // 15. AI Settings
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState('70%');
  const [allowAutonomousActions, setAllowAutonomousActions] = useState(true);
  const [humanApprovalRequired, setHumanApprovalRequired] = useState(true);
  const [aiLearningFromData, setAiLearningFromData] = useState(true);

  // 16. Automations
  const [dailyExecutionLimit, setDailyExecutionLimit] = useState('1000');
  const [retryOnFailure, setRetryOnFailure] = useState('3');
  const [retryToggle, setRetryToggle] = useState(true);
  const [approvalForCriticalActions, setApprovalForCriticalActions] = useState(true);

  // 17. Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [criticalAlertNotifications, setCriticalAlertNotifications] = useState(true);

  // 18. Reports & Analytics
  const [defaultDateRange, setDefaultDateRange] = useState('Last 30 Days');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [scheduledReports, setScheduledReports] = useState('PDF');
  const [emailDelivery, setEmailDelivery] = useState('Weekly');

  // 19. Integrations & Webhooks
  const [integrations, setIntegrations] = useState([
    { id: 'gdrive', name: 'Google Drive', connected: true },
    { id: 'slack', name: 'Slack', connected: false },
    { id: 'webhooks', name: 'Webhooks', connected: true },
    { id: 'accounting', name: 'Accounting Software', connected: false },
  ]);

  // 20. Appearance & Localization
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'System'>('Light');
  const [language, setLanguage] = useState('English');
  const [dateFormat, setDateFormat] = useState('Dec 15, 2024');
  const [timeFormat, setTimeFormat] = useState('12 Hour (AM/PM)');

  // 21. Data Management
  // Export, Import, Backup status

  // 22. System & Advanced
  const [apiLimits, setApiLimits] = useState('Standard (100 req/min)');
  const [featureFlags, setFeatureFlags] = useState('Stable Production');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // 23. Billing & Subscription
  // Plan: Seller Pro, Next: Jan 15, 2025

  // 24. Audit Trail
  // View action logs

  // 25. Danger Zone
  // Irreversible actions

  const handleSaveChanges = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleResetToDefault = () => {
    setResetSuccess(true);
    setFullName(user?.name || 'Shubham');
    setEmail(user?.email || 'shubham@example.com');
    setPhoneNumber('98765 43210');
    setRole('Seller Pro');
    setBusinessName('Shubham Retail Private Limited');
    setBusinessType('Private Limited');
    setGstNumber('');
    setPanNumber('');
    setBillingAddress('');
    setCurrency('INR (₹)');
    setTimezone('(GMT+05:30) India Standard Time');
    setTwoFactorAuth(true);
    setSessionTimeout('30 Minutes');
    setIpWhitelisting(false);
    setDataSharingConsent(true);
    setDefaultMarketplace('Amazon India');
    setSyncFrequency('Every 15 minutes');
    setAutoSyncProducts(true);
    setAutoSyncOrders(true);
    setAutoSyncInventory(true);
    setAutoSyncPricing(true);
    setDefaultHsnCode('');
    setProductSkuFormat('SKU-{(YYYY)}-{(###)}');
    setAutoGenerateSku(true);
    setImageOptimization(true);
    setDuplicateCheck(true);
    setDefaultTitleTemplate('{Brand} {Product Name}');
    setDefaultDescriptionTemplate('Standard E-Commerce Description');
    setAiContentOptimization(true);
    setAutoCategorization(true);
    setMarketplaceSpecificRules(true);
    setDefaultWarehouse('Main Warehouse');
    setSafetyStock('10');
    setAutoInventorySync(true);
    setStockAllocation(true);
    setOutOfStockNotification(true);
    setOrderSyncFrequency('Every 5 minutes');
    setAutoAcknowledgeOrders(true);
    setAutoGenerateLabels(true);
    setAutoUpdateTracking(true);
    setCancellationRules('Standard');
    setSlaAlertHours('24');
    setDefaultShippingProvider('Amazon Shipping');
    setAutoGenerateShippingLabel(true);
    setAutoUpdateShippingTracking(true);
    setCodOrders(true);
    setLabelFormat('PDF');
    setAutoApproveReturns(false);
    setReturnReasonMapping(true);
    setRefundNotification(true);
    setFraudDetection(true);
    setMinimumMargin('15');
    setRepricingStrategy('Buy Box Match');
    setRepriceOnPriceDrop(true);
    setFloorPriceProtection(true);
    setAutoPriceMatching(true);
    setPriceRulePreset('Standard');
    setMaxPriceAlertThreshold('24');
    setAdBudgetFrequency('Daily Budget ₹500');
    setTargetAcos('Target ACOS: 15%');
    setAutomatedOptimization(true);
    setBudgetAlert(true);
    setKeywordHarvesting(true);
    setTaxCalculationMode('Inclusive (GST)');
    setTdsDeductionReporting(true);
    setAutoTcsReconciliation(true);
    setSettlementCycle('T+2 Days');
    setProfitMarginWarning('12%');
    setAiConfidenceThreshold('70%');
    setAllowAutonomousActions(true);
    setHumanApprovalRequired(true);
    setAiLearningFromData(true);
    setDailyExecutionLimit('1000');
    setRetryOnFailure('3');
    setRetryToggle(true);
    setApprovalForCriticalActions(true);
    setEmailNotifications(true);
    setSmsNotifications(false);
    setCriticalAlertNotifications(true);
    setDefaultDateRange('Last 30 Days');
    setExportFormat('PDF');
    setScheduledReports('PDF');
    setEmailDelivery('Weekly');
    setTheme('Light');
    setLanguage('English');
    setDateFormat('Dec 15, 2024');
    setTimeFormat('12 Hour (AM/PM)');
    setApiLimits('Standard (100 req/min)');
    setFeatureFlags('Stable Production');
    setMaintenanceMode(false);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="flex-1 min-w-0 bg-[#F8FAFC] overflow-y-auto pb-16">
      {/* Save / Reset Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold">Settings saved successfully</p>
            <p className="text-xs text-emerald-100">All configurations are active and synchronized.</p>
          </div>
        </div>
      )}
      {resetSuccess && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-3 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg border border-indigo-500 animate-in fade-in slide-in-from-top-2">
          <ResetIcon className="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold">Reset to default settings</p>
            <p className="text-xs text-indigo-100">All settings have been restored to recommended baselines.</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-6">
        {/* =========================================================================
            HEADER SECTION (Matches Reference Exactly)
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage all your account, business, marketplace, automation and system preferences in one place.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <ResetIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Default</span>
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            ROW 1: Account & Profile (50%) + Business & Legal (50%)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Account & Profile */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Account &amp; Profile</h3>
                  <p className="text-xs text-slate-500">Manage your profile, email, password and security settings.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                {/* Avatar Left Column */}
                <div className="sm:col-span-3 flex flex-col items-center justify-center pt-2">
                  <div className="w-16 h-16 rounded-full bg-[#1E293B] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                    SP
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal('Change Photo')}
                    className="mt-2.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md shadow-2xs"
                  >
                    Change Photo
                  </button>
                </div>

                {/* Profile Fields Right Column */}
                <div className="sm:col-span-9 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg pl-3 pr-20 py-2 focus:outline-hidden focus:border-indigo-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shrink-0">
                        <span className="text-sm">🇮🇳</span>
                        <span>{countryCode}</span>
                      </div>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Seller Pro">Seller Pro</option>
                      <option value="Store Owner">Store Owner</option>
                      <option value="Operations Lead">Operations Lead</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveModal('Password & Security')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Update Password &amp; Security <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Business & Legal */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Business &amp; Legal</h3>
                  <p className="text-xs text-slate-500">Manage your business details and legal information.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Business Type</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="LLP">Limited Liability Partnership</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="Enter GST Number"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">PAN Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="Enter PAN Number"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    placeholder="Enter your business address"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="USD ($)">USD ($)</option>
                      <option value="EUR (€)">EUR (€)</option>
                      <option value="GBP (£)">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="(GMT+05:30) India Standard Time">(GMT+05:30) India Standard Time</option>
                      <option value="(GMT+00:00) UTC">(GMT+00:00) UTC</option>
                      <option value="(GMT-05:00) Eastern Time">(GMT-05:00) Eastern Time</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveModal('Business Details')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Update Business Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 2: Security & Privacy (Full Width or 2-column balanced)
            ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 hover:border-slate-300 transition-colors">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security &amp; Privacy</h3>
              <p className="text-xs text-slate-500">Configure multi-factor authentication, session security and privacy preferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800">Two-Factor Authentication</span>
                  <Toggle checked={twoFactorAuth} onChange={setTwoFactorAuth} />
                </div>
                <p className="text-[11px] text-slate-500">Require an authenticator code when signing in.</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 mt-2">Active on primary device</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Session Inactivity Timeout</label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 mt-1 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="15 Minutes">15 Minutes</option>
                  <option value="30 Minutes">30 Minutes</option>
                  <option value="1 Hour">1 Hour</option>
                  <option value="8 Hours">8 Hours</option>
                </select>
              </div>
              <span className="text-[10px] text-slate-400 mt-2">Auto logout for idle terminals</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800">IP Whitelisting</span>
                  <Toggle checked={ipWhitelisting} onChange={setIpWhitelisting} />
                </div>
                <p className="text-[11px] text-slate-500">Restrict access to registered office and VPN addresses.</p>
              </div>
              <span className="text-[10px] text-slate-500 mt-2">Currently permissive</span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800">Data Sharing &amp; Telemetry</span>
                  <Toggle checked={dataSharingConsent} onChange={setDataSharingConsent} />
                </div>
                <p className="text-[11px] text-slate-500">Allow anonymized performance logs to improve AI sync.</p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 mt-2">GDPR &amp; DPDP Compliant</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 3: Marketplaces & Accounts (50%) + Marketplace Configuration (50%)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Marketplaces & Accounts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Marketplaces &amp; Accounts</h3>
                    <p className="text-xs text-slate-500">Connect and manage your marketplace accounts.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('Marketplaces') : setActiveModal('Add Marketplace')}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md shadow-2xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Marketplace
                </button>
              </div>

              {/* Marketplace Tiles Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {marketplaces.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/90 rounded-xl flex flex-col items-center text-center justify-between shadow-2xs"
                  >
                    <div className="mb-2">
                      {m.id === 'amazon' && <AmazonIcon className="w-8 h-8 mx-auto" />}
                      {m.id === 'flipkart' && <FlipkartIcon className="w-8 h-8 mx-auto" />}
                      {m.id === 'meesho' && <MeeshoIcon className="w-8 h-8 mx-auto" />}
                      {m.id === 'myntra' && <MyntraIcon className="w-8 h-8 mx-auto" />}
                      {m.id === 'shopify' && <ShopifyIcon className="w-8 h-8 mx-auto" />}
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">{m.name}</span>
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            m.connected ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-medium ${
                            m.connected ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {m.connected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab ? onNavigateTab('Marketplaces') : setActiveModal(`Manage ${m.name}`)}
                      className="mt-2.5 w-full py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs"
                    >
                      {m.connected ? 'Manage' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">4 of 5 channels actively synchronizing</span>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('Marketplaces')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Go to Marketplace Hub <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Marketplace Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Marketplace Configuration</h3>
                  <p className="text-xs text-slate-500">Configure marketplace-specific settings and sync preferences.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Default Marketplace</label>
                    <select
                      value={defaultMarketplace}
                      onChange={(e) => setDefaultMarketplace(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Amazon India">Amazon India</option>
                      <option value="Flipkart">Flipkart</option>
                      <option value="Meesho">Meesho</option>
                      <option value="Myntra">Myntra</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Sync Frequency</label>
                    <select
                      value={syncFrequency}
                      onChange={(e) => setSyncFrequency(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Every 5 minutes">Every 5 minutes</option>
                      <option value="Every 15 minutes">Every 15 minutes</option>
                      <option value="Every 30 minutes">Every 30 minutes</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-700">Auto Sync Products</span>
                    <Toggle checked={autoSyncProducts} onChange={setAutoSyncProducts} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-700">Auto Sync Inventory</span>
                    <Toggle checked={autoSyncInventory} onChange={setAutoSyncInventory} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-700">Auto Sync Orders</span>
                    <Toggle checked={autoSyncOrders} onChange={setAutoSyncOrders} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-700">Auto Sync Pricing</span>
                    <Toggle checked={autoSyncPricing} onChange={setAutoSyncPricing} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveModal('Advanced Marketplace Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Advanced Marketplace Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 4: Products & Catalog + Listings + Inventory (3 Columns)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Products & Catalog */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Products &amp; Catalog</h3>
                  <p className="text-xs text-slate-500">Configure product and catalog settings.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Default HSN Code</label>
                  <input
                    type="text"
                    placeholder="Enter HSN Code"
                    value={defaultHsnCode}
                    onChange={(e) => setDefaultHsnCode(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Product SKU Format</label>
                  <input
                    type="text"
                    value={productSkuFormat}
                    onChange={(e) => setProductSkuFormat(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Generate SKU</span>
                    <Toggle checked={autoGenerateSku} onChange={setAutoGenerateSku} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Image Optimization</span>
                    <Toggle checked={imageOptimization} onChange={setImageOptimization} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Duplicate Check</span>
                    <Toggle checked={duplicateCheck} onChange={setDuplicateCheck} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Products') : setActiveModal('Product Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Product Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Listings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Listings</h3>
                  <p className="text-xs text-slate-500">Set listing defaults and SEO rules.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Default Title Template</label>
                  <select
                    value={defaultTitleTemplate}
                    onChange={(e) => setDefaultTitleTemplate(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="{Brand} {Product Name}">{'{Brand} {Product Name}'}</option>
                    <option value="{Brand} {Product Name} - {Color} - {Size}">{'{Brand} {Product Name} - {Color} - {Size}'}</option>
                    <option value="{Product Name} by {Brand}">{'{Product Name} by {Brand}'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Default Description Template</label>
                  <select
                    value={defaultDescriptionTemplate}
                    onChange={(e) => setDefaultDescriptionTemplate(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Standard E-Commerce Description">Standard E-Commerce Description</option>
                    <option value="Bullet Points + Key Specifications">Bullet Points + Key Specifications</option>
                    <option value="AI Optimized SEO Rich Template">AI Optimized SEO Rich Template</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">AI Content Optimization</span>
                    <Toggle checked={aiContentOptimization} onChange={setAiContentOptimization} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Categorization</span>
                    <Toggle checked={autoCategorization} onChange={setAutoCategorization} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Marketplace Specific Rules</span>
                    <Toggle checked={marketplaceSpecificRules} onChange={setMarketplaceSpecificRules} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Listings') : setActiveModal('Listing Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Listing Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Inventory */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inventory</h3>
                  <p className="text-xs text-slate-500">Manage inventory and warehouse settings.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Default Warehouse</label>
                  <select
                    value={defaultWarehouse}
                    onChange={(e) => setDefaultWarehouse(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Main Warehouse">Main Warehouse (Bhiwandi Hub)</option>
                    <option value="North Fulfillment Center">North Fulfillment Center (Delhi NCR)</option>
                    <option value="South Hub">South Hub (Bengaluru)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Safety Stock Buffer</label>
                  <input
                    type="number"
                    value={safetyStock}
                    onChange={(e) => setSafetyStock(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Inventory Sync</span>
                    <Toggle checked={autoInventorySync} onChange={setAutoInventorySync} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Stock Allocation</span>
                    <Toggle checked={stockAllocation} onChange={setStockAllocation} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Out of Stock Notification</span>
                    <Toggle checked={outOfStockNotification} onChange={setOutOfStockNotification} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Inventory') : setActiveModal('Inventory Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Inventory Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 5: Orders + Shipping & Fulfillment + Returns & Refunds (3 Columns)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Orders */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Orders</h3>
                  <p className="text-xs text-slate-500">Configure order processing settings.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Order Sync Frequency</label>
                  <select
                    value={orderSyncFrequency}
                    onChange={(e) => setOrderSyncFrequency(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Every 5 minutes">Every 5 minutes</option>
                    <option value="Every 15 minutes">Every 15 minutes</option>
                    <option value="Instant Webhook">Instant Webhook</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Acknowledge Orders</span>
                    <Toggle checked={autoAcknowledgeOrders} onChange={setAutoAcknowledgeOrders} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Generate Labels</span>
                    <Toggle checked={autoGenerateLabels} onChange={setAutoGenerateLabels} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Update Tracking</span>
                    <Toggle checked={autoUpdateTracking} onChange={setAutoUpdateTracking} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Cancellation Rules</label>
                    <select
                      value={cancellationRules}
                      onChange={(e) => setCancellationRules(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Strict">Strict</option>
                      <option value="Lenient">Lenient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">SLA Alert (Hours)</label>
                    <input
                      type="number"
                      value={slaAlertHours}
                      onChange={(e) => setSlaAlertHours(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Orders') : setActiveModal('Order Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Order Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Shipping & Fulfillment */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Shipping &amp; Fulfillment</h3>
                  <p className="text-xs text-slate-500">Manage shipping and fulfillment settings.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Default Shipping Provider</label>
                  <select
                    value={defaultShippingProvider}
                    onChange={(e) => setDefaultShippingProvider(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Amazon Shipping">Amazon Shipping (Easy Ship)</option>
                    <option value="Delhivery">Delhivery Express</option>
                    <option value="Bluedart">Bluedart Priority</option>
                    <option value="Shadowfax">Shadowfax</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Generate Shipping Label</span>
                    <Toggle checked={autoGenerateShippingLabel} onChange={setAutoGenerateShippingLabel} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Update Tracking</span>
                    <Toggle checked={autoUpdateShippingTracking} onChange={setAutoUpdateShippingTracking} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">COD Orders Enabled</span>
                    <Toggle checked={codOrders} onChange={setCodOrders} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Label Format</label>
                  <select
                    value={labelFormat}
                    onChange={(e) => setLabelFormat(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="PDF">PDF (4 x 6 inches Thermal)</option>
                    <option value="A4">A4 (Standard 4 labels/sheet)</option>
                    <option value="ZPL">ZPL (Direct Zebra Print)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal('Shipping Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Shipping Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Returns & Refunds */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Returns &amp; Refunds</h3>
                  <p className="text-xs text-slate-500">Configure return and refund settings.</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Auto-approve Returns</span>
                    <span className="text-[11px] text-slate-400">Under standard return window</span>
                  </div>
                  <Toggle checked={autoApproveReturns} onChange={setAutoApproveReturns} />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Return Reason Mapping</span>
                    <span className="text-[11px] text-slate-400">Map marketplace codes automatically</span>
                  </div>
                  <Toggle checked={returnReasonMapping} onChange={setReturnReasonMapping} />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Refund Notification</span>
                    <span className="text-[11px] text-slate-400">Alert immediately on debit notes</span>
                  </div>
                  <Toggle checked={refundNotification} onChange={setRefundNotification} />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Fraud &amp; RTO Detection</span>
                    <span className="text-[11px] text-slate-400">Flag suspicious serial returners</span>
                  </div>
                  <Toggle checked={fraudDetection} onChange={setFraudDetection} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Returns') : setActiveModal('Return Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Return Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 6: Pricing + Advertising + Finance & Tax (3 Columns)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Pricing */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pricing</h3>
                  <p className="text-xs text-slate-500">Set pricing rules and limits.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Minimum Margin (%)</label>
                    <input
                      type="number"
                      value={minimumMargin}
                      onChange={(e) => setMinimumMargin(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Reprice Strategy</label>
                    <select
                      value={repricingStrategy}
                      onChange={(e) => setRepricingStrategy(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Buy Box Match">Buy Box Match</option>
                      <option value="Target ROI">Target ROI</option>
                      <option value="Undercut by ₹1">Undercut by ₹1</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Reprice on Drop</span>
                    <Toggle checked={repriceOnPriceDrop} onChange={setRepriceOnPriceDrop} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Floor Price Protection</span>
                    <Toggle checked={floorPriceProtection} onChange={setFloorPriceProtection} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto Price Matching</span>
                    <Toggle checked={autoPriceMatching} onChange={setAutoPriceMatching} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Rule Preset</label>
                    <select
                      value={priceRulePreset}
                      onChange={(e) => setPriceRulePreset(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Aggressive">Aggressive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Alert Threshold (%)</label>
                    <input
                      type="number"
                      value={maxPriceAlertThreshold}
                      onChange={(e) => setMaxPriceAlertThreshold(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Pricing') : setActiveModal('Pricing Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Pricing Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Advertising */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Advertising</h3>
                  <p className="text-xs text-slate-500">Configure ad campaign defaults.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Default Daily Ad Budget</label>
                  <select
                    value={adBudgetFrequency}
                    onChange={(e) => setAdBudgetFrequency(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Daily Budget ₹500">Daily Budget ₹500</option>
                    <option value="Daily Budget ₹1,500">Daily Budget ₹1,500</option>
                    <option value="Daily Budget ₹5,000">Daily Budget ₹5,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Target ACOS / ROAS Target</label>
                  <select
                    value={targetAcos}
                    onChange={(e) => setTargetAcos(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Target ACOS: 15%">Target ACOS: 15% (High Profit)</option>
                    <option value="Target ACOS: 22%">Target ACOS: 22% (Balanced Scale)</option>
                    <option value="Target ACOS: 30%">Target ACOS: 30% (Aggressive Rank)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Automated Bid Optimization</span>
                    <Toggle checked={automatedOptimization} onChange={setAutomatedOptimization} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Budget Depletion Alert</span>
                    <Toggle checked={budgetAlert} onChange={setBudgetAlert} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Keyword Negative Harvesting</span>
                    <Toggle checked={keywordHarvesting} onChange={setKeywordHarvesting} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Advertising') : setActiveModal('Advertising Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Advertising Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Finance & Tax */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Finance &amp; Tax</h3>
                  <p className="text-xs text-slate-500">Configure reconciliation and tax settlement.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tax Calculation Mode</label>
                  <select
                    value={taxCalculationMode}
                    onChange={(e) => setTaxCalculationMode(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Inclusive (GST)">Inclusive of GST (MRP standard)</option>
                    <option value="Exclusive (GST)">Exclusive of GST</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Settlement Cycle</label>
                    <select
                      value={settlementCycle}
                      onChange={(e) => setSettlementCycle(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="T+2 Days">T+2 Days</option>
                      <option value="T+7 Days">T+7 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Min Profit Warning</label>
                    <input
                      type="text"
                      value={profitMarginWarning}
                      onChange={(e) => setProfitMarginWarning(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">TDS 194-O Reporting</span>
                    <Toggle checked={tdsDeductionReporting} onChange={setTdsDeductionReporting} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Auto TCS Reconciliation</span>
                    <Toggle checked={autoTcsReconciliation} onChange={setAutoTcsReconciliation} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Finance') : setActiveModal('Finance Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Finance Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 7: AI Settings + Automation Settings + Notifications (3 Columns)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: AI Settings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Settings</h3>
                  <p className="text-xs text-slate-500">Configure AI behavior and permissions.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-600">AI Confidence Threshold</label>
                    <span className="text-xs font-bold text-indigo-600">{aiConfidenceThreshold}</span>
                  </div>
                  <input
                    type="text"
                    value={aiConfidenceThreshold}
                    onChange={(e) => setAiConfidenceThreshold(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Allow Autonomous Actions</span>
                    <Toggle checked={allowAutonomousActions} onChange={setAllowAutonomousActions} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">Human Approval Required</span>
                    <Toggle checked={humanApprovalRequired} onChange={setHumanApprovalRequired} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">AI Learning from Data</span>
                    <Toggle checked={aiLearningFromData} onChange={setAiLearningFromData} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('AI Seller Copilot') : setActiveModal('AI Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More AI Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Automation Settings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Automations</h3>
                  <p className="text-xs text-slate-500">Configure automation rules and limits.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Daily Execution Limit</label>
                  <input
                    type="number"
                    value={dailyExecutionLimit}
                    onChange={(e) => setDailyExecutionLimit(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Retry on Failure</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={retryOnFailure}
                      onChange={(e) => setRetryOnFailure(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:border-indigo-500"
                    />
                    <Toggle checked={retryToggle} onChange={setRetryToggle} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-slate-700">Approval for Critical Actions</span>
                  <Toggle checked={approvalForCriticalActions} onChange={setApprovalForCriticalActions} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Automations') : setActiveModal('Automation Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Automation Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  <p className="text-xs text-slate-500">Configure alerts and notifications.</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Email Notifications</span>
                    <span className="text-[11px] text-slate-400">Order summaries and SLA alerts</span>
                  </div>
                  <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">SMS Notifications</span>
                    <span className="text-[11px] text-slate-400">Critical security &amp; high value drops</span>
                  </div>
                  <Toggle checked={smsNotifications} onChange={setSmsNotifications} />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Critical Alert Notifications</span>
                    <span className="text-[11px] text-slate-400">Immediate push for channel suspension risk</span>
                  </div>
                  <Toggle checked={criticalAlertNotifications} onChange={setCriticalAlertNotifications} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Notifications') : setActiveModal('Notification Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Notification Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 8: Reports & Analytics + Integrations & Webhooks + Appearance & Localization (3 Columns)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Reports & Analytics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reports &amp; Analytics</h3>
                  <p className="text-xs text-slate-500">Configure report settings and schedules.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Default Date Range</label>
                    <select
                      value={defaultDateRange}
                      onChange={(e) => setDefaultDateRange(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="Last 7 Days">Last 7 Days</option>
                      <option value="Month to Date">Month to Date</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Export Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="PDF">PDF</option>
                      <option value="CSV">CSV</option>
                      <option value="XLSX">XLSX</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Scheduled Reports</label>
                    <select
                      value={scheduledReports}
                      onChange={(e) => setScheduledReports(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="PDF">PDF</option>
                      <option value="CSV">CSV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Email Delivery</label>
                    <select
                      value={emailDelivery}
                      onChange={(e) => setEmailDelivery(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Daily">Daily</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Reports') : setActiveModal('Report Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Report Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Integrations & Webhooks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Integrations &amp; Webhooks</h3>
                  <p className="text-xs text-slate-500">Manage third-party integrations.</p>
                </div>
              </div>

              <div className="space-y-2">
                {integrations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.connected ? '#10B981' : '#94A3B8' }} />
                      <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium ${item.connected ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {item.connected ? 'Connected' : 'Not Connected'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveModal(`Configure ${item.name}`)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded shadow-2xs"
                      >
                        {item.connected ? 'Manage' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal('More Integrations')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Integrations <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Appearance & Localization */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Appearance &amp; Localization</h3>
                  <p className="text-xs text-slate-500">Customize your interface and region settings.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Light', 'Dark', 'System'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                          theme === t
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${theme === t ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Date Format</label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Dec 15, 2024">Dec 15, 2024</option>
                      <option value="15/12/2024">15/12/2024</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Time Format</label>
                    <select
                      value={timeFormat}
                      onChange={(e) => setTimeFormat(e.target.value)}
                      className="w-full text-xs font-normal text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="12 Hour (AM/PM)">12 Hour (AM/PM)</option>
                      <option value="24 Hour">24 Hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal('Appearance Settings')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Appearance Settings <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 9: Data Management + System & Advanced + Billing & Subscription + Audit Trail + Danger Zone (Responsive 5 cards)
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {/* Card: Data Management */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Data Management</h3>
                  <p className="text-[11px] text-slate-500">Import, export and manage your data.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal('Export Data')}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-center shadow-2xs group"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600 mb-1" />
                    <span className="text-[11px] font-bold text-slate-800 block">Export Data</span>
                    <span className="text-[9px] text-slate-400">Download reports</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('Import Data')}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-center shadow-2xs group"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600 mb-1" />
                    <span className="text-[11px] font-bold text-slate-800 block">Import Data</span>
                    <span className="text-[9px] text-slate-400">Upload CSV file</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModal('Backup & Restore')}
                  className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-2 text-center shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-800 block">Backup &amp; Restore</span>
                    <span className="text-[9px] text-slate-400">Manage backups</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal('Data Settings')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Data Settings <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card: System & Advanced */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">System &amp; Advanced</h3>
                  <p className="text-[11px] text-slate-500">System controls and advanced settings.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">API Limits</span>
                  <select
                    value={apiLimits}
                    onChange={(e) => setApiLimits(e.target.value)}
                    className="text-[11px] font-normal text-slate-800 bg-white border border-slate-200 rounded px-2 py-1"
                  >
                    <option value="Standard (100 req/min)">Manage limits</option>
                    <option value="Burst (500 req/min)">500 req/min</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Feature Flags</span>
                  <select
                    value={featureFlags}
                    onChange={(e) => setFeatureFlags(e.target.value)}
                    className="text-[11px] font-normal text-slate-800 bg-white border border-slate-200 rounded px-2 py-1"
                  >
                    <option value="Stable Production">Manage flags</option>
                    <option value="Beta Channel">Beta Channel</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Cache Management</span>
                  <button
                    type="button"
                    onClick={() => setActiveModal('Clear Cache')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded shadow-2xs"
                  >
                    Clear cache
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] font-medium text-slate-600">Maintenance Mode</span>
                  <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('Diagnostics') : setActiveModal('System Settings')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More System Settings <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card: Billing & Subscription */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Billing &amp; Subscription</h3>
                  <p className="text-[11px] text-slate-500">Manage your plan and billing.</p>
                </div>
              </div>

              <div className="space-y-2 p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Current Plan</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-full">Seller Pro</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Next Billing Date</span>
                  <span className="text-[11px] font-semibold text-slate-800">Jan 15, 2025</span>
                </div>
              </div>

              <div className="space-y-1.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal('Manage Subscription')}
                  className="w-full py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Manage Subscription
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('View Invoices')}
                  className="w-full py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs"
                >
                  View Invoices
                </button>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal('Billing Settings')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Billing Settings <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card: Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <History className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Audit Trail</h3>
                  <p className="text-[11px] text-slate-500">View system and user activity logs.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {[
                  { name: 'User Actions', key: 'user' },
                  { name: 'AI Actions', key: 'ai' },
                  { name: 'Automation Actions', key: 'automation' },
                  { name: 'Marketplace Actions', key: 'marketplace' },
                  { name: 'Configuration Changes', key: 'config' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-slate-700">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(`Audit Logs: ${item.name}`)}
                      className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded shadow-2xs"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveModal('Audit Logs')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                More Audit Logs <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card: Danger Zone */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-2xs p-4 flex flex-col justify-between hover:border-rose-300 transition-colors">
            <div>
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-rose-700">Danger Zone</h3>
                  <p className="text-[11px] text-rose-500 font-medium">Irreversible actions.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setActiveModal('Deactivate Account')}
                  className="w-full py-1 px-2 text-[11px] font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                >
                  Deactivate Account
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('Disconnect All Marketplaces')}
                  className="w-full py-1 px-2 text-[11px] font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                >
                  Disconnect All Marketplaces
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('Delete All Data')}
                  className="w-full py-1 px-2 text-[11px] font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                >
                  Delete All Data
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('Delete Account')}
                  className="w-full py-1 px-2 text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-md transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-rose-100">
              <span className="text-[10px] text-rose-600 font-medium block text-center">
                Action requires owner OTP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Configuration Details / Actions */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                {activeModal}
              </h4>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Configuration interface for <strong>{activeModal}</strong> is active. You can review detailed logs, update credentials, or download exported packages directly.
            </p>

            {activeModal.includes('Delete') || activeModal.includes('Deactivate') || activeModal.includes('Disconnect') ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Warning: Destructive Operation
                </p>
                <p className="text-[11px]">
                  This action will permanently invalidate linked marketplace tokens and clear cached business states.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
                <p className="font-semibold">Live System Parameter</p>
                <p className="text-[11px] text-indigo-600">Changes will be broadcast across all active workers immediately.</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  handleSaveChanges();
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-2xs ${
                  activeModal.includes('Delete') || activeModal.includes('Deactivate')
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsWorkspace;
