import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AppNotification } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  notifications: AppNotification[];
  unreadCount: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sharebite_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sharebite_theme') === 'dark';
  });

  const { showToast } = useToast();

  // Handle dark mode classes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sharebite_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sharebite_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      showToast(next ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 'info', 2500);
      return next;
    });
  };

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignored
    }
  }, [token]);

  // Load current user from token on startup
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sharebite_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setUnreadCount(res.unreadNotificationsCount);
          fetchNotifications();
        } catch (err) {
          console.warn('Failed to restore session:', err);
          localStorage.removeItem('sharebite_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto-login default donor for frictionless live preview exploration if desired,
        // or start logged out with simple quick-switch
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchNotifications]);

  // Poll notifications periodically if authenticated
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token, fetchNotifications]);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const res = await api.login({
        email: emailOrUsername,
        username: emailOrUsername,
        password,
      });
      localStorage.setItem('sharebite_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(
        res.isNewUser
          ? `Welcome to ShareBite, ${res.user.name}! Your account is ready.`
          : `Welcome back, ${res.user.name}!`,
        'success'
      );
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.register(data);
      localStorage.setItem('sharebite_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast('Account registered successfully! Welcome to ShareBite.', 'success');
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const demoLogin = async (role: UserRole) => {
    try {
      const res = await api.demoLogin(role);
      localStorage.setItem('sharebite_token', res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Switched account to demo: ${res.user.name} (${role.toUpperCase()})`, 'info');
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to switch demo account', 'error');
    }
  };

  const logout = () => {
    localStorage.removeItem('sharebite_token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    showToast('Logged out safely.', 'info');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignored
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        token,
        notifications,
        unreadCount,
        isDarkMode,
        toggleDarkMode,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
