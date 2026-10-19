import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  ArrowLeft,
  Share2,
  AlertTriangle,
  Leaf,
  Sparkles,
  Phone,
  Mail,
  HeartHandshake,
  CheckCircle,
} from 'lucide-react';
import { FoodListing, User } from '../types';
import { api } from '../services/api';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { RequestModal } from '../components/modals/RequestModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const FoodDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<FoodListing | null>(null);
  const [donor, setDonor] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchDetails = () => {
    if (!id) return;
    setIsLoading(true);
    api.getListingById(id)
      .then(res => {
        setListing(res.listing);
        setDonor(res.donor);
      })
      .catch(err => {
        showToast(err.message || 'Failed to load food details', 'error');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        text: `Surplus food rescue on ShareBite: ${listing?.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Listing link copied to clipboard!', 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold font-serif mb-2">Food Listing Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">This post may have been rescued or removed.</p>
        <Link
          to="/discover"
          className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-emerald-700"
        >
          Back to Available Food
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.donorId;
  const isAvailable = listing.status === 'available';

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discovery Feed</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Listing</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl overflow-hidden">
          {/* Main Photo Banner */}
          <div className="relative aspect-[21/9] sm:aspect-[21/8] w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/95 dark:bg-stone-950/95 text-stone-900 dark:text-stone-100 backdrop-blur-md shadow-md border border-stone-200/60 dark:border-stone-800">
                {listing.category}
              </span>
              <CountdownTimer expiryDate={listing.expiryDate} className="text-sm shadow-md" />
            </div>

            {listing.status === 'collected' && (
              <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold bg-emerald-600 text-white shadow-xl">
                  <CheckCircle className="w-5 h-5" /> Food Rescued & Collected
                </span>
              </div>
            )}
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-10 space-y-8">
            {/* Title & Key Metrics */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-stone-100 dark:border-stone-800">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.rescuePriority === 'Urgent' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-stone-950 shadow-xs">
                      <Sparkles className="w-3 h-3" /> Urgent Rescue
                    </span>
                  )}
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    Posted {new Date(listing.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
                  {listing.title}
                </h1>

                {/* Dietary Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {listing.dietaryTags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Box */}
              <div className="w-full md:w-72 shrink-0 p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-750 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 dark:text-stone-400">Available</span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                    {listing.quantity} {listing.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 dark:text-stone-400">Feeds approx</span>
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    ~{listing.estimatedServings} people
                  </span>
                </div>

                {isOwner ? (
                  <div className="p-2.5 rounded-xl bg-stone-200/60 dark:bg-stone-800 text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
                    This is your listing
                  </div>
                ) : isAvailable ? (
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Request Food</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-center text-xs text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
                    Status: {listing.status.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Description & Food Safety */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200 mb-2 font-serif">
                    About This Food
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>

                {/* Storage Guidance */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Food Safety & Handling Instructions</span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    {listing.storageInstructions || 'Transport in temperature-safe containers. Reheat thoroughly to 74°C (165°F) before distribution if cooked.'}
                  </p>
                </div>

                {/* Pickup Window */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-200">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Pickup Window</span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                    {listing.pickupTimeWindow}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Please coordinate arrival within this timeframe to ensure staff is on-site.
                  </p>
                </div>
              </div>

              {/* Sidebar: Donor & Location */}
              <div className="space-y-6">
                {/* Donor Profile Card */}
                <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Donated By
                  </h4>
                  <div className="flex items-center gap-3">
                    <img
                      src={listing.donorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(listing.donorName)}`}
                      alt={listing.donorName}
                      className="w-12 h-12 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {listing.donorOrgName || listing.donorName}
                        </h5>
                        {listing.donorOrgName && (
                          <span title="Verified Organization" className="inline-flex">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">
                        {listing.donorName}
                      </p>
                    </div>
                  </div>

                  {donor?.organizationDetails?.mission && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 italic border-l-2 border-emerald-600 pl-2.5">
                      "{donor.organizationDetails.mission}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-750 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                    <span>Lifetime impact:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {donor?.mealsRescued || 320} meals rescued
                    </span>
                  </div>
                </div>

                {/* Pickup Location Card */}
                <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Location
                  </h4>
                  <div className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{listing.pickupAddress}</p>
                      <p className="text-stone-500 mt-0.5">{listing.city}</p>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.pickupAddress + ', ' + listing.city)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 transition"
                  >
                    Open in Maps & Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RequestModal
        listing={listing}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => {
          fetchDetails();
          navigate('/dashboard');
        }}
      />
    </div>
  );
};
