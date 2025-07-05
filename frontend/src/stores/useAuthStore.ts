import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/apiClient';
import type { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      token: null,
      
      setUser: (user: User | null) => {
        set({ user });
        if (user) {
          set({ isAuthenticated: true, isLoading: false });
        }
      },
      
      setIsAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated, isLoading: false });
        if (!authenticated) {
          set({ user: null, token: null });
        }
      },
      
      setToken: (token: string | null) => {
        set({ token });
        // Update API client token
        apiClient.setToken(token);
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null, 
          token: null, 
          isLoading: false 
        });
        // Clear API client token
        apiClient.setToken(null);
      },
      
      initializeAuth: async () => {
        // Always start with loading state, regardless of persisted data
        set({ isLoading: true, isAuthenticated: false });
        
        try {
          // Try to get current user from backend using session cookie
          const user = await apiClient.getCurrentUser();
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          // If we can't get the user, they're not authenticated
          console.log('No valid session found:', error);
          set({ 
            isAuthenticated: false, 
            isLoading: false, 
            user: null, 
            token: null 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Don't persist authentication state to prevent premature loading
        // Only persist user info for UI optimization after auth is confirmed
        user: state.user,
      }),
      // Override initial state to always start with loading
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = true;
          state.isAuthenticated = false;
        }
      },
    }
  )
);