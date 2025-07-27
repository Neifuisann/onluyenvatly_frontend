import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, LoginCredentials, RegisterData } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth";
import { clearCsrfToken } from "@/lib/api/client";
import { extractErrorMessage } from "@/lib/utils/errorHandler";
import { EncryptionService } from "@/lib/services/encryption";

export function useAuth() {
  const { user, isLoading, error } = useAuthStore();
  return { user, isLoading, error };
}

export function useAdminLogin() {
  const router = useRouter();
  const { setUser, setError } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authApi.adminLogin(credentials),
    onSuccess: async (data) => {
      setUser(data.user);
      // Initialize encryption after successful login (optional)
      try {
        await EncryptionService.initializeEncryption();
      } catch (error) {
        console.warn(
          "Encryption initialization failed, continuing without encryption:",
          error,
        );
      }
      router.push("/admin");
    },
    onError: (error) => {
      const message = extractErrorMessage(error);
      setError(message);
    },
  });
}

export function useStudentLogin() {
  const router = useRouter();
  const { setUser, setError } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authApi.studentLogin(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      router.push("/lessons");
    },
    onError: (error) => {
      const message = extractErrorMessage(error);
      setError(message);
    },
  });
}

export function useStudentRegister() {
  const router = useRouter();
  const { setUser, setError } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.studentRegister(data),
    onSuccess: (data) => {
      setUser(data.user);
      router.push("/lessons");
    },
    onError: (error) => {
      const message = extractErrorMessage(error);
      setError(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      await logout(true);
      clearCsrfToken();
      router.push("/");
    },
    onError: async (error) => {
      // Even if logout fails on server, clear local state
      await logout(true);
      clearCsrfToken();
      router.push("/");
    },
  });
}
