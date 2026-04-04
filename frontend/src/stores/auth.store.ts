import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';

// ---------------------------------------------------------------------------
// State + Actions
// ---------------------------------------------------------------------------

interface AuthState {
  /** Populated after login or /auth/me verification */
  user: User | null;
  /**
   * Optimistic flag from localStorage — used to skip the login redirect on
   * first render while /auth/me is loading.
   * Ground truth is always the httpOnly cookie on the server.
   */
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'pp-auth',
      // Only persist display info — never the token (that's in httpOnly cookie)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors — stable references prevent unnecessary re-renders
// ---------------------------------------------------------------------------

export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsSuperuser = () => useAuthStore((s) => s.user?.is_superuser ?? false);
export const useUserRole = () => useAuthStore((s) => s.user?.role ?? null);
