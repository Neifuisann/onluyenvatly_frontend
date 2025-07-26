"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { EncryptionService } from "@/lib/crypto/encryption";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, user } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Initialize encryption if user is logged in
    if (user?.isLoggedIn && !EncryptionService.isInitialized()) {
      EncryptionService.initializeEncryption().catch(console.error);
    }
  }, [user]);

  return <>{children}</>;
}
