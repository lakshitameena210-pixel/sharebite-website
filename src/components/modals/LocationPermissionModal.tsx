import React from 'react';
import { ShieldCheck, MapPin, Navigation, Eye, Lock, X } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  isLoading?: boolean;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onAllow,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Live Location Access
            </span>
            <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
              Allow Location for Live Food Rescue?
            </h3>
          </div>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          ShareBite uses your browser's Geolocation API to show you surplus food available closest to you, calculate exact distances and ETAs, and enable live pickup route tracking with donors.
        </p>

        {/* Privacy Safeguards Breakdown */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
            <Eye className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-stone-900 dark:text-stone-100">Who sees your location?</strong>
              <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                Only the verified donor of your accepted food order during an active pickup. Never public or shared with third parties.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-stone-900 dark:text-stone-100">Temporary & Ephemeral:</strong>
              <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                We do not continuously store historical GPS coordinates. Coordinates are purged the moment your food is marked Collected.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-stone-700 dark:text-stone-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-stone-900 dark:text-stone-100">Full Control:</strong>
              <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                You can tap "Stop Sharing Location" at any moment to turn off GPS tracking instantly.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onAllow}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
          >
            <Navigation className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Accessing GPS...' : 'Allow Live Location'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 font-semibold text-xs transition"
          >
            Keep Manual City (Jaipur)
          </button>
        </div>
      </div>
    </div>
  );
};
