// Zustand stores
export { useAuthStore } from './useAuthStore'
export { useUIStore } from './useUIStore'
export { useAppStore } from './useAppStore'
export { useServerStore } from './useServerStore'

// Store provider
export { StoreProvider, useStores } from './StoreProvider'

// Middleware
export { databaseSync, useSyncStatus } from './middleware/databaseSync'

// Optimized query integration
export { createOptimizedQueryClient, queryKeys, queryHelpers } from '../lib/queryClient'
export { createStateSync, getStateSync } from '../lib/stateSync'

// Optimized hooks (eliminates TanStack Query + Zustand duplication)
export { 
  useAuthQueries, 
  useBusinessDataQueries, 
  useLiveSyncQueries, 
  useStatePersistence,
  useApp 
} from '../hooks/useOptimizedQueries'

// Types
export type { AuthState } from './useAuthStore'
export type { UIState } from './useUIStore'
export type { AppState } from './useAppStore'

// Store selectors for better performance
export const authSelectors = {
  user: (state: any) => state.user,
  isAuthenticated: (state: any) => state.isAuthenticated,
  isLoading: (state: any) => state.isLoading
}

export const uiSelectors = {
  theme: (state: any) => state.theme,
  sidebarOpen: (state: any) => state.sidebarOpen,
  sidebarCollapsed: (state: any) => state.sidebarCollapsed,
  breadcrumbs: (state: any) => state.breadcrumbs
}

export const appSelectors = {
  filters: (state: any) => state.filters,
  recentSearches: (state: any) => state.recentSearches,
  favoritePages: (state: any) => state.favoritePages,
  o2rViewMode: (state: any) => state.o2rViewMode
}