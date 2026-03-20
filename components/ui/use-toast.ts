import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

let toastCallbacks: ((toast: Toast) => void)[] = [];

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);
    
    // 自动移除
    const duration = toast.duration || 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// 全局 Toast 方法
export const toast = {
  success: (message: string, title?: string) => {
    toastCallbacks.forEach((cb) => cb({ id: '', type: 'success', title, message }));
  },
  error: (message: string, title?: string) => {
    toastCallbacks.forEach((cb) => cb({ id: '', type: 'error', title, message }));
  },
  warning: (message: string, title?: string) => {
    toastCallbacks.forEach((cb) => cb({ id: '', type: 'warning', title, message }));
  },
  info: (message: string, title?: string) => {
    toastCallbacks.forEach((cb) => cb({ id: '', type: 'info', title, message }));
  },
};

export function registerToastCallback(callback: (toast: Toast) => void) {
  toastCallbacks.push(callback);
  return () => {
    toastCallbacks = toastCallbacks.filter((cb) => cb !== callback);
  };
}
