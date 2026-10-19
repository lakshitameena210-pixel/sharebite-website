import React, { useState } from 'react';
import { Sparkles, Utensils, HeartHandshake, User, ShieldAlert, RotateCcw, ChevronUp, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export const DemoSwitcher: React.FC = () => {
  const { user, demoLogin, isDarkMode, toggleDarkMode } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await api.resetDemoData();
      showToast('Demo data reloaded to initial state', 'success');
      window.location.reload();
    } catch {
      showToast('Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-40">
      <div className="bg-stone-900/95 dark:bg-stone-900/95 text-stone-100 backdrop-blur-md rounded-2xl border border-stone-800 shadow-2xl overflow-hidden transition-all duration-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold hover:bg-stone-800 transition text-emerald-400"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>Demo Role Switcher</span>
          {user && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
              {user.role}
            </span>
          )}
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-stone-400" /> : <ChevronUp className="w-3.5 h-3.5 text-stone-400" />}
        </button>

        {isOpen && (
          <div className="p-3 border-t border-stone-800 space-y-1.5 min-w-[240px] animate-in fade-in slide-in-from-bottom-2">
            <p className="text-[11px] text-stone-400 mb-2 font-medium">
              Click to instantly switch persona:
            </p>

            <button
              onClick={() => {
                demoLogin('donor');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition ${
                user?.role === 'donor'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'hover:bg-stone-800 text-stone-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <span className="font-semibold block leading-tight">Food Donor</span>
                  <span className="text-[10px] text-stone-400">Green Leaf Pure Veg (Rohit Kulkarni)</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                demoLogin('organization');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition ${
                user?.role === 'organization'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'hover:bg-stone-800 text-stone-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <span className="font-semibold block leading-tight">Verified NGO</span>
                  <span className="text-[10px] text-stone-400">Robin Hood Army (Sneha Deshmukh)</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                demoLogin('recipient');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition ${
                user?.role === 'recipient'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'hover:bg-stone-800 text-stone-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <span className="font-semibold block leading-tight">Community Member</span>
                  <span className="text-[10px] text-stone-400">Rahul Sharma (Mansarovar, Jaipur)</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                demoLogin('admin');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition ${
                user?.role === 'admin'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'hover:bg-stone-800 text-stone-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <span className="font-semibold block leading-tight">Platform Admin</span>
                  <span className="text-[10px] text-stone-400">Ananya Joshi (Operations Admin)</span>
                </div>
              </div>
            </button>

            <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-[10px] text-stone-400 leading-tight">
              🇮🇳 <strong className="text-stone-300">Indian Demo Mode:</strong> Default city is Jaipur, Rajasthan with simulated community data for demonstration.
            </div>

            <div className="pt-2 border-t border-stone-800 mt-2 space-y-1">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between py-1.5 px-2 text-[11px] text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition"
              >
                <div className="flex items-center gap-1.5">
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-400" />}
                  <span>Display Theme:</span>
                </div>
                <span className="font-semibold text-emerald-400">{isDarkMode ? 'Dark' : 'Light'}</span>
              </button>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Seed Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
