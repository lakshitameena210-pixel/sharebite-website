import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  HeartHandshake,
  TrendingUp,
  Leaf,
  CheckCircle2,
  ChevronRight,
  Flame,
  Mail,
  Search,
  X,
  Phone,
  Send,
  MessageSquare,
} from 'lucide-react';
import { FoodCard } from '../components/common/FoodCard';
import { RequestModal } from '../components/modals/RequestModal';
import { EmailSupportModal } from '../components/modals/EmailSupportModal';
import { FoodListing, ImpactStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LandingPage: React.FC = () => {
  const [featuredListings, setFeaturedListings] = useState<FoodListing[]>([]);
  const [impactStats, setImpactStats] = useState<ImpactStats>({
    totalMealsRescued: 12480,
    totalKgCO2Saved: 3240,
    totalDonors: 420,
    totalOrganizations: 48,
    activeListingsCount: 8,
    rescuedListingsCount: 850,
  });
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Search state
  const [heroSearch, setHeroSearch] = useState('');
  const { showToast } = useToast();

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCategory, setContactCategory] = useState('Restaurant / Business Food Donor');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Impact calculator state
  const [calculatorMeals, setCalculatorMeals] = useState<number>(25);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/discover?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/discover');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      showToast('Please fill in your name, email, and message.', 'warning');
      return;
    }

    try {
      setIsContactSubmitting(true);
      await api.submitContact({
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
        category: contactCategory,
        subject: `Inquiry from ${contactName.trim()} (${contactCategory})`,
        message: contactMessage.trim(),
      });
      setContactSubmitted(true);
      showToast('Thank you! Your message has been sent to our team.', 'success');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit contact message', 'error');
    } finally {
      setIsContactSubmitting(false);
    }
  };

 useEffect(() => {
  api.getListings({ status: 'available' })
    .then((res) => {
      const listings = res?.listings;
      setFeaturedListings(
        Array.isArray(listings) ? listings.slice(0, 3) : []
      );
    })
    .catch((err) => {
      console.error('Failed to fetch listings:', err);
      setFeaturedListings([]);
    });

  api.getPublicImpact()
    .then((res) => {
      if (res?.stats) {
        setImpactStats((prev) => ({
          ...prev,
          ...res.stats,
        }));
      }
    })
    .catch((err) => {
      console.error('Failed to fetch public impact:', err);
    });
}, []);
  const handleRequestClick = (listing: FoodListing) => {
    setSelectedListing(listing);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-stone-200/70 dark:border-stone-850">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ShareBite India • Zero Food Waste Platform (Jaipur & Metropolitan Cities)</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-serif leading-[1.15]">
              Good food deserves <br />
              <span className="text-emerald-700 dark:text-emerald-400">
                another plate.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal max-w-2xl mx-auto">
              Help reduce food waste in your city by sharing surplus meals with people and organizations nearby. Connect restaurants, caterers, banquet halls, and kitchens with local shelters and families in real-time.
            </p>

            {/* Hero Keyword Search Bar */}
            <div className="pt-2 max-w-2xl mx-auto w-full">
              <form
                onSubmit={handleHeroSearch}
                className="relative flex items-center bg-white dark:bg-stone-900 border-2 border-emerald-600/40 dark:border-emerald-500/50 rounded-2xl p-1.5 shadow-xl shadow-emerald-950/10 hover:border-emerald-600 transition"
              >
                <div className="pl-3.5 pr-2 text-emerald-700 dark:text-emerald-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search food by item (e.g. roti, paneer, thali, bakery) or area..."
                  className="w-full py-2.5 px-2 bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
                />
                {heroSearch && (
                  <button
                    type="button"
                    onClick={() => setHeroSearch('')}
                    className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Search Food</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick Popular Keywords */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
                <span className="text-stone-500 dark:text-stone-400 font-medium mr-1">Popular:</span>
                {[
                  { label: '🍛 Thali & Meals', q: 'Thali' },
                  { label: '🫓 Roti & Bread', q: 'Roti' },
                  { label: '🍚 Biryani', q: 'Biryani' },
                  { label: '🧀 Paneer', q: 'Paneer' },
                  { label: '🥦 Vegetables', q: 'Produce' },
                  { label: '🍞 Bakery', q: 'Bakery' },
                  { label: '🌱 Pure Veg', q: 'Pure Veg' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigate(`/discover?q=${encodeURIComponent(item.q)}`)}
                    className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-850 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 transition cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/discover"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-lg shadow-emerald-800/20 hover:shadow-emerald-800/30 transition flex items-center justify-center gap-2"
              >
                <span>Find Food Near You</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/donate"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl text-sm font-semibold text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 shadow-xs transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Donate with AI Assistant</span>
              </Link>
            </div>

            {/* Quick trust proofs */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified NGO Partners (80G / 12A)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Secure 6-Digit Pickup PINs
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Free for Rescuers & Shelters
              </span>
            </div>
          </div>

          {/* Platform Live Impact Stats Grid */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-3xl bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-xl">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/40 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 block font-serif">
                {impactStats.totalMealsRescued.toLocaleString()}+
              </span>
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-1 block">
                Meals Rescued
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/40 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 block font-serif">
                {impactStats.totalKgCO2Saved.toLocaleString()} kg
              </span>
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-1 block">
                Food Saved from Waste
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/40 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 block font-serif">
                {impactStats.totalDonors}+
              </span>
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-1 block">
                Active Kitchen Donors
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/40 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 block font-serif">
                2,850+
              </span>
              <span className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-1 block">
                People Helped Across Jaipur
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Live Available Listings */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              <Flame className="w-4 h-4 text-amber-500" />
              Live Feed
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Surplus Food Available Now
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Prepared dishes, bakery goods, and organic produce waiting for pickup.
            </p>
          </div>

          <Link
            to="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition"
          >
            <span>View All Active Listings ({featuredListings.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map(listing => (
              <FoodCard
                key={listing.id}
                listing={listing}
                onRequestClick={handleRequestClick}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <p className="text-sm text-stone-500">Checking for live food posts...</p>
          </div>
        )}
      </section>

      {/* How It Works 4-Step Process */}
      <section className="py-20 bg-stone-100/60 dark:bg-stone-900/40 border-y border-stone-200/70 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Simple & Impactful
            </span>
            <h2 className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
              How ShareBite Works
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
              From leftover catered platters to warm meals distributed with dignified verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-emerald-800 dark:text-emerald-300 mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-2">
                Post with AI Assistant
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Describe your leftovers in one sentence. ShareBite AI auto-fills food category, portion estimates, and safe temperature deadlines.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center font-bold text-amber-800 dark:text-amber-300 mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-2">
                Nearby Alert & Request
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Registered non-profits and community members within proximity receive alerts and request the exact portions needed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm relative">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-800 dark:text-blue-300 mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-2">
                Secure PIN Pickup
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Recipient receives a unique 6-digit PIN. The donor confirms the code on handoff to ensure orderly, safe distribution.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm relative">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center font-bold text-rose-800 dark:text-rose-300 mb-4">
                4
              </div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-2">
                CO2 Saved & Tracked
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Both donor and recipient track certified carbon savings and meals provided directly on their live ESG dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Carbon & Meal Impact Calculator */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-emerald-900 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-emerald-700/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Sustainability Calculator
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif mt-2">
              See the direct impact of your surplus food
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-2">
              If your kitchen or event prevents food waste, here is what gets saved every month:
            </p>

            {/* Slider */}
            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Surplus meals per week:</span>
                <span className="text-2xl font-bold font-mono text-emerald-300">
                  {calculatorMeals} meals / wk
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={calculatorMeals}
                onChange={e => setCalculatorMeals(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-emerald-950 rounded-lg"
              />
              <div className="flex justify-between text-xs text-emerald-300/70">
                <span>Small Cafe (5 meals)</span>
                <span>Large Banquet (200 meals)</span>
              </div>
            </div>

            {/* Metrics Output */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800">
                <span className="text-xs text-emerald-300 block">Monthly Meals Rescued</span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {(calculatorMeals * 4.3).toFixed(0)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800">
                <span className="text-xs text-emerald-300 block">Monthly CO2 Prevented</span>
                <span className="text-2xl font-bold text-emerald-300 mt-1 block">
                  {((calculatorMeals * 4.3) * 2.5).toFixed(0)} kg
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800">
                <span className="text-xs text-emerald-300 block">Community Value</span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹{Math.round((calculatorMeals * 4.3) * 650).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/donate"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-emerald-950 bg-white hover:bg-emerald-50 transition shadow-lg"
              >
                <span>Start Donating Now with AI</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Charities Callout */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-200/70 dark:border-stone-850 w-full text-center">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
          Trusted by Community Food Banks & Non-Profits
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
          Every verified organization undergoes credential checks (FSSAI/80G compliance) to ensure strict food handling and swift redistribution.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 opacity-80 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Jaipur Food Bank</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold text-sm">
            <HeartHandshake className="w-5 h-5 text-rose-600" />
            <span>Robin Hood Army (Jaipur)</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold text-sm">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span>Annapurna Seva Trust</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Seva Kitchen</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-stone-100/60 dark:bg-stone-900/40 border-t border-stone-200/70 dark:border-stone-850 w-full scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Us & Support</span>
            </div>
            <h2 className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
              Get in Touch with ShareBite
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
              Whether you have surplus banquet food to donate, represent a local charity seeking meals, or need direct assistance, our team is active 7 days a week.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left Column: Direct Coordinates */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 font-serif">
                  Food Recovery Coordinates
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block">Phone & WhatsApp Hotline</span>
                      <a href="tel:+916267779361" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
                        +91 62677 79361
                      </a>
                      <span className="text-[11px] text-stone-500 block">Daily 8:00 AM – 10:00 PM IST</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block">Email Support</span>
                      <a href="mailto:lakshitameena210@gmail.com" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
                        lakshitameena210@gmail.com
                      </a>
                      <span className="text-[11px] text-stone-500 block">Replies within 24 hours</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block">Jaipur Coordination Hub</span>
                      <span className="text-stone-600 dark:text-stone-400 leading-tight block">
                        C-Scheme & MI Road, Jaipur, Rajasthan 302001
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quick Email Popup</span>
                  </button>
                  <Link
                    to="/contact"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-center transition"
                  >
                    View FAQs & Full Contact Page →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Contact Form */}
            <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl">
              <h3 className="font-bold text-lg font-serif text-stone-900 dark:text-stone-100 mb-1">
                Send a Message
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-5">
                Leave your inquiry below. Our team reviews submissions throughout the day.
              </p>

              {contactSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                    Message Sent Successfully!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto">
                    Thank you for reaching out. Our coordinator will contact you via email or phone shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSubmitted(false)}
                    className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Ramesh Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Phone / WhatsApp (optional)</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">I am a...</label>
                      <select
                        value={contactCategory}
                        onChange={(e) => setContactCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                      >
                        <option value="Restaurant / Business Food Donor">Restaurant / Business Food Donor</option>
                        <option value="Registered NGO / Shelter Partner">Registered NGO / Shelter Partner</option>
                        <option value="Volunteer / Food Rescue Rider">Volunteer / Food Rescue Rider</option>
                        <option value="Community Member / General Question">Community Member / General Question</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Your Message *</label>
                    <textarea
                      required
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="How can we help? Tell us about your food surplus, volunteer availability, or inquiry..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-500">🔒 Confidential community coordination.</span>
                    <button
                      type="submit"
                      disabled={isContactSubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isContactSubmitting ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Request Modal */}
      <RequestModal
        listing={selectedListing}
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedListing(null);
        }}
        onSuccess={() => {
          navigate('/dashboard');
        }}
      />

      {/* Email Support Modal */}
      <EmailSupportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
};
