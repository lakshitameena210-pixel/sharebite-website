import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          let bgClass = 'bg-emerald-800 text-white border-emerald-700';
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />;

          if (toast.type === 'error') {
            bgClass = 'bg-rose-900 text-white border-rose-800';
            icon = <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-800 text-white border-amber-700';
            icon = <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0" />;
          } else if (toast.type === 'info') {
            bgClass = 'bg-zinc-800 text-white border-zinc-700';
            icon = <Info className="w-5 h-5 text-zinc-300 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${bgClass}`}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium leading-snug">
                {icon}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white transition p-1"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
