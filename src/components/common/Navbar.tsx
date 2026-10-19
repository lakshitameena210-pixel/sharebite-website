import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Leaf,
  PlusCircle,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  ChevronDown,
  LayoutDashboard,
  HeartHandshake,
  Check,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../modals/AuthModal';

export const Navbar: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isDarkMode,
    toggleDarkMode,
    logout,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/discover?q=${encodeURIComponent(navSearch.trim())}`);
      setMobileMenuOpen(false);
    } else {
      navigate('/discover');
      setMobileMenuOpen(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-800/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-serif">
                Share<span className="text-emerald-700 dark:text-emerald-400">Bite</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-600 dark:text-stone-400 -mt-1">
                Zero Waste Food
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/discover"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                location.pathname === '/discover'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
              }`}
            >
              Discover Food
            </Link>
            <Link
              to="/organizations"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                location.pathname === '/organizations'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
              }`}
            >
              Verified Charities
            </Link>
            <Link
              to="/contact"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                location.pathname === '/contact'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
              }`}
            >
              Contact
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  location.pathname === '/dashboard'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
                }`}
              >
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/admin'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Desktop Search Bar */}
          <form onSubmit={handleNavSearchSubmit} className="hidden lg:flex items-center relative w-44 xl:w-56 mx-2">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search food..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-750 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition"
            />
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            {/* Dark Mode Switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* Post Food CTA */}
            <Link
              to="/donate"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Donate Food</span>
            </Link>

            {/* Notifications Menu */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-stone-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          Notifications
                        </h4>
                        {unreadCount > 0 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/80">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-stone-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifs(false);
                            }}
                            className={`p-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition flex items-start gap-3 ${
                              !n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-emerald-500 opacity-80" />
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                                {n.title}
                              </h5>
                              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-stone-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Menu or Auth Button */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition border border-stone-200/60 dark:border-stone-800"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="hidden sm:inline-block text-xs font-medium text-stone-800 dark:text-stone-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 capitalize">
                        {user.role} {user.organizationDetails?.isVerified ? '• Verified NGO' : ''}
                      </p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-stone-400" />
                      <span>My Dashboard</span>
                    </Link>

                    <Link
                      to="/donate"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition sm:hidden"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      <span>Donate Food</span>
                    </Link>

                    <Link
                      to="/organizations"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    >
                      <HeartHandshake className="w-4 h-4 text-stone-400" />
                      <span>Charity Network</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition font-medium"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="border-t border-stone-100 dark:border-stone-800 my-1"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition"
                >
                  Join Free
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl md:hidden text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 dark:border-stone-800 px-4 py-4 space-y-2 bg-white dark:bg-stone-950 animate-in slide-in-from-top-2">
            {/* Mobile Search Bar */}
            <form onSubmit={handleNavSearchSubmit} className="relative mb-3">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search food (e.g. roti, paneer, veggies)..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-750 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </form>

            <Link
              to="/discover"
              className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Discover Food
            </Link>
            <Link
              to="/donate"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
            >
              + Donate Surplus Food (AI Assistant)
            </Link>
            <Link
              to="/organizations"
              className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Verified Charities & Food Banks
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Contact & Support Desk
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-xl text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                My Dashboard & Tracking
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-400"
              >
                Admin Console
              </Link>
            )}

            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
                <span>Display Theme</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </span>
            </button>

            {!isAuthenticated && (
              <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('login');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuth('register');
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
                >
                  Join Free
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};
