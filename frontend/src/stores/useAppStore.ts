import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { apiService } from '@/services/api'

interface FilterState {
  dateRange: string
  territories: string[]
  serviceLines: string[]
  dealStages: string[]
  awsFunded: boolean | null
  strategic: boolean | null
  minAmount: number | null
  maxAmount: number | null
}

interface AppState {
  // Filters
  filters: FilterState
  savedFilters: Array<{ id: string; name: string; filters: FilterState }>
  
  // Search & Navigation
  recentSearches: string[]
  favoritePages: Array<{ path: string; title: string }>
  
  // Data Preferences
  defaultCurrency: string
  dateFormat: string
  numberFormat: string
  pageSize: number
  
  // Sync Status
  lastSyncTime: Date | null
  syncInProgress: boolean
  syncError: string | null
  
  // O2R Preferences
  o2rViewMode: 'grid' | 'list' | 'kanban'
  o2rGroupBy: 'phase' | 'territory' | 'service' | 'manager'
  showHealthIndicators: boolean
  
  // Export Preferences
  exportFormat: 'csv' | 'excel' | 'pdf'
  includeCharts: boolean
  
  // Actions - Filters
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  saveFilterPreset: (name: string) => void
  loadFilterPreset: (id: string) => void
  deleteFilterPreset: (id: string) => void
  
  // Actions - Search
  addRecentSearch: (search: string) => void
  clearRecentSearches: () => void
  
  // Actions - Favorites
  addFavoritePage: (path: string, title: string) => void
  removeFavoritePage: (path: string) => void
  
  // Actions - Preferences
  setDefaultCurrency: (currency: string) => void
  setDateFormat: (format: string) => void
  setNumberFormat: (format: string) => void
  setPageSize: (size: number) => void
  
  // Actions - Sync
  setSyncStatus: (inProgress: boolean, error?: string) => void
  updateLastSyncTime: () => void
  
  // Actions - O2R
  setO2RViewMode: (mode: 'grid' | 'list' | 'kanban') => void
  setO2RGroupBy: (groupBy: 'phase' | 'territory' | 'service' | 'manager') => void
  toggleHealthIndicators: () => void
  
  // Actions - Export
  setExportFormat: (format: 'csv' | 'excel' | 'pdf') => void
  toggleIncludeCharts: () => void
  
  // Database Sync
  syncToDatabase: () => Promise<void>
  loadFromDatabase: () => Promise<void>
}

const defaultFilters: FilterState = {
  dateRange: 'last30days',
  territories: [],
  serviceLines: [],
  dealStages: [],
  awsFunded: null,
  strategic: null,
  minAmount: null,
  maxAmount: null
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        filters: defaultFilters,
        savedFilters: [],
        recentSearches: [],
        favoritePages: [],
        defaultCurrency: 'SGD',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-US',
        pageSize: 25,
        lastSyncTime: null,
        syncInProgress: false,
        syncError: null,
        o2rViewMode: 'grid',
        o2rGroupBy: 'phase',
        showHealthIndicators: true,
        exportFormat: 'excel',
        includeCharts: true,
        
        // Filter Actions
        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters }
          }))
          get().syncToDatabase()
        },
        
        resetFilters: () => {
          set({ filters: defaultFilters })
          get().syncToDatabase()
        },
        
        saveFilterPreset: (name) => {
          const { filters, savedFilters } = get()
          const newPreset = {
            id: `filter-${Date.now()}`,
            name,
            filters: { ...filters }
          }
          
          set({ savedFilters: [...savedFilters, newPreset] })
          get().syncToDatabase()
        },
        
        loadFilterPreset: (id) => {
          const preset = get().savedFilters.find(f => f.id === id)
          if (preset) {
            set({ filters: { ...preset.filters } })
            get().syncToDatabase()
          }
        },
        
        deleteFilterPreset: (id) => {
          set((state) => ({
            savedFilters: state.savedFilters.filter(f => f.id !== id)
          }))
          get().syncToDatabase()
        },
        
        // Search Actions
        addRecentSearch: (search) => {
          const { recentSearches } = get()
          const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 10)
          set({ recentSearches: updated })
          get().syncToDatabase()
        },
        
        clearRecentSearches: () => {
          set({ recentSearches: [] })
          get().syncToDatabase()
        },
        
        // Favorite Actions
        addFavoritePage: (path, title) => {
          const { favoritePages } = get()
          if (!favoritePages.find(p => p.path === path)) {
            set({ favoritePages: [...favoritePages, { path, title }] })
            get().syncToDatabase()
          }
        },
        
        removeFavoritePage: (path) => {
          set((state) => ({
            favoritePages: state.favoritePages.filter(p => p.path !== path)
          }))
          get().syncToDatabase()
        },
        
        // Preference Actions
        setDefaultCurrency: (currency) => {
          set({ defaultCurrency: currency })
          get().syncToDatabase()
        },
        
        setDateFormat: (format) => {
          set({ dateFormat: format })
          get().syncToDatabase()
        },
        
        setNumberFormat: (format) => {
          set({ numberFormat: format })
          get().syncToDatabase()
        },
        
        setPageSize: (size) => {
          set({ pageSize: size })
          get().syncToDatabase()
        },
        
        // Sync Actions
        setSyncStatus: (inProgress, error) => {
          set({ 
            syncInProgress: inProgress, 
            syncError: error || null 
          })
        },
        
        updateLastSyncTime: () => {
          set({ lastSyncTime: new Date() })
          get().syncToDatabase()
        },
        
        // O2R Actions
        setO2RViewMode: (mode) => {
          set({ o2rViewMode: mode })
          get().syncToDatabase()
        },
        
        setO2RGroupBy: (groupBy) => {
          set({ o2rGroupBy: groupBy })
          get().syncToDatabase()
        },
        
        toggleHealthIndicators: () => {
          set((state) => ({ showHealthIndicators: !state.showHealthIndicators }))
          get().syncToDatabase()
        },
        
        // Export Actions
        setExportFormat: (format) => {
          set({ exportFormat: format })
          get().syncToDatabase()
        },
        
        toggleIncludeCharts: () => {
          set((state) => ({ includeCharts: !state.includeCharts }))
          get().syncToDatabase()
        },
        
        // Database Sync
        syncToDatabase: async () => {
          try {
            const state = get()
            
            // Prepare app state for sync
            const appState = {
              filters: state.filters,
              savedFilters: state.savedFilters,
              recentSearches: state.recentSearches,
              favoritePages: state.favoritePages,
              defaultCurrency: state.defaultCurrency,
              dateFormat: state.dateFormat,
              numberFormat: state.numberFormat,
              pageSize: state.pageSize,
              lastSyncTime: state.lastSyncTime?.toISOString(),
              o2rViewMode: state.o2rViewMode,
              o2rGroupBy: state.o2rGroupBy,
              showHealthIndicators: state.showHealthIndicators,
              exportFormat: state.exportFormat,
              includeCharts: state.includeCharts
            }
            
            // Sync to database
            await apiService.post('/state/update', {
              app: appState,
              filters: state.filters
            })
            
            console.debug('App state synced to database')
          } catch (error) {
            console.error('Failed to sync app state:', error)
          }
        },
        
        loadFromDatabase: async () => {
          try {
            const response = await apiService.get('/state')
            const { app, filters } = (response as any).data
            
            if (app) {
              set({
                filters: filters || app.filters || defaultFilters,
                savedFilters: app.savedFilters || [],
                recentSearches: app.recentSearches || [],
                favoritePages: app.favoritePages || [],
                defaultCurrency: app.defaultCurrency || 'SGD',
                dateFormat: app.dateFormat || 'DD/MM/YYYY',
                numberFormat: app.numberFormat || 'en-US',
                pageSize: app.pageSize || 25,
                lastSyncTime: app.lastSyncTime ? new Date(app.lastSyncTime) : null,
                o2rViewMode: app.o2rViewMode || 'grid',
                o2rGroupBy: app.o2rGroupBy || 'phase',
                showHealthIndicators: app.showHealthIndicators !== false,
                exportFormat: app.exportFormat || 'excel',
                includeCharts: app.includeCharts !== false
              })
            }
          } catch (error) {
            console.error('Failed to load app state from database:', error)
          }
        }
      }),
      {
        name: 'app-store',
        storage: createJSONStorage(() => localStorage)
      }
    ),
    {
      name: 'AppStore'
    }
  )
)