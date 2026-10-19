import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart, ShieldCheck, Globe, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
                <Leaf className="w-5 h-5 text-emerald-200" />
              </div>
              <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-serif">
                Share<span className="text-emerald-700 dark:text-emerald-400">Bite</span>
              </span>
            </Link>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Empowering restaurants, caterers, and bakeries to channel surplus food directly to verified charities, community shelters, and neighbors before it expires.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              UN Sustainable Development Goal #12.3
            </div>
          </div>

          {/* Rescue & Donate */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
              Food Rescue
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li>
                <Link to="/discover" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                  Browse Available Food
                </Link>
              </li>
              <li>
                <Link to="/discover?priority=Urgent" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                  Urgent Expiring Feeds
                </Link>
              </li>
              <li>
                <Link to="/donate" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition flex items-center gap-1">
                  ShareBite AI Donor Assistant <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                </Link>
              </li>
              <li>
                <Link to="/organizations" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                  Charity & Shelter Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Impact & Transparency */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200">
              Impact & Trust
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified 501(c)(3) Partner Badge</span>
              </li>
              <li>Food Safety & Thermal Standards</li>
              <li>6-Digit Pickup PIN Security</li>
              <li>
                <Link to="/contact" className="hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  Contact Us & Support <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Mission Note */}
          <div className="space-y-3 p-5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-200 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Community Food Network
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Every day, over 30% of edible food is wasted while thousands go hungry. ShareBite closes this gap within minutes through AI-assisted matching and neighborhood proximity.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} ShareBite Initiative. Open sustainability platform.</p>
          <div className="flex items-center gap-4">
            <span>Clean Architecture</span>
            <span>•</span>
            <span>REST API Ready</span>
            <span>•</span>
            <span>Gemini AI Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
