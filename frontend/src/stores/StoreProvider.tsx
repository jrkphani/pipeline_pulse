import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore } from './useAuthStore'
import { useUIStore } from './useUIStore'
import { useAppStore } from './useAppStore'

interface StoreContextType {
  initialized: boolean
  syncAllStores: () => Promise<void>
  loadAllStores: () => Promise<void>
  clearAllStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | null>(null)

export const useStores = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider')
  }
  return context
}

interface StoreProviderProps {
  children: ReactNode
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [initialized, setInitialized] = React.useState(false)
  
  // Get store actions
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const appStore = useAppStore()

  // Initialize stores on mount
  useEffect(() => {
    const initializeStores = async () => {
      try {
        console.info('🏪 Initializing Zustand stores...')
        
        // Load states from database in parallel
        await Promise.all([
          authStore.loadFromDatabase?.(),
          uiStore.loadFromDatabase(),
          appStore.loadFromDatabase()
        ])
        
        // Check authentication status
        const urlParams = new URLSearchParams(window.location.search)
        const isOAuthSuccess = urlParams.get('success') === 'true'
        
        console.log('🔄 Auth flow check - isOAuthSuccess:', isOAuthSuccess, 'isAuthenticated:', authStore.isAuthenticated)
        
        if (isOAuthSuccess) {
          // OAuth callback successful, clean URL and check auth status
          window.history.replaceState({}, document.title, window.location.pathname)
          await authStore.checkAuthStatus()
        } else if (authStore.isAuthenticated) {
          // User is already authenticated from localStorage, make sure loading is false
          console.log('✅ User already authenticated, setting loading to false')
          authStore.setLoading(false)
        } else if (!authStore.isAuthenticated) {
          // Check for development bypass
          const devBypass = localStorage.getItem('dev_auth_bypass')
          const isDevelopment = import.meta.env.DEV
          
          console.log('🔧 Auth initialization - devBypass:', devBypass, 'isDevelopment:', isDevelopment, 'isAuthenticated:', authStore.isAuthenticated)
          
          if (devBypass === 'true' && isDevelopment) {
            // Set up development user
            const devUser = {
              id: 'dev-user-123',
              email: 'dev@1cloudhub.com',
              first_name: 'Development',
              last_name: 'User',
              display_name: 'Development User',
              full_name: 'Development User',
              role: 'admin',
              is_admin: true
            }
            authStore.setUser(devUser)
            console.warn('🚧 Using development auth bypass')
          } else {
            // Check real auth status
            console.log('🚀 About to check auth status...')
            await authStore.checkAuthStatus()
            console.log('🏁 Auth status check completed')
          }
        }
        
        // Apply UI settings to DOM
        const theme = uiStore.theme
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        }
        
        document.documentElement.setAttribute('data-font-size', uiStore.fontSize)
        
        if (uiStore.highContrast) {
          document.documentElement.classList.add('high-contrast')
        }
        
        if (uiStore.reducedMotion) {
          document.documentElement.classList.add('reduced-motion')
        }
        
        setInitialized(true)
        console.info('✅ Zustand stores initialized successfully')
        console.log('🔍 Current auth state - isAuthenticated:', authStore.isAuthenticated, 'user:', authStore.user)
        
      } catch (error) {
        console.error('❌ Failed to initialize stores:', error)
        setInitialized(true) // Continue with defaults
      }
    }

    initializeStores()
  }, [])

  // Set up periodic session refresh
  useEffect(() => {
    if (!initialized) return

    const refreshInterval = setInterval(async () => {
      if (authStore.isAuthenticated) {
        await authStore.refreshSession()
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(refreshInterval)
  }, [initialized, authStore.isAuthenticated])

  // Set up system theme detection
  useEffect(() => {
    if (!initialized) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = () => {
      if (uiStore.theme === 'system') {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    mediaQuery.addEventListener('change', handleThemeChange)
    return () => mediaQuery.removeEventListener('change', handleThemeChange)
  }, [initialized, uiStore.theme])

  // Store management functions
  const syncAllStores = async () => {
    try {
      await Promise.allSettled([
        authStore.syncToDatabase?.(),
        uiStore.syncToDatabase(),
        appStore.syncToDatabase()
      ])
      console.info('🔄 All stores synced to database')
    } catch (error) {
      console.error('❌ Failed to sync stores:', error)
    }
  }

  const loadAllStores = async () => {
    try {
      await Promise.all([
        authStore.loadFromDatabase?.(),
        uiStore.loadFromDatabase(),
        appStore.loadFromDatabase()
      ])
      console.info('📥 All stores loaded from database')
    } catch (error) {
      console.error('❌ Failed to load stores:', error)
    }
  }

  const clearAllStores = async () => {
    try {
      // Clear authentication
      await authStore.logout()
      
      // Reset UI to defaults (but keep accessibility preferences)
      const accessibilitySettings = {
        highContrast: uiStore.highContrast,
        reducedMotion: uiStore.reducedMotion,
        keyboardNavEnabled: uiStore.keyboardNavEnabled,
        screenReaderMode: uiStore.screenReaderMode,
        fontSize: uiStore.fontSize
      }
      
      // Reset UI state but preserve accessibility
      uiStore.setTheme('system')
      uiStore.setSidebarOpen(true)
      uiStore.setSidebarCollapsed(false)
      
      // Reset app state
      appStore.resetFilters()
      appStore.clearRecentSearches()
      
      console.info('🧹 All stores cleared')
    } catch (error) {
      console.error('❌ Failed to clear stores:', error)
    }
  }

  const contextValue: StoreContextType = {
    initialized,
    syncAllStores,
    loadAllStores,
    clearAllStores
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  )
}