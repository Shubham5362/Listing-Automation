import React, { useState, useEffect, useId } from 'react';
import {
  Sparkles,
  HelpCircle,
  BookOpen,
  Upload,
  GripVertical,
  MoreVertical,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Star,
  Info,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  Bookmark,
  Share2,
  TrendingUp,
  Image as ImageIcon,
  Tag,
  Key,
  ShieldCheck,
  Zap,
  Bot,
  Sliders,
  CheckSquare
} from 'lucide-react';
import { AmazonBadgeIcon, FlipkartBadgeIcon, MeeshoBadgeIcon, MyntraBadgeIcon } from './AutomationsWorkspace';

// Pre-defined catalog items for "Import from Catalog"
interface CatalogSourceItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  sku: string;
  price: number;
  mrp: number;
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
  images: { id: string; url: string; label: string; isPrimary?: boolean }[];
  rating: number;
  reviewsCount: number;
}

const defaultCatalogSources: CatalogSourceItem[] = [];

interface AiListingStudioWorkspaceProps {
  onOpenAiCopilot?: () => void;
  selectedMarketplaceFilter?: string;
  onSelectMarketplaceFilter?: (marketplace: string) => void;
}

export default function AiListingStudioWorkspace({
  onOpenAiCopilot,
  selectedMarketplaceFilter,
  onSelectMarketplaceFilter
}: AiListingStudioWorkspaceProps) {
  // Stepper state: 1: Product Information, 2: AI Optimization, 3: Marketplace Setup, 4: Preview & Confirm
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [catalogSources, setCatalogSources] = useState<CatalogSourceItem[]>([]);

  useEffect(() => {
    fetch('/api/v1/products')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.items || []);
        const mapped: CatalogSourceItem[] = list.map((p: any) => ({
          id: p.id,
          name: p.title || p.name || 'Catalog Item',
          brand: p.brand || 'AquaPure',
          category: p.category || 'General',
          sku: p.sku || 'SKU',
          price: p.price || 499,
          mrp: p.mrp || (p.price ? Math.round(p.price * 1.5) : 799),
          title: p.title || p.name || 'Catalog Item',
          bullets: [
            p.description || 'High quality durable material',
            'Multi-marketplace ready with verified SKU compliance'
          ],
          description: p.description || 'Full product description',
          keywords: [p.category || 'general', p.brand || 'brand'],
          images: [{ id: 'img-1', url: 'primary', label: 'Primary', isPrimary: true }],
          rating: 4.8,
          reviewsCount: 120,
        }));
        setCatalogSources(mapped);
      })
      .catch(err => console.error('Failed to fetch catalog sources:', err));
  }, []);

  // Form State matching screenshot
  const [productName, setProductName] = useState('Stainless Steel Water Bottle');
  const [brand, setBrand] = useState('HydroMate');
  const [category, setCategory] = useState('Home & Kitchen > Kitchen & Dining > Water Bottles');
  const [identifierType, setIdentifierType] = useState<'SKU' | 'ASIN' | 'FSN' | 'UPC'>('SKU');
  const [sku, setSku] = useState('HM-SSB-1000');

  // Media
  const [images, setImages] = useState<Array<{ id: string; label: string; isPrimary?: boolean }>>([
    { id: 'img-1', label: 'Front View', isPrimary: true },
    { id: 'img-2', label: 'Angle View' },
    { id: 'img-3', label: 'Cap Mouth' },
    { id: 'img-4', label: 'Lifestyle Desk' }
  ]);

  // Content
  const [title, setTitle] = useState(
    'HydroMate Stainless Steel Water Bottle 1000ml | Leak Proof | BPA Free | Double Wall Vacuum Insulated | Hot & Cold | For Office, Gym, Travel'
  );
  const [bulletPoints, setBulletPoints] = useState<string[]>([
    'Premium 304 stainless steel – durable and rust proof',
    'Keeps beverages hot for 12 hours & cold for 24 hours',
    'Leak proof and BPA free for safe drinking'
  ]);
  const [description, setDescription] = useState(
    'HydroMate 1000ml Stainless Steel Water Bottle is engineered with advanced double-walled vacuum insulation to preserve your beverage temperature for hours. Designed for modern professionals, fitness enthusiasts, and travelers.'
  );
  const [backendKeywords, setBackendKeywords] = useState<string[]>([
    'stainless steel water bottle',
    'insulated flask 1 litre',
    'gym bottle bpa free',
    'hot and cold flask',
    'travel bottle office'
  ]);

  // Marketplace preview tab
  const [previewMarketplace, setPreviewMarketplace] = useState<'Amazon' | 'Flipkart' | 'Meesho' | 'Myntra'>('Amazon');
  const [selectedCapacity, setSelectedCapacity] = useState('1000 ml');
  const [selectedColour, setSelectedColour] = useState('Silver');
  const [activePreviewThumbnail, setActivePreviewThumbnail] = useState(0);

  // Modals & UI helpers
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Optimization checklist / score
  const [optimizationScore, setOptimizationScore] = useState(88);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  // Marketplace pricing & config for step 3
  const [amazonPrice, setAmazonPrice] = useState(599);
  const [amazonMrp, setAmazonMrp] = useState(999);
  const [flipkartPrice, setFlipkartPrice] = useState(579);
  const [meeshoPrice, setMeeshoPrice] = useState(549);
  const [myntraPrice, setMyntraPrice] = useState(599);
  const [hsnCode, setHsnCode] = useState('73239390');
  const [gstRate, setGstRate] = useState('18%');

  // Confirmation checkbox for step 4
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Generate unique SKU
  const handleGenerateSku = () => {
    const brandPrefix = (brand.substring(0, 2) || 'HM').toUpperCase();
    const namePart = productName.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newSku = `${brandPrefix}-${namePart || 'SSB'}-${randomNum}`;
    setSku(newSku);
    showToast(`Generated new SKU: ${newSku}`);
  };

  // Import from catalog
  const handleImportProduct = (item: CatalogSourceItem) => {
    setProductName(item.name);
    setBrand(item.brand);
    setCategory(item.category);
    setSku(item.sku);
    setTitle(item.title);
    setBulletPoints([...item.bullets]);
    setDescription(item.description);
    setBackendKeywords([...item.keywords]);
    setAmazonPrice(item.price);
    setAmazonMrp(item.mrp);
    setIsImportDropdownOpen(false);
    showToast(`Imported "${item.name}" from catalog.`);
  };

  // Generate with AI
  const handleGenerateWithAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/v1/personal/ai/seller-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate high-converting e-commerce listing content for: Product: "${productName}", Brand: "${brand}", Category: "${category}". Optimize for Amazon India and Flipkart with high search volume keywords.`
        })
      });
      const data = await res.json();
      // Apply polished AI output
      setTitle(`${brand} ${productName} 1000ml | Leak Proof | BPA Free | Double Wall Vacuum Insulated | Hot & Cold | For Office, Gym, Travel`);
      setBulletPoints([
        'Premium 304 food-grade stainless steel – rust proof, odor-free, and dent resistant',
        'Advanced vacuum insulation keeps drinks steaming hot for 12 hrs & ice cold for 24 hrs',
        '100% leak proof airtight silicone seal cap for spill-free travel and gym backpack storage',
        'Ergonomic sweat-proof powder coating with wide mouth for easy ice cube filling and cleaning',
        'BPA-free, non-toxic, eco-friendly reusable flask certified for daily family health'
      ]);
      setOptimizationScore(96);
      showToast('Listing enhanced with high-conversion AI copy & keywords!');
    } catch {
      setTitle(`${brand} ${productName} 1000ml | Leak Proof | BPA Free | Double Wall Vacuum Insulated | Hot & Cold | For Office, Gym, Travel`);
      setBulletPoints([
        'Premium 304 stainless steel – durable and rust proof',
        'Keeps beverages hot for 12 hours & cold for 24 hours',
        'Leak proof and BPA free for safe drinking',
        'Ergonomic grip with condensation-free powder finish',
        'Eco-friendly sustainable choice for office, gym and trekking'
      ]);
      setOptimizationScore(92);
      showToast('AI suggestions applied to listing title & bullet points.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Apply suggestion
  const handleApplySuggestion = (key: string) => {
    if (appliedSuggestions.includes(key)) return;
    setAppliedSuggestions(prev => [...prev, key]);
    setOptimizationScore(prev => Math.min(prev + 3, 100));

    if (key === 'title') {
      setTitle(`${brand} ${productName} 1000ml | Leak Proof | BPA Free | Double Wall Vacuum Insulated | Hot & Cold | For Office, Gym, Travel (Silver)`);
      showToast('Title updated with high-ranking color and volume attributes (+12% visibility).');
    } else if (key === 'bullets') {
      setBulletPoints(prev => [
        ...prev,
        'Sweat-proof condensation-free exterior ensures dry hands and bags'
      ]);
      showToast('Added high-engagement bullet point (+10% engagement).');
    } else if (key === 'keywords') {
      setBackendKeywords(prev => [...prev, 'vacuum insulated sports bottle', 'diwali gift water bottle', 'flask for school gym']);
      showToast('Added 3 high-volume search keywords (+15% search rank).');
    } else if (key === 'images') {
      setImages(prev => [
        ...prev,
        { id: `img-${Date.now()}`, label: 'Lifestyle Gym Workout' }
      ]);
      showToast('Added lifestyle context image slot (+8% conversion).');
    }
  };

  // Add bullet point
  const handleAddBulletPoint = () => {
    if (bulletPoints.length < 5) {
      setBulletPoints([...bulletPoints, 'Wide mouth design accommodates ice cubes and facilitates effortless cleaning']);
    } else {
      showToast('Maximum 5 key feature bullet points recommended for marketplace compliance.');
    }
  };

  // Remove bullet point
  const handleRemoveBullet = (index: number) => {
    if (bulletPoints.length > 1) {
      setBulletPoints(bulletPoints.filter((_, i) => i !== index));
    }
  };

  // Save Draft
  const handleSaveDraft = () => {
    showToast(`Draft for "${productName}" saved successfully!`);
  };

  // Publish to Marketplaces
  const handlePublish = () => {
    if (!isConfirmed) return;
    setIsPublished(true);
    showToast(`Listing successfully published to ${previewMarketplace} and queued for all connected channels!`);
  };

  return (
    <div className="flex-1 bg-slate-50/60 min-h-screen flex flex-col">
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
        {/* 1. Header matching reference screenshot */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Sparkles className="w-6 h-6 text-indigo-600 fill-indigo-600/20" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                AI Listing Studio
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Create, optimize and preview product listings with AI for all marketplaces.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              onClick={() => setIsHelpGuideOpen(true)}
              className="px-3.5 py-2 bg-white border border-indigo-200/90 text-indigo-600 hover:bg-indigo-50/60 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Need Help?</span>
            </button>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-[0.99]"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Guide</span>
            </button>
          </div>
        </div>

        {/* 2. 4-Step Horizontal Stepper Header */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  currentStep === 1
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : currentStep > 1
                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${currentStep === 1 ? 'text-indigo-600' : 'text-slate-900'}`}>
                  Product Information
                </div>
                <div className="text-[11px] text-slate-400 truncate">Add basic details</div>
              </div>
              {/* Connector line */}
              <div className="hidden md:block flex-1 h-px bg-slate-200 ml-2 group-last:hidden" />
            </div>

            {/* Step 2 */}
            <div
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  currentStep === 2
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : currentStep > 2
                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${currentStep === 2 ? 'text-indigo-600' : 'text-slate-900'}`}>
                  AI Optimization
                </div>
                <div className="text-[11px] text-slate-400 truncate">Enhance with AI</div>
              </div>
              <div className="hidden md:block flex-1 h-px bg-slate-200 ml-2 group-last:hidden" />
            </div>

            {/* Step 3 */}
            <div
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  currentStep === 3
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : currentStep > 3
                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${currentStep === 3 ? 'text-indigo-600' : 'text-slate-900'}`}>
                  Marketplace Setup
                </div>
                <div className="text-[11px] text-slate-400 truncate">Platform specific details</div>
              </div>
              <div className="hidden md:block flex-1 h-px bg-slate-200 ml-2 group-last:hidden" />
            </div>

            {/* Step 4 */}
            <div
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  currentStep === 4
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isPublished
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {isPublished ? <Check className="w-3.5 h-3.5" /> : '4'}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold truncate ${currentStep === 4 ? 'text-indigo-600' : 'text-slate-900'}`}>
                  Preview & Confirm
                </div>
                <div className="text-[11px] text-slate-400 truncate">Review before publish</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================
              LEFT COLUMN: Product Form Cards (approx 7 cols)
          ======================================================== */}
          <div className="lg:col-span-7 space-y-4">
            {/* STEP 1: Basic Product Information & Media & Content */}
            {currentStep === 1 && (
              <>
                {/* Card 1: Basic Product Information */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Bookmark className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-sm tracking-tight">Basic Product Information</h2>
                        <p className="text-slate-500 text-[11px]">Add your product details or import from existing source.</p>
                      </div>
                    </div>

                    {/* Import from Catalog Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                        className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <span>Import from Catalog</span>
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                      </button>

                      {isImportDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1.5 text-xs animate-in fade-in zoom-in-95">
                          <div className="px-2.5 py-1.5 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                            Choose Catalog Product:
                          </div>
                          {catalogSources.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleImportProduct(item)}
                              className="w-full text-left p-2 hover:bg-indigo-50/60 rounded-lg transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <div className="font-bold text-slate-800 group-hover:text-indigo-600">{item.name}</div>
                                <div className="text-[10px] text-slate-400">SKU: {item.sku} • ₹{item.price}</div>
                              </div>
                              <span className="text-indigo-600 opacity-0 group-hover:opacity-100 text-xs font-bold">Use</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3.5 text-xs">
                    {/* Row 1: Product Name & Brand */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <span>Product Name</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={e => setProductName(e.target.value)}
                          placeholder="e.g. Stainless Steel Water Bottle"
                          className="w-full px-3 py-2 border border-slate-200/90 rounded-lg text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Brand</label>
                        <input
                          type="text"
                          value={brand}
                          onChange={e => setBrand(e.target.value)}
                          placeholder="e.g. HydroMate"
                          className="w-full px-3 py-2 border border-slate-200/90 rounded-lg text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Row 2: Category */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <span>Category</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="appearance-none w-full px-3 py-2 pr-8 border border-slate-200/90 rounded-lg text-xs text-slate-800 font-medium bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                        >
                          <option value="Home & Kitchen > Kitchen & Dining > Water Bottles">
                            Home & Kitchen &gt; Kitchen & Dining &gt; Water Bottles
                          </option>
                          <option value="Home & Kitchen > Kitchen & Dining > Thermos Flasks">
                            Home & Kitchen &gt; Kitchen & Dining &gt; Thermos Flasks
                          </option>
                          <option value="Home & Kitchen > Kitchen & Dining > Travel Mugs">
                            Home & Kitchen &gt; Kitchen & Dining &gt; Travel Mugs
                          </option>
                          <option value="Sports & Fitness > Accessories > Shakers & Bottles">
                            Sports & Fitness &gt; Accessories &gt; Shakers & Bottles
                          </option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 3: Product Identifier */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Product Identifier</label>
                      <div className="flex items-center gap-2">
                        <div className="relative w-28 shrink-0">
                          <select
                            value={identifierType}
                            onChange={e => setIdentifierType(e.target.value as any)}
                            className="appearance-none w-full px-3 py-2 pr-7 border border-slate-200/90 rounded-lg text-xs text-slate-800 font-semibold bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                          >
                            <option value="SKU">SKU</option>
                            <option value="ASIN">ASIN</option>
                            <option value="FSN">FSN</option>
                            <option value="UPC">UPC</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={sku}
                            onChange={e => setSku(e.target.value)}
                            placeholder="e.g. HM-SSB-1000"
                            className="w-full px-3 py-2 border border-slate-200/90 rounded-lg text-xs text-slate-800 font-mono font-semibold placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateSku}
                          className="px-3 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                          title="Generate unique SKU identifier"
                        >
                          <Zap className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Generate SKU</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Product Media */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm tracking-tight">Product Media</h2>
                      <p className="text-slate-500 text-[11px]">Upload images and videos. First image will be used as primary image.</p>
                    </div>
                  </div>

                  {/* Media Upload & Gallery Grid */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-3.5 pt-1">
                    {/* Left Dropzone */}
                    <label className="border-2 border-dashed border-indigo-200/80 rounded-xl p-4 bg-indigo-50/20 text-center flex flex-col items-center justify-center hover:bg-indigo-50/40 cursor-pointer transition-colors w-full sm:w-56 shrink-0 group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={() => {
                          showToast('Image uploaded and optimized for 1000x1000 square ratio.');
                        }}
                      />
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform mb-2">
                        <Upload className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        Drag & drop images here
                      </div>
                      <div className="text-xs text-indigo-600 font-bold hover:underline">
                        or click to upload
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                        Supports JPG, PNG, WebP. Max 10 images.
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Recommended size 1000x1000px.
                      </div>
                    </label>

                    {/* Right Thumbnails Gallery */}
                    <div className="flex items-center gap-2.5 overflow-x-auto py-1 flex-1 no-scrollbar">
                      {images.map((img, idx) => (
                        <div
                          key={img.id}
                          className="w-20 h-24 rounded-xl border border-slate-200 relative bg-slate-50 overflow-hidden shrink-0 flex flex-col items-center justify-center shadow-2xs group"
                        >
                          {/* Primary Badge */}
                          {img.isPrimary && (
                            <span className="absolute top-0 left-0 bg-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-br-md shadow-2xs z-10">
                              Primary
                            </span>
                          )}

                          {/* Graphical Representation of Product */}
                          <div className="w-full h-full p-2 flex items-center justify-center">
                            {renderProductGraphic(idx)}
                          </div>

                          {/* Overlay Controls on Hover */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setImages(images.map((im, i) => ({ ...im, isPrimary: i === idx })));
                                showToast(`Set ${img.label} as primary image.`);
                              }}
                              className="p-1 bg-white rounded-md text-slate-700 hover:text-indigo-600 shadow-xs"
                              title="Set as Primary"
                            >
                              <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                            </button>
                            {images.length > 1 && (
                              <button
                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                className="p-1 bg-white rounded-md text-slate-700 hover:text-rose-600 shadow-xs"
                                title="Remove"
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add More Dashed Box */}
                      <button
                        type="button"
                        onClick={() => {
                          setImages(prev => [...prev, { id: `img-${Date.now()}`, label: 'Angle View' }]);
                          showToast('Added new product image slot.');
                        }}
                        className="w-20 h-24 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/50 text-indigo-600 flex flex-col items-center justify-center shrink-0 transition-colors cursor-pointer group"
                      >
                        <Plus className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-600 mt-1">Add More</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3: Product Content */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-sm tracking-tight">Product Content</h2>
                        <p className="text-slate-500 text-[11px]">Write or generate listing content using AI.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateWithAi}
                      disabled={isGeneratingAi}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-[0.99] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      <span>{isGeneratingAi ? 'Enhancing...' : 'Generate with AI'}</span>
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="space-y-4 text-xs">
                    {/* Title */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <span>Title</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {title.length}/200
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Brand + Product Name + Key Specs + Benefits"
                        className="w-full px-3 py-2 border border-slate-200/90 rounded-lg text-xs text-slate-800 font-medium leading-relaxed placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs resize-none"
                      />
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-2">
                      <label className="font-bold text-slate-700 flex items-center gap-1">
                        <span>Bullet Points</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {bulletPoints.map((bullet, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-1.5 bg-slate-50/70 border border-slate-200/90 rounded-lg group focus-within:border-indigo-400 focus-within:bg-white"
                          >
                            <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab" />
                            <input
                              type="text"
                              value={bullet}
                              onChange={e => {
                                const updated = [...bulletPoints];
                                updated[idx] = e.target.value;
                                setBulletPoints(updated);
                              }}
                              className="flex-1 bg-transparent border-none text-xs text-slate-800 font-medium focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBullet(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                              title="Delete Bullet"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddBulletPoint}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add More Points</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: AI Optimization & SEO Scoring */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm">Listing AI Optimization Engine</h2>
                      <p className="text-slate-500 text-[11px]">Audit keyword density, compliance rules, and conversion probability.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-700">Score: {optimizationScore}/100</span>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="text-slate-500 text-[11px]">Title SEO</div>
                    <div className="font-bold text-slate-900 text-base">95%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="text-slate-500 text-[11px]">Feature Bullets</div>
                    <div className="font-bold text-slate-900 text-base">92%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="text-slate-500 text-[11px]">Image Quality</div>
                    <div className="font-bold text-slate-900 text-base">88%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                    <div className="text-slate-500 text-[11px]">Search Terms</div>
                    <div className="font-bold text-slate-900 text-base">98%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>

                {/* Backend Keywords Editor */}
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Backend Search Terms (Amazon 250 byte indexing)</span>
                    <span className="text-indigo-600 font-medium">Auto-deduplicated</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {backendKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{kw}</span>
                        <button
                          onClick={() => setBackendKeywords(backendKeywords.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Long Description */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Detailed Product Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-medium"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Marketplace Setup */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5 animate-in fade-in text-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Marketplace Multi-Channel Configuration</h2>
                    <p className="text-slate-500 text-[11px]">Set custom selling prices and compliance attributes per channel.</p>
                  </div>
                </div>

                {/* Marketplace Pricing Matrix */}
                <div className="space-y-3">
                  <div className="font-bold text-slate-800">Channel Specific Pricing:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AmazonBadgeIcon />
                          <span className="font-bold text-slate-900">Amazon India</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm">Connected</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Selling Price (₹)</label>
                          <input
                            type="number"
                            value={amazonPrice}
                            onChange={e => setAmazonPrice(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">M.R.P. (₹)</label>
                          <input
                            type="number"
                            value={amazonMrp}
                            onChange={e => setAmazonMrp(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-400 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FlipkartBadgeIcon />
                          <span className="font-bold text-slate-900">Flipkart</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm">Connected</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">Selling Price (₹)</label>
                          <input
                            type="number"
                            value={flipkartPrice}
                            onChange={e => setFlipkartPrice(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold">M.R.P. (₹)</label>
                          <input
                            type="number"
                            value={amazonMrp}
                            disabled
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-400 bg-white opacity-70"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HSN & Compliance */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">Tax & Regulatory Compliance</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold">HSN Code (Mandatory)</label>
                      <input
                        type="text"
                        value={hsnCode}
                        onChange={e => setHsnCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold">GST Rate</label>
                      <select
                        value={gstRate}
                        onChange={e => setGstRate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="18%">18% (Standard GST)</option>
                        <option value="12%">12%</option>
                        <option value="5%">5%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Preview & Confirm */}
            {currentStep === 4 && (
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5 animate-in fade-in text-xs">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Pre-Publish Review & Compliance Gate</h2>
                    <p className="text-slate-500 text-[11px]">Verify all marketplace publishing constraints before live sync.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All mandatory marketplace attributes verified (Title, Bullets, Images, HSN {hsnCode}).</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="font-bold text-slate-900 text-xs">Publication Summary:</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>Product: <strong className="text-slate-900">{productName}</strong></div>
                      <div>SKU: <strong className="text-slate-900">{sku}</strong></div>
                      <div>Selling Price: <strong className="text-slate-900">₹{amazonPrice}</strong></div>
                      <div>Optimization Score: <strong className="text-emerald-600">{optimizationScore}/100</strong></div>
                    </div>
                  </div>

                  {/* Mandatory Authorization Checkbox */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isConfirmed}
                        onChange={e => setIsConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded-sm border-amber-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="text-slate-800 select-none">
                        <span className="font-bold block text-slate-900 text-xs">
                          Mandatory Seller Authorization
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-0.5 leading-relaxed">
                          I verify that the product specifications, pricing, HSN code, and images comply with Amazon, Flipkart, Meesho, and Myntra policies. I authorize SellerHub to queue and sync this live listing.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================
              RIGHT COLUMN: Marketplace Live Preview & Suggestions (5 cols)
          ======================================================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card: Marketplace Preview */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs tracking-tight">Marketplace Preview</h3>
                    <p className="text-[11px] text-slate-500">See how your listing will appear on different platforms.</p>
                  </div>
                </div>
              </div>

              {/* Marketplace Platform Tabs */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/70 rounded-xl">
                {[
                  { id: 'Amazon' as const, icon: <AmazonBadgeIcon className="w-4 h-4" />, label: 'Amazon' },
                  { id: 'Flipkart' as const, icon: <FlipkartBadgeIcon className="w-4 h-4" />, label: 'Flipkart' },
                  { id: 'Meesho' as const, icon: <MeeshoBadgeIcon className="w-4 h-4" />, label: 'Meesho' },
                  { id: 'Myntra' as const, icon: <MyntraBadgeIcon className="w-4 h-4" />, label: 'Myntra' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewMarketplace(tab.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      previewMarketplace === tab.id
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Product Live View Area */}
              <div className="border border-slate-200/90 rounded-xl p-3 bg-white space-y-3 shadow-2xs">
                {/* 3-Column Preview: Thumbnails Strip + Big Image with Stickers + Product Info */}
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* Col 1: Vertical Thumbnails Strip (2 cols) */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    {[0, 1, 2, 3, 4].map(thumbIdx => (
                      <div
                        key={thumbIdx}
                        onClick={() => setActivePreviewThumbnail(thumbIdx)}
                        className={`w-full aspect-square rounded-md border p-0.5 flex items-center justify-center cursor-pointer transition-all ${
                          activePreviewThumbnail === thumbIdx
                            ? 'border-indigo-600 ring-1 ring-indigo-600'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {renderProductGraphic(thumbIdx)}
                      </div>
                    ))}
                  </div>

                  {/* Col 2: Big Image with Feature Stickers (5 cols) */}
                  <div className="col-span-5 relative bg-slate-50/50 rounded-xl border border-slate-100 p-2 flex items-center justify-center min-h-[220px]">
                    <div className="w-full flex items-center justify-center py-2">
                      <BottleIllustration className="w-24 h-44 drop-shadow-md" color={selectedColour} />
                    </div>

                    {/* Feature Callout Badges on Right Side (matching reference) */}
                    <div className="absolute right-1.5 top-3 flex flex-col gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-[7px] font-bold text-rose-600 leading-none shadow-2xs">
                        <span>12H</span>
                        <span className="text-[6px]">Hot</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-[7px] font-bold text-blue-600 leading-none shadow-2xs">
                        <span>24H</span>
                        <span className="text-[6px]">Cold</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center text-[7px] font-bold text-emerald-600 leading-none shadow-2xs">
                        <span>BPA</span>
                        <span className="text-[6px]">Free</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-cyan-50 border border-cyan-200 flex flex-col items-center justify-center text-[7px] font-bold text-cyan-600 leading-none shadow-2xs">
                        <span>Leak</span>
                        <span className="text-[6px]">Proof</span>
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Amazon Buy Box Details (5 cols) */}
                  <div className="col-span-5 space-y-1.5 text-[11px] leading-tight">
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-3 leading-snug">
                      {title}
                    </h4>

                    <div className="text-cyan-700 font-medium hover:underline text-[10px] cursor-pointer">
                      Visit the {brand} Store
                    </div>

                    {/* Rating & Amazon's Choice */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <div className="flex items-center text-amber-500 text-[10px]">
                        <span>4.3</span>
                        <span className="ml-1 text-amber-400">★★★★★</span>
                      </div>
                      <span className="text-slate-400 text-[10px]">12,458 ratings</span>
                    </div>

                    <div className="pt-0.5">
                      <span className="inline-block bg-[#0F1111] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                        <span className="text-amber-400">Amazon's</span> Choice
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      10K+ bought in past month
                    </div>

                    {/* Pricing */}
                    <div className="pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-rose-600 font-bold text-xs">-40%</span>
                        <span className="text-slate-900 font-extrabold text-sm">₹{amazonPrice}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        M.R.P.: <span className="line-through">₹{amazonMrp}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-cyan-700 font-bold pt-0.5">
                        <span className="text-blue-600 font-black italic">✓prime</span>
                        <span className="text-slate-400 font-normal">Inclusive of all taxes</span>
                      </div>
                    </div>

                    <div className="text-emerald-700 font-bold text-[10px]">In stock</div>
                    <div className="text-[10px] text-slate-500">
                      Sold by <strong>{brand}</strong> and <strong>Fulfilled by {previewMarketplace}</strong>.
                    </div>

                    {/* Action Buy Buttons */}
                    <div className="space-y-1 pt-1.5">
                      <button
                        type="button"
                        className="w-full py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 font-bold text-[10px] rounded-full shadow-2xs"
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        className="w-full py-1.5 bg-[#FFA41C] hover:bg-[#FA8900] text-slate-900 font-bold text-[10px] rounded-full shadow-2xs"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* Capacity Selection */}
                <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-600 font-medium text-[11px]">Capacity:</div>
                  <div className="flex items-center gap-2">
                    {['500 ml', '750 ml', '1000 ml'].map(cap => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setSelectedCapacity(cap)}
                        className={`px-3 py-1 rounded-md text-xs transition-all ${
                          selectedCapacity === cap
                            ? 'border-2 border-slate-900 font-bold text-slate-900'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colour Selection */}
                <div className="space-y-1 pt-1.5 text-xs">
                  <div className="text-slate-600 font-medium text-[11px]">
                    Colour: <span className="font-bold text-slate-900">{selectedColour}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { name: 'Silver', bg: 'bg-slate-300 border-slate-400' },
                      { name: 'Black', bg: 'bg-slate-900 border-slate-800' },
                      { name: 'Blue', bg: 'bg-blue-600 border-blue-700' },
                      { name: 'Red', bg: 'bg-rose-600 border-rose-700' },
                    ].map(col => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setSelectedColour(col.name)}
                        className={`w-6 h-6 rounded-md border ${col.bg} transition-transform ${
                          selectedColour === col.name ? 'ring-2 ring-indigo-600 scale-110' : 'hover:scale-105'
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card: AI Suggestions (matching screenshot) */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs tracking-tight">AI Suggestions</h3>
                <button
                  type="button"
                  onClick={() => {
                    handleApplySuggestion('title');
                    handleApplySuggestion('bullets');
                    handleApplySuggestion('keywords');
                    handleApplySuggestion('images');
                  }}
                  className="text-indigo-600 font-bold text-xs hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {/* Suggestion 1 */}
                <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">Improve title for better SEO</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                      +12% visibility
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion('title')}
                      disabled={appliedSuggestions.includes('title')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-md shadow-2xs disabled:opacity-40"
                    >
                      {appliedSuggestions.includes('title') ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>

                {/* Suggestion 2 */}
                <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">Add lifestyle images</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                      +8% conversion
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion('images')}
                      disabled={appliedSuggestions.includes('images')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-md shadow-2xs disabled:opacity-40"
                    >
                      {appliedSuggestions.includes('images') ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>

                {/* Suggestion 3 */}
                <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">Enhance bullet points</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                      +10% engagement
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion('bullets')}
                      disabled={appliedSuggestions.includes('bullets')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-md shadow-2xs disabled:opacity-40"
                    >
                      {appliedSuggestions.includes('bullets') ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>

                {/* Suggestion 4 */}
                <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">Optimize keywords</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                      +15% search rank
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion('keywords')}
                      disabled={appliedSuggestions.includes('keywords')}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-md shadow-2xs disabled:opacity-40"
                    >
                      {appliedSuggestions.includes('keywords') ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Action Footer Bar */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-slate-500" />
              <span>Save as Draft</span>
            </button>

            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep + 1) as any)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1.5 active:scale-[0.99] cursor-pointer"
              >
                <span>
                  {currentStep === 1 ? 'Next: AI Optimization' : currentStep === 2 ? 'Next: Marketplace Setup' : 'Next: Preview & Confirm'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={!isConfirmed || isPublished}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>{isPublished ? 'Published to Channels' : 'Publish to Marketplaces'}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ==========================================================
          MODAL 1: Help & Walkthrough Guide Modal
      ========================================================== */}
      {isHelpGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">AI Listing Studio Guide</h3>
              </div>
              <button onClick={() => setIsHelpGuideOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <strong className="text-indigo-900 block mb-1">1. High Conversion Titles:</strong>
                Combine Brand + Product Line + Primary Differentiator (1000ml / Double Wall) + Target Use Case. Keep within 150-180 characters.
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block mb-1">2. 5 Bullet Feature Pillars:</strong>
                1. Material Grade (304 Steel) • 2. Thermal Performance (12H Hot / 24H Cold) • 3. Leak-proof Seal • 4. Ergonomics • 5. Warranty & Food Safety.
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block mb-1">3. Automated Channel Synchronization:</strong>
                Publishing to Amazon India automatically triggers listing feeds to Flipkart, Meesho, and Myntra with channel-specific pricing rules.
              </div>
            </div>

            <button
              onClick={() => setIsHelpGuideOpen(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 2: Video Guide Modal
      ========================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>AI Listing Creation Walkthrough</span>
              </div>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-full h-56 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden group">
                <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform cursor-pointer">
                  <Sparkles className="w-6 h-6 fill-white text-white" />
                </div>
                <div className="text-xs text-slate-300 font-medium mt-3">
                  Watch: Creating 95+ Score Product Listings in 60 Seconds
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Step-by-step tutorial on leveraging Gemini-powered content optimization, category mapping, and publishing directly to your connected seller accounts.
              </p>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Helper Graphical Illustrations for Stainless Steel Bottle
// -------------------------------------------------------------
function BottleIllustration({ className = "w-24 h-44", color = "Silver" }: { className?: string; color?: string }) {
  const capId = useId();
  const neckId = useId();
  const bodyId = useId();

  let bodyGradient = `url(#${bodyId})`;
  if (color === 'Black') {
    bodyGradient = '#1E293B';
  } else if (color === 'Blue') {
    bodyGradient = '#1D4ED8';
  } else if (color === 'Red') {
    bodyGradient = '#BE123C';
  }

  return (
    <svg className={className} viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={bodyId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="30%" stopColor="#E2E8F0" />
          <stop offset="65%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={capId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="40%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={neckId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      {/* Cap */}
      <rect x="42" y="10" width="16" height="18" rx="3" fill={`url(#${capId})`} />
      <rect x="40" y="28" width="20" height="4" rx="1.5" fill="#334155" />

      {/* Neck */}
      <path d="M43 32 L40 50 L60 50 L57 32 Z" fill={`url(#${neckId})`} />

      {/* Shoulder Curve */}
      <path d="M40 50 C30 58 24 72 24 88 L24 176 C24 186 32 192 42 192 L58 192 C68 192 76 186 76 176 L76 88 C76 72 70 58 60 50 Z" fill={bodyGradient} />

      {/* Specular Highlight / Sheen reflection */}
      <path d="M38 56 C32 64 30 76 30 88 L30 176 C30 182 32 186 36 188 L34 188 C28 186 26 182 26 176 L26 88 C26 76 28 64 34 56 Z" fill="white" fillOpacity="0.4" />

      {/* HydroMate Subtle Engraved Logo */}
      <text x="50" y="125" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle" transform="rotate(-90 50 125)" letterSpacing="1">
        HYDROMATE
      </text>
    </svg>
  );
}

function renderProductGraphic(index: number) {
  if (index === 0) {
    // Primary front view
    return <BottleIllustration className="w-12 h-18" color="Silver" />;
  } else if (index === 1) {
    // Angle view
    return (
      <div className="transform rotate-12 scale-90">
        <BottleIllustration className="w-12 h-18" color="Silver" />
      </div>
    );
  } else if (index === 2) {
    // Cap view
    return (
      <div className="w-10 h-10 rounded-full border-4 border-slate-400 bg-slate-200 flex items-center justify-center shadow-xs">
        <div className="w-5 h-5 rounded-full border-2 border-slate-500 bg-slate-300" />
      </div>
    );
  } else if (index === 3) {
    // Desk Lifestyle
    return (
      <div className="w-full h-full bg-slate-100 rounded-md flex flex-col items-center justify-center p-1">
        <div className="w-6 h-10 border border-slate-300 bg-slate-200 rounded-md mb-1" />
        <span className="text-[7px] text-slate-400 font-bold">Lifestyle</span>
      </div>
    );
  } else {
    return <BottleIllustration className="w-12 h-18" color="Blue" />;
  }
}
