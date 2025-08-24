import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ToastContext,
  type ToastContextValue,
  type ToastItem,
  type ToastVariant,
} from './ToastContext';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const show = useCallback(
    (
      message: string,
      options?: { variant?: ToastVariant; duration?: number }
    ) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const variant: ToastVariant = options?.variant || 'info';
      const duration = options?.duration ?? 3000;
      const item: ToastItem = { id, message, variant, duration };
      setToasts(prev => [...prev, item]);
      timersRef.current[id] = setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m, d) => show(m, { variant: 'success', duration: d }),
      error: (m, d) => show(m, { variant: 'error', duration: d }),
      info: (m, d) => show(m, { variant: 'info', duration: d }),
      warning: (m, d) => show(m, { variant: 'warning', duration: d }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] space-y-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast min-w-[260px] max-w-[420px] rounded-lg shadow-lg px-4 py-3 text-sm flex items-start gap-3
              ${
                t.variant === 'success'
                  ? 'bg-green-600 text-white'
                  : t.variant === 'error'
                  ? 'bg-red-600 text-white'
                  : t.variant === 'warning'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-900 text-white'
              }
            `}
            role="alert"
            data-testid="toast"
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="ml-2 shrink-0 opacity-80 hover:opacity-100"
              aria-label="닫기"
              data-testid="dismiss-toast"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
