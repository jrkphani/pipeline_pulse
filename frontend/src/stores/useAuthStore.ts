import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'executive' | 'sales_manager' | 'operations_manager' | 'analyst';
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      token: null,
      
      login: (token: string, user: User) => {
        set({
          isAuthenticated: true,
          isLoading: false,
          user,
          token,
        });
      },
      
      logout: () => {
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
        });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      initializeAuth: () => {
        const { token } = get();
        if (token) {
          // In a real app, you would validate the token with your backend
          // For now, we'll just set loading to false
          set({ isLoading: false });
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);