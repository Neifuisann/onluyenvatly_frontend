import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          const user = await authApi.checkAuth();
          set({ user, isLoading: false });
        } catch (error) {
          set({ user: null, isLoading: false });
          // Don't set error for 401, as it's expected when not logged in
          if ((error as any)?.response?.status !== 401) {
            set({ error: 'Failed to check authentication' });
          }
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await authApi.logout();
          set({ user: null, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to logout', isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user data
    }
  )
);