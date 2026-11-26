import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, Bell } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info' | 'approval';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  approval: Bell,
};

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'border-emerald-500/40', icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  warning: { border: 'border-amber-500/40', icon: 'text-amber-400', bg: 'bg-amber-500/10' },
  info: { border: 'border-sky-500/40', icon: 'text-sky-400', bg: 'bg-sky-500/10' },
  approval: { border: 'border-[#fa4616]/50', icon: 'text-[#fa4616]', bg: 'bg-[#fa4616]/10' },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const Icon = ICONS[toast.type];
  const c = COLORS[toast.type];

  return (
    <div
      className={`flex items-start gap-3 w-80 px-4 py-3 rounded-xl bg-[#0d0d0d] border ${c.border} shadow-2xl shadow-black/60 backdrop-blur-md animate-toast-in`}
      role="alert"
      aria-live="polite"
    >
      <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${c.bg}`}>
        <Icon className={`w-4 h-4 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{toast.title}</p>
        {toast.message && (
          <p className="text-[11px] text-slate-400 font-mono mt-0.5 leading-snug line-clamp-2">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.duration ?? 5000;
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]); // cap at 5 toasts
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Stack — fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
