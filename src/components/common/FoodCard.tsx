import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, CheckCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { FoodListing } from '../../types';
import { CountdownTimer } from './CountdownTimer';

interface FoodCardProps {
  listing: FoodListing;
  onRequestClick?: (listing: FoodListing) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ listing, onRequestClick }) => {
  const isAvailable = listing.status === 'available';
  const isRequested = listing.status === 'requested';
  const isExpired = listing.status === 'expired';
  const isCollected = listing.status === 'collected';

  return (
    <div className="group relative flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-xl hover:border-emerald-600/30 transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-stone-900/95 text-stone-800 dark:text-stone-200 backdrop-blur-md shadow-sm border border-stone-200/50 dark:border-stone-700/50">
            {listing.category}
          </span>

          <CountdownTimer expiryDate={listing.expiryDate} />
        </div>

        {/* Priority Banner if Urgent */}
        {listing.rescuePriority === 'Urgent' && isAvailable && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-stone-950 shadow-md">
              <Sparkles className="w-3 h-3" /> Urgent Rescue
            </span>
          </div>
        )}

        {/* Status Overlays */}
        {isCollected && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-600 text-white shadow-lg">
              <CheckCircle className="w-4 h-4" /> Rescued & Collected
            </span>
          </div>
        )}
        {isExpired && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold bg-rose-600 text-white shadow-lg">
              Expired
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <Link to={`/food/${listing.id}`}>
          <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors line-clamp-1">
            {listing.title}
          </h3>
        </Link>

        {/* Description snippet */}
        <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>

        {/* Key Stats Bar */}
        <div className="mt-3.5 flex items-center gap-3 text-xs text-stone-700 dark:text-stone-300 font-medium py-2 px-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {listing.quantity} {listing.unit}
            </span>
          </div>
          <span className="text-stone-300 dark:text-stone-700">•</span>
          <div className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            <span>Serving Size: ~{listing.estimatedServings} plates</span>
          </div>
        </div>

        {/* Dietary Tags */}
        {listing.dietaryTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.dietaryTags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40"
              >
                {tag}
              </span>
            ))}
            {listing.dietaryTags.length > 3 && (
              <span className="inline-block px-1.5 py-0.5 text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                +{listing.dietaryTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="mt-auto pt-4 flex flex-col gap-3">
          {/* Donor & Location */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800/80 pt-3">
            <div className="flex items-center gap-2">
              <img
                src={listing.donorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(listing.donorName)}`}
                alt={listing.donorName}
                className="w-5 h-5 rounded-full object-cover border border-stone-200 dark:border-stone-700"
              />
              <span className="truncate max-w-[120px] font-medium text-stone-700 dark:text-stone-300">
                {listing.donorOrgName || listing.donorName}
              </span>
              {listing.donorOrgName && (
                <span title="Verified Organization" className="inline-flex">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] truncate max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">
                {listing.distanceKm ? `${listing.distanceKm} km away · ` : ''}
                {listing.pickupAddress ? listing.pickupAddress.split(',').slice(-1)[0]?.trim() || listing.city.split(',')[0] : listing.city.split(',')[0]}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-2">
            <Link
              to={`/food/${listing.id}`}
              className="flex-1 py-2 px-3 text-center rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            >
              Details
            </Link>

            {isAvailable ? (
              <button
                onClick={() => onRequestClick ? onRequestClick(listing) : undefined}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs transition"
              >
                <span>Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : isRequested ? (
              <span className="flex-1 inline-flex items-center justify-center py-2 px-3 rounded-xl text-xs font-medium text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                Requested
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
