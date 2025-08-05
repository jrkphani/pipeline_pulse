/**
 * Unified State Synchronization System
 * Eliminates duplication between Zustand and TanStack Query
 */

import { QueryClient } from '@tanstack/react-query'
import { useAuthStore, type User } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAppStore } from '@/stores/useAppStore'
import { useServerStore } from '@/stores/useServerStore'

export interface StateSync {
  // Sync strategies
  syncClientStateToServer: () => Promise<void>
  syncServerStateToClient: () => Promise<void>
  
  // Query integration
  onQuerySuccess: (queryKey: string[], data: unknown) => void
  onQueryError: (queryKey: string[], error: Error) => void
  
  // State coordination
  coordinateStateUpdates: (source: 'zustand' | 'tanstack', data: unknown) => void
}

class StateSyncManager implements StateSync {
  private queryClient: QueryClient
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
    this.setupQueryClientIntegration()
  }
  
  private setupQueryClientIntegration() {
    // Set query client in server store
    useServerStore.getState().setQueryClient(this.queryClient)
    
    // Set up global query defaults
    this.queryClient.setDefaultOptions({
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: Error) => {
          // Add error to server store
          useServerStore.getState().addSyncError(error.message)
          return failureCount < 2
        }
        // Note: onSuccess and onError are deprecated in modern TanStack Query
        // Handle success/error in individual query hooks instead
      },
      mutations: {
        // Note: onSuccess and onError are deprecated in modern TanStack Query
        // Handle success/error in individual mutation hooks instead
      }
    })
  }
  
  async syncClientStateToServer(): Promise<void> {
    try {
      // Get current state from all stores
      const authState = useAuthStore.getState()
      const uiState = useUIStore.getState()
      const appState = useAppStore.getState()
      
      // Only sync if authenticated
      if (!authState.isAuthenticated) return
      
      // Prepare state for sync (exclude functions and metadata)
      const stateToSync = {
        auth: {
          userId: authState.user?.id,
          lastLogin: authState.lastLogin,
          sessionExpiry: authState.sessionExpiry
        },
        ui: {
          theme: uiState.theme,
          fontSize: uiState.fontSize,
          sidebarOpen: uiState.sidebarOpen,
          sidebarCollapsed: uiState.sidebarCollapsed,
          lastRoute: uiState.lastRoute,
          // ... other UI preferences
        },
        app: {
          filters: appState.filters,
          savedFilters: appState.savedFilters,
          recentSearches: appState.recentSearches,
          favoritePages: appState.favoritePages,
          // ... other app state
        }
      }
      
      // Use TanStack Query mutation for sync
      await this.queryClient.fetchQuery({
        queryKey: ['state', 'sync'],
        queryFn: () => this.syncStateToAPI(stateToSync),
        staleTime: 0 // Always fresh
      })
      
      useServerStore.getState().updateLastSyncTime()
      
    } catch (error: unknown) {
      useServerStore.getState().addSyncError(`Sync failed: ${(error as Error).message}`)
      throw error
    }
  }
  
  async syncServerStateToClient(): Promise<void> {
    try {
      // Fetch state from server using TanStack Query
      const serverState = await this.queryClient.fetchQuery({
        queryKey: ['state', 'load'],
        queryFn: () => this.loadStateFromAPI(),
        staleTime: 0
      })
      
      if (serverState) {
        // Update Zustand stores with server state
        this.updateZustandStores(serverState)
      }
      
    } catch (error: unknown) {
      useServerStore.getState().addSyncError(`Load failed: ${(error as Error).message}`)
      throw error
    }
  }
  
  onQuerySuccess(queryKey: string[], data: unknown): void {
    // Update server store with successful query
    useServerStore.getState().updateLastSyncTime()
    useServerStore.getState().setConnectionStatus('online')
    
    // Handle specific query types
    if (queryKey.includes('user') || queryKey.includes('auth')) {
      this.updateAuthStoreFromQuery(data)
    }
    
    if (queryKey.includes('deals') || queryKey.includes('opportunities')) {
      this.updateAppStoreFromQuery(data)
    }
  }
  
  onQueryError(queryKey: string[], error: Error): void {
    useServerStore.getState().addSyncError(`Query ${queryKey.join('.')} failed: ${error.message}`)
    
    // Handle auth errors specifically
    if (queryKey.includes('auth') && error.message.includes('401')) {
      useAuthStore.getState().logout()
    }
  }
  
  coordinateStateUpdates(source: 'zustand' | 'tanstack', data: unknown): void {
    if (source === 'zustand') {
      // Zustand state changed, invalidate related TanStack queries
      this.invalidateQueriesForZustandChange()
    } else {
      // TanStack query updated, sync to Zustand if needed
      this.syncQueryDataToZustand(data)
    }
  }
  
  private async syncStateToAPI(state: Record<string, unknown>) {
    const response = await fetch('/api/state/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    })
    
    if (!response.ok) throw new Error('Sync failed')
    return response.json()
  }
  
  private async loadStateFromAPI() {
    const response = await fetch('/api/state')
    if (!response.ok) throw new Error('Load failed')
    return response.json()
  }
  
  private updateZustandStores(serverState: { data: Record<string, unknown> }) {
    const { auth, ui, app } = serverState.data
    
    if (auth) {
      useAuthStore.setState(auth, false) // Don't trigger sync
    }
    
    if (ui) {
      useUIStore.setState(ui, false)
    }
    
    if (app) {
      useAppStore.setState(app, false)
    }
  }
  
  private updateAuthStoreFromQuery(data: unknown) {
    // Only update if data is newer than current state
    const currentAuth = useAuthStore.getState()
    if (this.isDataNewer(data, currentAuth.lastLogin)) {
      const userData = data as { user: any }
      if (userData.user) {
        useAuthStore.getState().setUser(userData.user)
      }
    }
  }
  
  private updateAppStoreFromQuery(_data: unknown) {
    // Update app store with fresh server data
    // This prevents duplication by using TanStack Query as source of truth
    const appStore = useAppStore.getState()
    appStore.updateLastSyncTime()
  }
  
  private invalidateRelatedQueries(mutationKey: string[]) {
    // Invalidate queries related to the mutation
    if (mutationKey.includes('auth')) {
      this.queryClient.invalidateQueries({ queryKey: ['user'] })
      this.queryClient.invalidateQueries({ queryKey: ['auth'] })
    }
    
    if (mutationKey.includes('deals')) {
      this.queryClient.invalidateQueries({ queryKey: ['deals'] })
      this.queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    }
  }
  
  private invalidateQueriesForZustandChange() {
    // When Zustand state changes, invalidate relevant TanStack queries
    // This ensures TanStack Query refetches fresh data
    this.queryClient.invalidateQueries({ queryKey: ['state'] })
  }
  
  private syncQueryDataToZustand(data: unknown) {
    // Minimal sync from TanStack Query to Zustand
    // Only sync metadata, not the actual data (to avoid duplication)
    useServerStore.getState().updateLastSyncTime()
  }
  
  private isDataNewer(newData: unknown, currentTimestamp: Date | null): boolean {
    if (!currentTimestamp) return true
    const dataWithTimestamp = newData as { timestamp?: string }
    if (!dataWithTimestamp.timestamp) return false
    return new Date(dataWithTimestamp.timestamp) > currentTimestamp
  }
}

// Singleton instance
let stateSyncManager: StateSyncManager | null = null

export const createStateSync = (queryClient: QueryClient): StateSyncManager => {
  if (!stateSyncManager) {
    stateSyncManager = new StateSyncManager(queryClient)
  }
  return stateSyncManager
}

export const getStateSync = (): StateSyncManager | null => {
  return stateSyncManager
}