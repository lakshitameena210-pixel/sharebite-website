import React, { useState } from 'react';
import { X, Sparkles, MapPin, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { FoodListing } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface RequestModalProps {
  listing: FoodListing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState<number>(listing ? listing.quantity : 1);
  const [pickupTime, setPickupTime] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync default quantity when listing changes
  React.useEffect(() => {
    if (listing) {
      setQuantity(listing.quantity);
      setPickupTime(listing.pickupTimeWindow);
      setMessage(
        user?.organizationDetails?.isVerified
          ? `Hello! We are ${user.organizationDetails.orgName}. We would love to distribute this to our community members today.`
          : `Hello! I would love to pick up this surplus food. I have clean containers/bags ready.`
      );
    }
  }, [listing, user]);

  if (!isOpen || !listing) return null;

  const estimatedMeals = Math.round(quantity * (listing.estimatedServings / (listing.quantity || 1)));
  const estimatedCo2 = Math.round(estimatedMeals * 2.5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to request food', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createRequest({
        foodId: listing.id,
        requestedQuantity: quantity,
        message,
        pickupTime,
      });

      showToast('Request submitted successfully! The donor has been notified.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Request Food Rescue
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Directly from {listing.donorOrgName || listing.donorName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Listing Preview Pill */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-stone-100/70 dark:bg-stone-800/70 border border-stone-200/50 dark:border-stone-700/50">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                {listing.title}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Total available: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{listing.quantity} {listing.unit}</span>
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{listing.pickupAddress}</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Quantity You Can Rescue ({listing.unit})
              </label>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {quantity} of {listing.quantity} {listing.unit}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={listing.quantity}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-stone-400 mt-1">
              <span>1 {listing.unit}</span>
              <span>All ({listing.quantity} {listing.unit})</span>
            </div>
          </div>

          {/* Pickup Window */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Your Estimated Pickup Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
                placeholder="e.g., Today at 3:30 PM"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              Donor's preferred window: {listing.pickupTimeWindow}
            </p>
          </div>

          {/* Note / Message */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Message to Donor
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Introduce yourself, transportation plan, or any special dietary/handling arrangements..."
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Impact Projection Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Estimated Environmental Impact
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2.5">
              <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Meals Provided</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  ~{estimatedMeals} meals
                </span>
              </div>
              <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">CO2 Emissions Saved</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  ~{estimatedCo2} kg CO2
                </span>
              </div>
            </div>
          </div>

          {/* Pickup PIN info */}
          <div className="flex items-start gap-2.5 text-xs text-stone-500 dark:text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Once the donor accepts, a unique 6-digit pickup verification code will appear in your dashboard to show upon collection.
            </p>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Request...' : 'Confirm Food Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
