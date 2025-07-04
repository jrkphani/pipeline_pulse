import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { QueryClient } from '@tanstack/react-query'

/**
 * Server State Store - Integrates with TanStack Query
 * This store acts as a bridge between Zustand and TanStack Query
 * to eliminate state duplication and provide unified state management
 */

interface ServerState {
  // TanStack Query integration
  queryClient: QueryClient | null
  
  // Server state metadata
  connectionStatus: 'online' | 'offline' | 'connecting'
  lastSyncTime: Date | null
  syncErrors: string[]
  syncInProgress: boolean
  diffSummary: { local_db_only: number; zoho_only: number }
  rateLimitStatus: { remaining: number; limit: number }

  // Actions
  setQueryClient: (client: QueryClient) => void
  setConnectionStatus: (status: 'online' | 'offline' | 'connecting') => void
  updateLastSyncTime: (time: Date) => void
  addSyncError: (error: string) => void
  clearSyncErrors: () => void
  setSyncInProgress: (inProgress: boolean) => void
  setDiffSummary: (summary: { local_db_only: number; zoho_only: number }) => void
  setRateLimitStatus: (status: { remaining: number; limit: number }) => void
  
  // TanStack Query helpers
  invalidateQueries: (queryKey?: string[]) => Promise<void>
  refetchQueries: (queryKey?: string[]) => Promise<void>
  getQueryData: <T>(queryKey: string[]) => T | undefined
  setQueryData: <T>(queryKey: string[], data: T) => void
}

export const useServerStore = create<ServerState>()(
  devtools(
    (set, get) => ({
      // Initial state
      queryClient: null,
      connectionStatus: 'connecting',
      lastSyncTime: null,
      syncErrors: [],
      syncInProgress: false,
      diffSummary: { local_db_only: 0, zoho_only: 0 },
      rateLimitStatus: { remaining: 0, limit: 0 },
      
      // Actions
      setQueryClient: (client) => set({ queryClient: client }),
      
      setConnectionStatus: (status) => {
        set({ connectionStatus: status })
        if (status === 'online') {
          set({ syncErrors: [] })
        }
      },
      
      updateLastSyncTime: (time) => set({ lastSyncTime: time }),
      
      addSyncError: (error) => {
        set((state) => ({
          syncErrors: [...state.syncErrors, error].slice(-5) // Keep last 5 errors
        }))
      },
      
      clearSyncErrors: () => set({ syncErrors: [] }),
      
      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),
      setDiffSummary: (summary) => set({ diffSummary: summary }),
      setRateLimitStatus: (status) => set({ rateLimitStatus: status }),
      
      // TanStack Query helpers
      invalidateQueries: async (queryKey) => {
        const { queryClient } = get()
        if (queryClient) {
          await queryClient.invalidateQueries({ queryKey })
        }
      },
      
      refetchQueries: async (queryKey) => {
        const { queryClient } = get()
        if (queryClient) {
          await queryClient.refetchQueries({ queryKey })
        }
      },
      
      getQueryData: <T>(queryKey: string[]) => {
        const { queryClient } = get()
        return queryClient?.getQueryData<T>(queryKey)
      },
      
      setQueryData: <T>(queryKey: string[], data: T) => {
        const { queryClient } = get()
        if (queryClient) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    }),
    {
      name: 'ServerStore'
    }
  )
)