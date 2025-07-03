/**
 * Optimized Query Hooks that integrate with Zustand
 * Eliminates duplication between TanStack Query and Zustand state
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, useAppStore, useServerStore } from '@/stores'
import { queryKeys } from '@/lib/queryClient'
import { apiService } from '@/services/api'

/**
 * Auth-related queries that sync with AuthStore
 */
export const useAuthQueries = () => {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()
  
  // Auth status query - minimal since most auth state is in Zustand
  const authStatusQuery = useQuery({
    queryKey: queryKeys.auth.status(),
    queryFn: async () => {
      const response = await apiService.get('/zoho/status')
      return response.data
    },
    enabled: !authStore.isAuthenticated, // Only query if not already authenticated
    onSuccess: (data) => {
      // Sync auth data to Zustand store
      if (data.connected && data.user) {
        authStore.setUser(data.user)
      }
    }
  })
  
  // Login mutation
  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: async () => {
      return authStore.login() // Use Zustand action
    },
    onSuccess: () => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.status() })
    }
  })
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: async () => {
      return authStore.logout() // Use Zustand action
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear()
    }
  })
  
  return {
    authStatus: authStatusQuery,
    login: loginMutation,
    logout: logoutMutation,
    // Expose Zustand state directly (no duplication)
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading || authStatusQuery.isLoading
  }
}

/**
 * Business data queries (TanStack Query is source of truth)
 */
export const useBusinessDataQueries = () => {
  const appStore = useAppStore()
  
  // Deals query with filter integration
  const dealsQuery = useQuery({
    queryKey: queryKeys.deals.list(appStore.filters),
    queryFn: async () => {
      const response = await apiService.get('/deals', { 
        params: appStore.filters 
      })
      return response.data
    },
    // Use filters from Zustand store
    onSuccess: () => {
      appStore.updateLastSyncTime()
    }
  })
  
  // O2R opportunities query
  const opportunitiesQuery = useQuery({
    queryKey: queryKeys.opportunities.o2r(),
    queryFn: async () => {
      const response = await apiService.get('/o2r/opportunities')
      return response.data
    },
    onSuccess: () => {
      appStore.updateLastSyncTime()
    }
  })
  
  // Update filters mutation (affects both Zustand and TanStack Query)
  const updateFiltersMutation = useMutation({
    mutationKey: ['app', 'filters'],
    mutationFn: async (newFilters: any) => {
      // Update Zustand store first
      appStore.setFilters(newFilters)
      
      // No API call needed - filters are client-side
      return newFilters
    },
    onSuccess: () => {
      // Invalidate queries that depend on filters
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all() })
    }
  })
  
  return {
    deals: dealsQuery,
    opportunities: opportunitiesQuery,
    updateFilters: updateFiltersMutation,
    // Expose filter state from Zustand (single source of truth)
    filters: appStore.filters,
    savedFilters: appStore.savedFilters
  }
}

/**
 * Live sync queries that integrate with server state
 */
export const useLiveSyncQueries = () => {
  const serverStore = useServerStore()
  
  // Live sync status
  const syncStatusQuery = useQuery({
    queryKey: queryKeys.live.status(),
    queryFn: async () => {
      const response = await apiService.get('/sync/status')
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    onSuccess: (data) => {
      // Update server store connection status
      serverStore.setConnectionStatus(data.connected ? 'online' : 'offline')
    },
    onError: () => {
      serverStore.setConnectionStatus('offline')
    }
  })
  
  // Manual sync mutation
  const manualSyncMutation = useMutation({
    mutationKey: ['sync', 'manual'],
    mutationFn: async () => {
      const response = await apiService.post('/sync/manual')
      return response.data
    },
    onSuccess: () => {
      // Invalidate business data after sync
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all() })
      serverStore.updateLastSyncTime()
    }
  })
  
  return {
    syncStatus: syncStatusQuery,
    manualSync: manualSyncMutation,
    // Expose server state from Zustand
    connectionStatus: serverStore.connectionStatus,
    lastSyncTime: serverStore.lastSyncTime,
    syncErrors: serverStore.syncErrors
  }
}

/**
 * State persistence queries (for Zustand state sync)
 */
export const useStatePersistence = () => {
  const queryClient = useQueryClient()
  
  // Load state from database
  const loadStateMutation = useMutation({
    mutationKey: ['state', 'load'],
    mutationFn: async () => {
      const response = await apiService.get('/state')
      return response.data
    },
    onSuccess: (data) => {
      // State loading is handled by Zustand stores directly
      console.debug('State loaded from database')
    }
  })
  
  // Save state to database
  const saveStateMutation = useMutation({
    mutationKey: ['state', 'save'],
    mutationFn: async (state: any) => {
      const response = await apiService.post('/state/update', state)
      return response.data
    },
    onSuccess: () => {
      console.debug('State saved to database')
    }
  })
  
  return {
    loadState: loadStateMutation,
    saveState: saveStateMutation
  }
}

/**
 * Combined hook for common app functionality
 */
export const useApp = () => {
  const auth = useAuthQueries()
  const business = useBusinessDataQueries()
  const sync = useLiveSyncQueries()
  const state = useStatePersistence()
  
  return {
    auth,
    business,
    sync,
    state,
    
    // Global app state
    isOnline: sync.connectionStatus === 'online',
    hasErrors: sync.syncErrors.length > 0,
    isInitialized: auth.isAuthenticated && !auth.isLoading
  }
}