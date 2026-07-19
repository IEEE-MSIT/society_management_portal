import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/85 border-rose-500/30 text-rose-200'
                : 'bg-indigo-950/85 border-indigo-500/30 text-indigo-200'
            }`}
          >
            <div className="flex gap-2.5">
              <span className="mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle size={18} className="text-rose-400" />}
                {toast.type === 'info' && <Info size={18} className="text-indigo-400" />}
              </span>
              <p className="text-sm font-medium leading-5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
