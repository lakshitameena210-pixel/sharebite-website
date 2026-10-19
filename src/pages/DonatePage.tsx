import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Utensils,
  Clock,
  MapPin,
  ShieldCheck,
  Check,
  Camera,
  Flame,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Key,
  Lock,
  Unlock,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FoodCategory, RescuePriority } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthModal } from '../components/modals/AuthModal';

const CATEGORIES: FoodCategory[] = [
  'Prepared Meals',
  'Bakery & Pastries',
  'Fresh Produce',
  'Dairy & Eggs',
  'Pantry & Dry Goods',
  'Beverages',
  'Snacks & Packaged',
];

const PRESET_IMAGES: { label: string; url: string; category: FoodCategory }[] = [
  {
    label: 'Dum Vegetable Biryani & Raita',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    category: 'Prepared Meals',
  },
  {
    label: 'Fresh Rotis, Dal Tadka & Sabzi',
    url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
    category: 'Prepared Meals',
  },
  {
    label: 'Steamed Idli & Hot Sambar',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    category: 'Prepared Meals',
  },
  {
    label: 'Crispy Samosas & Snacks',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    category: 'Snacks & Packaged',
  },
  {
    label: 'Fresh Seasonal Fruits & Veggies',
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80',
    category: 'Fresh Produce',
  },
  {
    label: 'Dairy, Paneer & Curd Parfaits',
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80',
    category: 'Dairy & Eggs',
  },
  {
    label: 'Fresh Mango Lassi & Juices',
    url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&auto=format&fit=crop&q=80',
    category: 'Beverages',
  },
];

const DIETARY_OPTIONS = [
  'Pure Veg',
  'Vegetarian',
  'Jain (No Onion/Garlic)',
  'Halal Friendly',
  'Gluten-Free Friendly',
  'Dairy-Free',
  'Eggless',
];

export const DonatePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // AI Assistant input state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // AI Assistant Authentication Token state
  const [aiToken, setAiToken] = useState<string>(() => localStorage.getItem('sharebite_ai_token') || '');
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [showTokenSettings, setShowTokenSettings] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  // Active token: custom input, stored AI token, or user session JWT
  const userSessionToken = localStorage.getItem('sharebite_token') || '';
  const effectiveToken = customTokenInput.trim() || aiToken || userSessionToken;

  const handleGenerateAiToken = async () => {
    try {
      setIsGeneratingToken(true);
      const donorName = user?.name || user?.organizationDetails?.orgName || 'Kitchen Food Donor';
      const res = await api.generateAiToken(donorName);
      localStorage.setItem('sharebite_ai_token', res.token);
      setAiToken(res.token);
      showToast(`AI Donor Assistant token issued: ${res.token.slice(0, 16)}...`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to issue AI donor token', 'error');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const copyTokenToClipboard = () => {
    const tokenToCopy = effectiveToken;
    if (!tokenToCopy) return;
    navigator.clipboard.writeText(tokenToCopy);
    showToast('AI authentication token copied to clipboard!', 'success');
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Prepared Meals');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState('plates');
  const [estimatedServings, setEstimatedServings] = useState<number>(12);
  const [description, setDescription] = useState('');
  const [rescuePriority, setRescuePriority] = useState<RescuePriority>('High');
  const [dietaryTags, setDietaryTags] = useState<string[]>(['Vegetarian']);
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [pickupAddress, setPickupAddress] = useState(user?.address || 'Shop 4, Amrapali Circle, Queens Road, Vaishali Nagar, Jaipur, Rajasthan');
  const [pickupTimeWindow, setPickupTimeWindow] = useState('Today between 3:00 PM - 6:00 PM (IST)');
  const [storageInstructions, setStorageInstructions] = useState('Keep warm above 60°C or chill upon arrival');

  // Expiry date calculation
  const getInitialExpiry = (hours: number) => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  };
  const [expiryDate, setExpiryDate] = useState(() => getInitialExpiry(4));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle AI autofill
  const handleAiSuggest = async (overridePrompt?: string) => {
    const textToUse = overridePrompt || aiPrompt;
    if (!textToUse.trim()) {
      showToast('Please type a short description of what you have (e.g. 20 plates of vegetable rice)', 'warning');
      return;
    }

    try {
      setIsAiLoading(true);

      // Ensure active authentication token for AI donor assistant
      let tokenToUse = effectiveToken;
      if (!tokenToUse) {
        const donorName = user?.name || user?.organizationDetails?.orgName || 'Kitchen Food Donor';
        const tokenRes = await api.generateAiToken(donorName);
        localStorage.setItem('sharebite_ai_token', tokenRes.token);
        setAiToken(tokenRes.token);
        tokenToUse = tokenRes.token;
        showToast('Generated AI Donor Assistant token for this session', 'info');
      }

      const res = await api.suggestListing(textToUse, tokenToUse);
      const sug = res.suggestion;

      setTitle(sug.title);
      setCategory(sug.category);
      setQuantity(sug.quantity);
      setUnit(sug.unit);
      setEstimatedServings(sug.estimatedServings);
      setDescription(sug.description);
      setRescuePriority(sug.rescuePriority);
      setDietaryTags(sug.dietaryTags);
      setStorageInstructions(sug.storageInstructions);
      setPickupTimeWindow(sug.pickupTimeWindow);
      setExpiryDate(getInitialExpiry(sug.recommendedExpiryHours || 4));

      // Match closest image
      const matched = PRESET_IMAGES.find(p => p.category === sug.category);
      if (matched) setImageUrl(matched.url);

      setAiGenerated(true);
      showToast('AI listing suggestions applied! Review and post below.', 'success');
    } catch (err: any) {
      showToast(err.message || 'AI assistant encountered an issue', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleDietaryTag = (tag: string) => {
    setDietaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createListing({
        title,
        category,
        quantity: Number(quantity),
        unit,
        estimatedServings: Number(estimatedServings),
        description,
        rescuePriority,
        dietaryTags,
        imageUrl,
        pickupAddress,
        pickupTimeWindow,
        storageInstructions,
        expiryDate: new Date(expiryDate).toISOString(),
      });

      showToast('Food listing published successfully! Nearby recipients alerted.', 'success');
      navigate(`/food/${res.listing.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to post food listing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Zero-Waste Donor Portal
          </div>
          <h1 className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Post Surplus Food
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Turn leftover catering, surplus fresh bakes, or extra inventory into immediate meals for the community.
          </p>
        </div>

        {/* ShareBite AI Assistant Magic Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-emerald-900 text-white shadow-xl mb-10 border border-emerald-800 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-lg font-serif">
                ShareBite AI Donor Assistant
              </h3>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed mb-4">
              Don’t spend time filling forms. Tell us what you have in plain natural language, and AI will classify the category, safe temperature window, servings, and appetizing copy.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. I have 20 plates of vegetable rice and dal left from today's event."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAiSuggest();
                  }
                }}
                className="flex-1 px-4 py-3 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-white placeholder-emerald-400/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleAiSuggest()}
                disabled={isAiLoading}
                className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAiLoading ? 'Analyzing...' : 'Generate with AI'}</span>
              </button>
            </div>

            {/* Quick Prompts Suggestions */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-200">
              <span className="text-[11px] text-emerald-300/80">Try clicking:</span>
              <button
                type="button"
                onClick={() => {
                  setAiPrompt("I have 20 plates of vegetable rice and dal left from today's event.");
                  handleAiSuggest("I have 20 plates of vegetable rice and dal left from today's event.");
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-[11px] transition text-emerald-100"
              >
                "20 plates of vegetable rice & dal"
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiPrompt('50 freshly made rotis, dal tadka and paneer curry from wedding reception in Kothrud');
                  handleAiSuggest('50 freshly made rotis, dal tadka and paneer curry from wedding reception in Kothrud');
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-[11px] transition text-emerald-100"
              >
                "50 rotis, dal & paneer from wedding"
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiPrompt('40 crispy samosas and fresh green mint chutney from high-tea');
                  handleAiSuggest('40 crispy samosas and fresh green mint chutney from high-tea');
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-[11px] transition text-emerald-100"
              >
                "40 samosas & chutney from high-tea"
              </button>
            </div>

            {/* AI Assistant Authentication Token Status Bar */}
            <div className="mt-4 pt-3.5 border-t border-emerald-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-700/80 text-emerald-200">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Auth Token:</span>
                  <span className="font-mono text-amber-300">
                    {effectiveToken ? `${effectiveToken.slice(0, 14)}...` : 'Session Active'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                </span>

                {effectiveToken && (
                  <button
                    type="button"
                    onClick={copyTokenToClipboard}
                    className="p-1 text-emerald-300 hover:text-white transition"
                    title="Copy AI Authentication Token"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAiToken}
                  disabled={isGeneratingToken}
                  className="px-2.5 py-1 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-[11px] text-emerald-100 font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingToken ? 'animate-spin' : ''}`} />
                  <span>New Token</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTokenSettings(!showTokenSettings)}
                  className="text-[11px] text-emerald-300 hover:text-white underline transition flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Token Details</span>
                  {showTokenSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Collapsible Token Settings & API Key Integration Drawer */}
            {showTokenSettings && (
              <div className="mt-3 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-700/70 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-emerald-300">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> AI Assistant Authentication Details
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400/80">Scope: ai:donor_assistant</span>
                </div>
                
                <div>
                  <label className="block text-[11px] text-emerald-200 mb-1">
                    Custom / External AI Token (Optional for API testers):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTokenInput}
                      onChange={e => setCustomTokenInput(e.target.value)}
                      placeholder="e.g. sb_ai_donor_master_token_2026 or paste JWT"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-emerald-900 border border-emerald-700 text-white font-mono text-[11px] focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTokenInput('sb_ai_donor_master_token_2026');
                        showToast('Applied master AI donor token', 'info');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-[10px] font-semibold text-emerald-100"
                    >
                      Use Master Token
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-emerald-300/70 leading-relaxed">
                  All requests to <code className="bg-emerald-900 px-1 py-0.5 rounded text-amber-300 font-mono">POST /api/ai/suggest-listing</code> require a valid Bearer token header or <code className="bg-emerald-900 px-1 py-0.5 rounded text-amber-300 font-mono">x-ai-auth-token</code>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Food Post Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-8">
          {aiGenerated && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Fields populated with AI recommendations! You can edit any details below.</span>
              </div>
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          )}

          {/* Section: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif border-b border-stone-100 dark:border-stone-800 pb-2">
              1. Food Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Food Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Warm Vegetable Rice & Lentil Dal Platters"
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as FoodCategory)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Rescue Priority
                </label>
                <select
                  value={rescuePriority}
                  onChange={e => setRescuePriority(e.target.value as RescuePriority)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Urgent">🔥 Urgent (&lt; 4 hrs safe window)</option>
                  <option value="High">⚡ High (Same day pickup)</option>
                  <option value="Normal">🌿 Normal (Shelf stable / 24+ hrs)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="plates, loaves, kg, boxes"
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Estimated Servings
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={estimatedServings}
                  onChange={e => setEstimatedServings(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Description & Ingredients
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe packaging, ingredients, spice level, or reheating instructions..."
                className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Dietary Tags Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                Dietary & Allergen Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(tag => {
                  const isSelected = dietaryTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleDietaryTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isSelected
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Photos */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif border-b border-stone-100 dark:border-stone-800 pb-2">
              2. Photo
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_IMAGES.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setImageUrl(img.url)}
                  className={`relative aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer border-2 transition ${
                    imageUrl === img.url
                      ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-md bg-stone-950/80 text-[10px] text-white truncate font-medium">
                    {img.label}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Or Custom Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Section: Expiry & Pickup Logistics */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif border-b border-stone-100 dark:border-stone-800 pb-2">
              3. Pickup Logistics & Expiry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Expiration Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Pickup Time Window
                </label>
                <input
                  type="text"
                  required
                  value={pickupTimeWindow}
                  onChange={e => setPickupTimeWindow(e.target.value)}
                  placeholder="e.g. Today between 2:00 PM - 5:00 PM"
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Pickup Address & Bay Instructions
              </label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={e => setPickupAddress(e.target.value)}
                placeholder="e.g. Shop 4, Amrapali Circle, Queens Road, Vaishali Nagar, Jaipur (Kitchen pickup counter)"
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Safe Food Storage Instructions
              </label>
              <input
                type="text"
                value={storageInstructions}
                onChange={e => setStorageInstructions(e.target.value)}
                placeholder="e.g., Keep hot in chafing dishes or chill in refrigerator."
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xl shadow-emerald-900/10 hover:shadow-emerald-900/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Publishing Food Listing...' : 'Publish Food Listing for Rescue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center mt-2">
              By posting, you confirm this food was prepared and held under safe hygienic conditions.
            </p>
          </div>
        </form>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};
