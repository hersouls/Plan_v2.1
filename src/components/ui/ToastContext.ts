import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastContextValue {
  show: (
    message: string,
    options?: { variant?: ToastVariant; duration?: number }
  ) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
