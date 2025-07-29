"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning";
  duration?: number;
  onClose?: () => void;
}

const toastVariants = {
  default: "border-border bg-background text-foreground",
  success: "border-green-500/20 bg-green-500/10 text-green-600",
  error: "border-red-500/20 bg-red-500/10 text-red-600",
  warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
};

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    { id, title, description, action, variant = "default", onClose, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto relative flex w-full max-w-md gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
          toastVariants[variant],
        )}
        {...props}
      >
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        {action}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
Toast.displayName = "Toast";

export interface ToastViewportProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const ToastViewport = React.forwardRef<
  HTMLDivElement,
  ToastViewportProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-md",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

export interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined,
);

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
