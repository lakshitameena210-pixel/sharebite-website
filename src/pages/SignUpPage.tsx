import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  X,
  Sparkles,
  User,
  Building,
  Heart,
  Leaf,
  ShieldCheck,
  Lock,
  AlertCircle,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

interface SignUpPageProps {
  defaultMode?: 'login' | 'register';
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ defaultMode = 'register' }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isSignInPath =
    location.pathname === '/login' ||
    location.pathname === '/signin' ||
    location.pathname === '/sign-in' ||
    searchParams.get('mode') === 'login' ||
    defaultMode === 'login';

  const [mode, setMode] = useState<'login' | 'register'>(
    isSignInPath ? 'login' : 'register'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('donor');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, register, demoLogin, logout, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  // Sync mode whenever URL or path changes
  useEffect(() => {
    const isLogin =
      location.pathname === '/login' ||
      location.pathname === '/signin' ||
      location.pathname === '/sign-in' ||
      searchParams.get('mode') === 'login' ||
      defaultMode === 'login';
    setMode(isLogin ? 'login' : 'register');
    setErrorMessage(null);
  }, [location.pathname, searchParams, defaultMode]);

  // Handle closing this tab / window
  const handleCloseTab = () => {
    // 1. Try closing window if opened in separate tab/window
    try {
      window.close();
    } catch {
      // browser security may prevent window.close()
    }

    // 2. Fallback to navigating back in history or returning to home
    setTimeout(() => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }, 50);
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseTab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          phone: phone.trim(),
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(
        err.message || (mode === 'login' ? 'Invalid email or password. Please try again.' : 'Registration failed.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSelect = async (demoRole: UserRole) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await demoLogin(demoRole);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with demo account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill demo credentials helper
  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="max-w-xl mx-auto w-full">
        {/* If already authenticated, show friendly banner without blocking the sign in page */}
        {isAuthenticated && user && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-stone-800 dark:text-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                Already signed in as {user.name}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 capitalize">
                {user.email} • Role: {user.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Account</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8">
          {/* Header with Title and Close Tab Option on Top Right Corner */}
          <div className="flex items-start justify-between pb-5 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md">
                <Leaf className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                  {mode === 'login' ? 'Sign In to ShareBite' : 'Join ShareBite'}
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {mode === 'login'
                    ? 'Enter your email and password or use 1-click demo to sign in'
                    : 'Create a free account to donate or rescue surplus food'}
                </p>
              </div>
            </div>

            {/* Closing Tab Option on Top Right Corner */}
            <button
              type="button"
              onClick={handleCloseTab}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition cursor-pointer"
              title="Close Tab (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Close Tab</span>
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1 p-1 my-5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1-Click Fast Demo Accounts */}
          <div className="mb-6 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 1-Click Instant Demo Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoSelect('donor')}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-2 cursor-pointer"
              >
                <Building className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="block font-semibold">Restaurant Donor</span>
                  <span className="text-[10px] text-stone-400 block">greenleaf@sharebite.org</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('organization')}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-rose-600" />
                <div>
                  <span className="block font-semibold">Verified NGO</span>
                  <span className="text-[10px] text-stone-400 block">robinhood.jaipur@ngo.org</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('recipient')}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="block font-semibold">Community User</span>
                  <span className="text-[10px] text-stone-400 block">rahul.sharma@example.in</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSelect('admin')}
                className="py-2 px-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="block font-semibold">Platform Admin</span>
                  <span className="text-[10px] text-stone-400 block">admin@sharebite.org</span>
                </div>
              </button>
            </div>

            {mode === 'login' && (
              <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                <span>Or autofill credentials to test form:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('greenleaf@sharebite.org', 'donor123')}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  Fill Sample Login
                </button>
              </div>
            )}
          </div>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-stone-800"></div>
            </div>
            <span className="relative px-3 bg-white dark:bg-stone-900 text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Or continue with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Full Name / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Maya Lin / Sunrise Cafe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    I want to primarily:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('donor')}
                      className={`py-2 px-2 text-xs rounded-xl font-medium border text-center transition cursor-pointer ${
                        role === 'donor'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Donate Food
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('recipient')}
                      className={`py-2 px-2 text-xs rounded-xl font-medium border text-center transition cursor-pointer ${
                        role === 'recipient'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Rescue Food
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('organization')}
                      className={`py-2 px-2 text-xs rounded-xl font-medium border text-center transition cursor-pointer ${
                        role === 'organization'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Non-Profit NGO
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                {mode === 'login' ? 'Username or Email Address *' : 'Email Address *'}
              </label>
              <input
                type={mode === 'login' ? 'text' : 'email'}
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'login' ? 'e.g. lakshita, greenleaf@sharebite.org, or admin' : 'you@example.com'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Password *
                </label>
                {mode === 'login' && (
                  <span className="text-[10px] text-stone-400">Demo password: donor123</span>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl font-semibold text-xs text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : mode === 'register'
                    ? 'Create Free Account'
                    : 'Sign In to Account'}
                </span>
              </button>
            </div>
          </form>

          {/* Footer toggle */}
          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMessage(null);
              }}
              className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Bottom Trust Note */}
        <div className="mt-6 text-center text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Non-Profit Support • Secure End-to-End Food Tracking</span>
        </div>
      </div>

      <div />
    </div>
  );
};
