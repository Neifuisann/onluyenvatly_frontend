import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginCredentials, RegisterData } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth';
import { EncryptionService } from '@/lib/crypto/encryption';

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
      router.push('/lessons');
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
      await logout();
      EncryptionService.clearKey();
      router.push('/');
    },
  });
}