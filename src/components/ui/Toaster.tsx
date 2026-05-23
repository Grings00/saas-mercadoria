"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
};

const styles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const iconStyles = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-amber-500",
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    (window as { __toast?: (type: ToastType, message: string) => void }).__toast = toast;
  }, [toast]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-bottom-2",
              styles[t.type]
            )}
          >
            <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", iconStyles[t.type])} />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function toast(type: ToastType, message: string) {
  const fn = (window as { __toast?: (type: ToastType, message: string) => void }).__toast;
  if (fn) fn(type, message);
}
