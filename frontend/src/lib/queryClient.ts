import { QueryClient, DefaultOptions } from '@tanstack/react-query'
import { useServerStore } from '@/stores/useServerStore'

/**
 * Optimized QueryClient configuration that integrates with Zustand
 * Eliminates duplication between TanStack Query and Zustand stores
 */

const queryConfig: DefaultOptions = {
  queries: {
    // Cache for 5 minutes by default
    staleTime: 5 * 60 * 1000,
    
    // Retry failed requests
    retry: (failureCount, error: Error & { status?: number }) => {
      // Add error to server store for unified error handling
      useServerStore.getState().addSyncError(error.message)
      
      // Don't retry auth errors
      if (error.status === 401 || error.status === 403) {
        return false
      }
      
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    
    // Refetch on window focus for critical data only
    refetchOnWindowFocus: (query) => {
      // Only refetch auth and real-time data
      const criticalKeys = ['auth', 'user', 'sync-status', 'live']
      return criticalKeys.some(key => 
        (query.queryKey as string[]).includes(key)
      )
    },
    
    // Background refetch interval for live data
    refetchInterval: (query) => {
      const liveDataKeys = ['sync-status', 'live', 'real-time']
      const isLiveData = liveDataKeys.some(key => 
        (query.queryKey as string[]).includes(key)
      )
      
      // Refetch live data every 30 seconds
      return isLiveData ? 30 * 1000 : false
    },
    
    // Global success handler - removed deprecated onSuccess
    // Modern approach: handle success in individual query hooks
    
    // Global error handler - removed deprecated onError
    // Modern approach: handle errors in individual query hooks
  },
  
  mutations: {
    // Global mutation success handler - removed deprecated onSuccess
    // Modern approach: handle success in individual mutation hooks
    
    // Global mutation error handler - removed deprecated onError
    // Modern approach: handle errors in individual mutation hooks
  }
}

// Create optimized query client
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: queryConfig
  })
}

// Query key factories for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    status: () => ['auth', 'status'] as const,
    user: () => ['auth', 'user'] as const,
    refresh: () => ['auth', 'refresh'] as const
  },
  
  // State queries (minimal - most state is in Zustand)
  state: {
    sync: () => ['state', 'sync'] as const,
    load: () => ['state', 'load'] as const
  },
  
  // Business data queries
  deals: {
    all: () => ['deals'] as const,
    list: (filters: Record<string, unknown>) => ['deals', 'list', filters] as const,
    detail: (id: string) => ['deals', 'detail', id] as const
  },
  
  opportunities: {
    all: () => ['opportunities'] as const,
    o2r: () => ['opportunities', 'o2r'] as const,
    phases: () => ['opportunities', 'phases'] as const
  },
  
  // Live data queries
  live: {
    sync: () => ['live', 'sync'] as const,
    status: () => ['live', 'status'] as const,
    pipeline: (filters: Record<string, unknown>) => ['live', 'pipeline', filters] as const
  }
}

// Helper functions for query management
export const queryHelpers = {
  // Invalidate all auth-related queries
  invalidateAuth: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.status() })
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() })
  },
  
  // Invalidate all business data
  invalidateBusinessData: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.deals.all() })
    queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all() })
  },
  
  // Reset all queries (for logout)
  resetAllQueries: (queryClient: QueryClient) => {
    queryClient.clear()
  },
  
  // Prefetch critical data
  prefetchCriticalData: async (queryClient: QueryClient) => {
    // Prefetch auth status
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auth.status(),
      queryFn: () => fetch('/api/auth/status').then(r => r.json())
    })
    
    // Prefetch live sync status
    await queryClient.prefetchQuery({
      queryKey: queryKeys.live.status(),
      queryFn: () => fetch('/api/sync/status').then(r => r.json())
    })
  }
}