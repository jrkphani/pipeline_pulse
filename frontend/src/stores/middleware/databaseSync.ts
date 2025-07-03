import { StateCreator, StoreMutatorIdentifier } from 'zustand'
import { apiService } from '@/services/api'

interface DatabaseSyncOptions {
  syncInterval?: number // Auto sync interval in ms
  debounceDelay?: number // Debounce delay for rapid updates
  enableAutoSync?: boolean
  excludeKeys?: string[] // Keys to exclude from sync
}

interface SyncState {
  _syncMetadata: {
    lastSyncTime: Date | null
    syncInProgress: boolean
    syncError: string | null
    pendingChanges: boolean
  }
}

type DatabaseSync = <
  T extends SyncState,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  options?: DatabaseSyncOptions
) => StateCreator<T, Mps, Mcs>

type DatabaseSyncImpl = <T extends SyncState>(
  f: StateCreator<T, [], [], T>,
  options?: DatabaseSyncOptions
) => StateCreator<T, [], [], T>

const databaseSyncImpl: DatabaseSyncImpl = (f, options = {}) => (set, get, store) => {
  const {
    syncInterval = 30000, // 30 seconds
    debounceDelay = 1000, // 1 second
    enableAutoSync = true,
    excludeKeys = ['_syncMetadata']
  } = options

  let debounceTimer: NodeJS.Timeout | null = null
  let syncIntervalTimer: NodeJS.Timeout | null = null

  // Initialize sync metadata
  const initialState = f(set, get, store)
  const stateWithSync = {
    ...initialState,
    _syncMetadata: {
      lastSyncTime: null,
      syncInProgress: false,
      syncError: null,
      pendingChanges: false
    }
  }

  // Enhanced set function with sync tracking
  const setSyncAware: typeof set = (partial, replace) => {
    // Update the state
    set(partial, replace)

    // Mark pending changes
    const currentState = get()
    if (currentState._syncMetadata) {
      set({
        _syncMetadata: {
          ...currentState._syncMetadata,
          pendingChanges: true,
          syncError: null
        }
      } as Partial<T>, false)
    }

    // Debounce sync
    if (enableAutoSync) {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        syncToDatabase()
      }, debounceDelay)
    }
  }

  // Sync function
  const syncToDatabase = async () => {
    const state = get()
    
    // Don't sync if already in progress
    if (state._syncMetadata.syncInProgress) return

    try {
      // Mark sync in progress
      set({
        _syncMetadata: {
          ...state._syncMetadata,
          syncInProgress: true,
          syncError: null
        }
      } as Partial<T>, false)

      // Prepare state for sync (exclude metadata and specified keys)
      const stateToSync = Object.keys(state).reduce((acc, key) => {
        if (!excludeKeys.includes(key) && key !== '_syncMetadata') {
          acc[key] = state[key as keyof T]
        }
        return acc
      }, {} as Record<string, any>)

      // Determine store type and sync appropriately
      const storeName = store.persist?.getOptions?.()?.name || 'unknown'
      let syncPayload: Record<string, any> = {}

      switch (storeName) {
        case 'auth-store':
          syncPayload.auth = stateToSync
          break
        case 'ui-store':
          syncPayload.ui = stateToSync
          break
        case 'app-store':
          syncPayload.app = stateToSync
          if (stateToSync.filters) {
            syncPayload.filters = stateToSync.filters
          }
          break
        default:
          // Generic sync
          syncPayload[storeName] = stateToSync
      }

      // Send to API
      await apiService.post('/state/update', syncPayload)

      // Mark sync complete
      set({
        _syncMetadata: {
          lastSyncTime: new Date(),
          syncInProgress: false,
          syncError: null,
          pendingChanges: false
        }
      } as Partial<T>, false)

      console.debug(`[${storeName}] State synced to database`)

    } catch (error) {
      console.error(`[${storeName || 'unknown'}] Failed to sync state:`, error)
      
      // Mark sync failed
      set({
        _syncMetadata: {
          ...state._syncMetadata,
          syncInProgress: false,
          syncError: error instanceof Error ? error.message : 'Sync failed',
          pendingChanges: true
        }
      } as Partial<T>, false)
    }
  }

  // Load from database
  const loadFromDatabase = async () => {
    try {
      const response = await apiService.get('/state')
      const serverState = (response as any).data

      if (serverState) {
        const storeName = store.persist?.getOptions?.()?.name || 'unknown'
        let stateToLoad: any = null

        switch (storeName) {
          case 'auth-store':
            stateToLoad = serverState.auth
            break
          case 'ui-store':
            stateToLoad = serverState.ui
            break
          case 'app-store':
            stateToLoad = {
              ...serverState.app,
              filters: serverState.filters || serverState.app?.filters
            }
            break
          default:
            stateToLoad = serverState[storeName]
        }

        if (stateToLoad) {
          // Merge server state with current state
          const mergedState = {
            ...get(),
            ...stateToLoad,
            _syncMetadata: {
              lastSyncTime: new Date(),
              syncInProgress: false,
              syncError: null,
              pendingChanges: false
            }
          }

          set(mergedState as T, true)
          console.debug(`[${storeName}] State loaded from database`)
        }
      }
    } catch (error) {
      console.error('Failed to load state from database:', error)
    }
  }

  // Set up auto-sync interval
  if (enableAutoSync && syncInterval > 0) {
    syncIntervalTimer = setInterval(() => {
      const state = get()
      if (state._syncMetadata.pendingChanges && !state._syncMetadata.syncInProgress) {
        syncToDatabase()
      }
    }, syncInterval)
  }

  // Cleanup function
  const cleanup = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (syncIntervalTimer) clearInterval(syncIntervalTimer)
  }

  // Add cleanup to window unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)
  }

  // Return enhanced state with sync functions
  return {
    ...stateWithSync,
    syncToDatabase,
    loadFromDatabase,
    // Override set to use sync-aware version
    __internalSet: setSyncAware
  } as T
}

export const databaseSync = databaseSyncImpl as unknown as DatabaseSync

// Helper hook for sync status
export const useSyncStatus = (storeName: string) => {
  // This would be implemented to extract sync metadata from any store
  return {
    lastSyncTime: null,
    syncInProgress: false,
    syncError: null,
    pendingChanges: false
  }
}