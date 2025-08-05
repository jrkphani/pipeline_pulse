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
  logout: () => Promise<void>;
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
        console.log('🔄 setUser called with:', user);
        set({ user });
        if (user) {
          console.log('🔄 Setting authenticated to true');
          set({ isAuthenticated: true, isLoading: false });
        }
        console.log('🔄 Auth state after setUser:', { user, isAuthenticated: !!user, isLoading: false });
      },
      
      setIsAuthenticated: (authenticated: boolean) => {
        console.log('🔄 setIsAuthenticated called with:', authenticated);
        set({ isAuthenticated: authenticated, isLoading: false });
        if (!authenticated) {
          set({ user: null, token: null });
        }
        console.log('🔄 Auth state after setIsAuthenticated:', { isAuthenticated: authenticated, isLoading: false });
      },
      
      setToken: (token: string | null) => {
        set({ token });
        // Update API client token
        apiClient.setToken(token);
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      logout: async () => {
        try {
          // Call backend logout endpoint to invalidate session
          await apiClient.logout();
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local logout even if backend fails
        } finally {
          // Always clear local state regardless of API call result
          set({ 
            isAuthenticated: false, 
            user: null, 
            token: null, 
            isLoading: false 
          });
          // Clear API client token
          apiClient.setToken(null);
        }
      },
      
      initializeAuth: async () => {
        // Always start with loading state, regardless of persisted data
        set({ isLoading: true, isAuthenticated: false });
        
        // Check if we're coming from an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthSuccess = urlParams.has('zoho_connected') || 
                               urlParams.has('oauth_success') ||
                               window.location.pathname.includes('/auth/callback');
        
        if (hasOAuthSuccess) {
          console.log('🔄 OAuth callback detected, skipping immediate /me call to avoid race condition');
          // Give the browser time to process the session cookie
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          // Try to get current user from backend using session cookie
          const user = await apiClient.getCurrentUser();
          console.log('✅ initializeAuth: Got user from backend:', user);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          // If we can't get the user, they're not authenticated
          console.log('❌ initializeAuth: No valid session found:', error);
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