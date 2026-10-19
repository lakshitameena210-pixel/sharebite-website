import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

export const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getOrganizations()
      .then(res => setOrganizations(res.organizations))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Charity Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Our Food Rescue Partners
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
            These verified shelters, pantries, and community kitchens receive prioritized alerts to rescue bulk surplus food within hours of posting.
          </p>
        </div>

        {/* Directory Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-stone-200/60 dark:bg-stone-850 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map(org => (
              <div
                key={org.id}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={org.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(org.name)}`}
                      alt={org.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-stone-200 dark:border-stone-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {org.orgDetails?.orgName || org.name}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-xs text-stone-500">
                        {org.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic border-l-2 border-emerald-600 pl-3">
                    "{org.orgDetails?.mission || 'Providing warm meals and emergency pantry supplies.'}"
                  </p>

                  <div className="space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
                    {org.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{org.address}, {org.city}</span>
                      </div>
                    )}
                    {org.orgDetails?.registrationNumber && (
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-stone-400">Reg:</span>
                        <span>{org.orgDetails.registrationNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Meals Distributed:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {org.mealsRescued.toLocaleString()} meals
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Apply CTA */}
        <div className="mt-16 p-8 rounded-3xl bg-emerald-900 text-white text-center max-w-2xl mx-auto space-y-3">
          <HeartHandshake className="w-8 h-8 text-emerald-300 mx-auto" />
          <h3 className="text-xl font-bold font-serif">Are you a registered non-profit or shelter?</h3>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-md mx-auto">
            Apply to become a Verified Food Partner and unlock priority alerts for high-volume corporate catering rescues.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-emerald-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-50 transition shadow-lg"
            >
              <span>Apply in Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
