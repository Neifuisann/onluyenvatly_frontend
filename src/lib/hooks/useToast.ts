"use client";

import { create } from "zustand";
import { ToastProps } from "@/components/ui/toast";

interface ToastStore {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  removeAllToasts: () => {
    set({ toasts: [] });
  },
}));

/**
 * Hook to show toast notifications
 */
export function useToast() {
  const { addToast, removeToast, removeAllToasts } = useToastStore();

  const toast = (options: Omit<ToastProps, "id"> | string) => {
    if (typeof options === "string") {
      addToast({ description: options });
    } else {
      addToast(options);
    }
  };

  const success = (message: string, title?: string) => {
    addToast({
      variant: "success",
      title,
      description: message,
    });
  };

  const error = (message: string, title?: string) => {
    addToast({
      variant: "error",
      title: title || "Lỗi",
      description: message,
    });
  };

  const warning = (message: string, title?: string) => {
    addToast({
      variant: "warning",
      title,
      description: message,
    });
  };

  return {
    toast,
    success,
    error,
    warning,
    dismiss: removeToast,
  };
}
