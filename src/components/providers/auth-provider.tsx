"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
