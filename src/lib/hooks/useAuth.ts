import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginCredentials, RegisterData } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth';
import { EncryptionService } from '@/lib/crypto/encryption';
import { clearCsrfToken } from '@/lib/api/client';

export function useAdminLogin() {
  const router = useRouter();
  const { setUser, setError } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.adminLogin(credentials),
    onSuccess: async (data) => {
      setUser(data.user);
      // Initialize encryption after successful login (optional)
      try {
        await EncryptionService.initializeEncryption();
      } catch (error) {
        console.warn('Encryption initialization failed, continuing without encryption:', error);
      }
      router.push('/admin');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
    },
  });
}

export function useStudentLogin() {
  const router = useRouter();
  const { setUser, setError } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.studentLogin(credentials),
    onSuccess: async (data) => {
      setUser(data.user);
      // Initialize encryption after successful login (optional)
      try {
        await EncryptionService.initializeEncryption();
      } catch (error) {
        console.warn('Encryption initialization failed, continuing without encryption:', error);
      }
      // Don't redirect here - let the component handle it
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
    },
  });
}

export function useStudentRegister() {
  const router = useRouter();
  const { setUser, setError } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.studentRegister(data),
    onSuccess: async (data) => {
      setUser(data.user);
      // Initialize encryption after successful registration
      await EncryptionService.initializeEncryption();
      router.push('/lessons');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
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
      // Clear all client-side state first
      EncryptionService.clearKey();
      clearCsrfToken();

      // Clear localStorage manually before logout call
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
      }

      // Skip API call since we already called it above
      await logout(true);

      // Small delay to ensure state is cleared before redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use window.location.href to ensure full page reload and clear all state
      window.location.href = '/';
    },
    onError: async () => {
      // Even if logout API fails, clear local state
      EncryptionService.clearKey();
      clearCsrfToken();

      // Clear localStorage manually
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
      }

      await logout(true);

      // Small delay to ensure state is cleared before redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      window.location.href = '/';
    },
  });
}