import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { apiService } from '@/services/api'

interface UIState {
  // Theme & Appearance
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
  reducedMotion: boolean
  
  // Layout
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  
  // Navigation
  breadcrumbs: Array<{ label: string; href: string }>
  lastRoute: string
  
  // Accessibility
  keyboardNavEnabled: boolean
  screenReaderMode: boolean
  focusIndicatorVisible: boolean
  
  // Notifications
  notificationsEnabled: boolean
  soundEnabled: boolean
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href: string }>) => void
  setLastRoute: (route: string) => void
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  toggleKeyboardNav: () => void
  toggleScreenReaderMode: () => void
  toggleNotifications: () => void
  toggleSound: () => void
  
  // Sync
  syncToDatabase: () => Promise<void>
  loadFromDatabase: () => Promise<void>
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        theme: 'system',
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
        sidebarOpen: true,
        sidebarCollapsed: false,
        commandPaletteOpen: false,
        breadcrumbs: [],
        lastRoute: '/dashboard',
        keyboardNavEnabled: false,
        screenReaderMode: false,
        focusIndicatorVisible: true,
        notificationsEnabled: true,
        soundEnabled: false,
        
        // Actions
        setTheme: (theme) => {
          set({ theme })
          
          // Apply theme to document
          if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          
          get().syncToDatabase()
        },
        
        setFontSize: (fontSize) => {
          set({ fontSize })
          
          // Apply font size to document
          document.documentElement.setAttribute('data-font-size', fontSize)
          
          get().syncToDatabase()
        },
        
        setSidebarOpen: (sidebarOpen) => {
          set({ sidebarOpen })
          get().syncToDatabase()
        },
        
        setSidebarCollapsed: (sidebarCollapsed) => {
          set({ sidebarCollapsed })
          get().syncToDatabase()
        },
        
        setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
        
        setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
        
        setLastRoute: (route) => {
          set({ lastRoute: route })
          get().syncToDatabase()
        },
        
        toggleHighContrast: () => {
          set((state) => ({ highContrast: !state.highContrast }))
          
          // Apply high contrast to document
          const { highContrast } = get()
          if (highContrast) {
            document.documentElement.classList.add('high-contrast')
          } else {
            document.documentElement.classList.remove('high-contrast')
          }
          
          get().syncToDatabase()
        },
        
        toggleReducedMotion: () => {
          set((state) => ({ reducedMotion: !state.reducedMotion }))
          
          // Apply reduced motion to document
          const { reducedMotion } = get()
          if (reducedMotion) {
            document.documentElement.classList.add('reduced-motion')
          } else {
            document.documentElement.classList.remove('reduced-motion')
          }
          
          get().syncToDatabase()
        },
        
        toggleKeyboardNav: () => {
          set((state) => ({ keyboardNavEnabled: !state.keyboardNavEnabled }))
          get().syncToDatabase()
        },
        
        toggleScreenReaderMode: () => {
          set((state) => ({ screenReaderMode: !state.screenReaderMode }))
          get().syncToDatabase()
        },
        
        toggleNotifications: () => {
          set((state) => ({ notificationsEnabled: !state.notificationsEnabled }))
          get().syncToDatabase()
        },
        
        toggleSound: () => {
          set((state) => ({ soundEnabled: !state.soundEnabled }))
          get().syncToDatabase()
        },
        
        syncToDatabase: async () => {
          try {
            const state = get()
            
            // Prepare UI state for sync
            const uiState = {
              theme: state.theme,
              fontSize: state.fontSize,
              highContrast: state.highContrast,
              reducedMotion: state.reducedMotion,
              sidebarOpen: state.sidebarOpen,
              sidebarCollapsed: state.sidebarCollapsed,
              lastRoute: state.lastRoute,
              keyboardNavEnabled: state.keyboardNavEnabled,
              screenReaderMode: state.screenReaderMode,
              notificationsEnabled: state.notificationsEnabled,
              soundEnabled: state.soundEnabled
            }
            
            // Sync to database
            await apiService.post('/state/update', {
              ui: uiState
            })
            
            console.debug('UI state synced to database')
          } catch (error) {
            console.error('Failed to sync UI state:', error)
          }
        },
        
        loadFromDatabase: async () => {
          try {
            const response = await apiService.get('/state')
            const { ui } = (response as any).data
            
            if (ui) {
              set({
                theme: ui.theme || 'system',
                fontSize: ui.fontSize || 'medium',
                highContrast: ui.highContrast || false,
                reducedMotion: ui.reducedMotion || false,
                sidebarOpen: ui.sidebarOpen !== false,
                sidebarCollapsed: ui.sidebarCollapsed || false,
                lastRoute: ui.lastRoute || '/dashboard',
                keyboardNavEnabled: ui.keyboardNavEnabled || false,
                screenReaderMode: ui.screenReaderMode || false,
                notificationsEnabled: ui.notificationsEnabled !== false,
                soundEnabled: ui.soundEnabled || false
              })
              
              // Apply loaded settings
              const state = get()
              state.setTheme(state.theme)
              state.setFontSize(state.fontSize)
              if (state.highContrast) document.documentElement.classList.add('high-contrast')
              if (state.reducedMotion) document.documentElement.classList.add('reduced-motion')
            }
          } catch (error) {
            console.error('Failed to load UI state from database:', error)
          }
        }
      }),
      {
        name: 'ui-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          theme: state.theme,
          fontSize: state.fontSize,
          highContrast: state.highContrast,
          reducedMotion: state.reducedMotion,
          sidebarOpen: state.sidebarOpen,
          sidebarCollapsed: state.sidebarCollapsed,
          lastRoute: state.lastRoute,
          keyboardNavEnabled: state.keyboardNavEnabled,
          screenReaderMode: state.screenReaderMode,
          notificationsEnabled: state.notificationsEnabled,
          soundEnabled: state.soundEnabled
        })
      }
    ),
    {
      name: 'UIStore'
    }
  )
)