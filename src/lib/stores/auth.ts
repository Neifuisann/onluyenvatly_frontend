import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  logout: (skipApiCall?: boolean) => Promise<void>;
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

      logout: async (skipApiCall = false) => {
        try {
          set({ isLoading: true, error: null });

          // Only call API if not skipping (to avoid double calls)
          if (!skipApiCall) {
            await authApi.logout();
          }

          // Clear all auth state
          set({
            user: null,
            isLoading: false,
            error: null
          });

          // Manually clear localStorage after state update
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
            sessionStorage.removeItem('auth-storage');
          }

        } catch (error) {
          // Even if API call fails, clear local state
          set({
            user: null,
            isLoading: false,
            error: 'Logout completed with errors'
          });

          // Manually clear localStorage even on error
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
            sessionStorage.removeItem('auth-storage');
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user data
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item;
        },
        setItem: (name, value) => {
          // Don't persist if user is null (logged out)
          const parsed = JSON.parse(value);
          if (parsed?.state?.user === null) {
            localStorage.removeItem(name);
            return;
          }
          localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      })),
    }
  )
);