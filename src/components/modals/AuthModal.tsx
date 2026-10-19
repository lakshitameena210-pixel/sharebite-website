import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, Building, Heart, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('donor');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, register, demoLogin } = useAuth();

  // Sync mode whenever initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
    }
  }, [isOpen, initialMode]);

  // Handle Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCloseTab = () => {
    try {
      // In case opened as popup tab/window
      window.close();
    } catch {
      // ignore browser restriction
    }
    onClose();
  };

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
      onClose();
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
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to login with demo account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={handleCloseTab}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Title and Close Tab Option on Top Right Corner */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {mode === 'login' ? 'Welcome Back' : 'Join ShareBite'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {mode === 'login' ? 'Sign in to rescue and donate surplus food' : 'Create an account to start eliminating food waste'}
            </p>
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
        <div className="flex items-center gap-1 p-1 mt-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
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
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Fast Logins */}
        <div className="mt-4 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 1-Click Instant Demo Accounts:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoSelect('donor')}
              className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-1.5 cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restaurant Donor</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('organization')}
              className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Verified NGO</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('recipient')}
              className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Community User</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('admin')}
              className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium hover:border-emerald-600 text-stone-800 dark:text-stone-200 text-left transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Platform Admin</span>
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
              <span>Quick test credentials:</span>
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
          <span className="relative px-3 bg-white dark:bg-stone-900 text-[11px] text-stone-400 uppercase tracking-wider">
            Or continue with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Full Name / Organization Name
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300'
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300'
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Non-Profit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {mode === 'login' ? 'Username or Email Address' : 'Email Address'}
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
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Password
            </label>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-2xl font-semibold text-xs text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
