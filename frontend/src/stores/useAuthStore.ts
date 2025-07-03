import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { apiService } from '@/services/api'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  full_name: string
  role?: string
  is_admin: boolean
}

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  lastLogin: Date | null
  sessionExpiry: Date | null
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>
  refreshSession: () => Promise<void>
  
  // Sync actions
  syncToDatabase: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: true,
        lastLogin: null,
        sessionExpiry: null,
        
        // Actions
        setUser: (user) => {
          set({ 
            user, 
            isAuthenticated: !!user,
            lastLogin: user ? new Date() : null,
            sessionExpiry: user ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
          })
          
          // Sync to database in background
          get().syncToDatabase()
        },
        
        setLoading: (loading) => set({ isLoading: loading }),
        
        login: async () => {
          try {
            set({ isLoading: true })
            
            // Get OAuth authorization URL
            const data = await apiService.get('/zoho/auth-url')
            
            if ((data as any).auth_url) {
              // Store state sync before redirect
              await get().syncToDatabase()
              
              // Redirect to OAuth flow
              window.location.href = (data as any).auth_url
            } else {
              throw new Error('Failed to get authorization URL')
            }
          } catch (error) {
            console.error('Failed to start OAuth flow:', error)
            throw error
          } finally {
            set({ isLoading: false })
          }
        },
        
        logout: async () => {
          try {
            set({ isLoading: true })
            
            // Clear development bypass if set
            const wasUsingBypass = localStorage.getItem('dev_auth_bypass') === 'true'
            localStorage.removeItem('dev_auth_bypass')
            
            // Call disconnect endpoint if not using development bypass
            if (!wasUsingBypass) {
              try {
                await apiService.post('/zoho/disconnect')
                console.info('✅ Successfully disconnected from Zoho CRM')
              } catch (error) {
                console.warn('Disconnect API call failed:', error)
              }
            }
            
            // Clear state
            set({ 
              user: null, 
              isAuthenticated: false,
              lastLogin: null,
              sessionExpiry: null
            })
            
            // Sync cleared state to database
            await get().syncToDatabase()
            
            console.info('🚪 User logged out successfully')
          } catch (error) {
            console.error('Failed to logout:', error)
            // Clear local state even if API call fails
            set({ 
              user: null, 
              isAuthenticated: false,
              lastLogin: null,
              sessionExpiry: null
            })
          } finally {
            set({ isLoading: false })
          }
        },
        
        checkAuthStatus: async () => {
          try {
            console.log('🔍 Starting auth status check...')
            set({ isLoading: true })
            
            // Add timeout using Promise.race
            const authCheckPromise = apiService.get('/zoho/status')
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auth check timeout')), 10000)
            )
            
            console.log('📡 Making API call to /zoho/status...')
            const data = await Promise.race([authCheckPromise, timeoutPromise])
            console.log('📦 Received auth status data:', data)
            
            if ((data as any).connected && (data as any).user && (data as any).status === 'authenticated') {
              // Transform Zoho user data to our User interface
              const nameParts = (data as any).user.name?.split(' ') || []
              const firstName = (data as any).user.first_name || nameParts[0] || ''
              const lastName = (data as any).user.last_name || nameParts.slice(1).join(' ') || ''
              
              const transformedUser: User = {
                id: (data as any).user.id || 'unknown',
                email: (data as any).user.email || '',
                first_name: firstName,
                last_name: lastName,
                display_name: (data as any).user.display_name || (data as any).user.name || (data as any).user.email || 'Unknown User',
                full_name: (data as any).user.full_name || (data as any).user.name || `${firstName} ${lastName}`.trim() || 'Unknown User',
                role: (data as any).user.role || 'User',
                is_admin: true
              }
              
              console.info(`✅ Authenticated as: ${transformedUser.display_name}`)
              set({ 
                user: transformedUser, 
                isAuthenticated: true,
                lastLogin: new Date(),
                sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
              })
              
              // Sync to database
              await get().syncToDatabase()
            } else {
              // Not authenticated - this is the expected case initially
              console.info(`ℹ️ Not authenticated. Status: ${(data as any).status}, Connected: ${(data as any).connected}`)
              if ((data as any).error) {
                console.info(`ℹ️ Auth error: ${(data as any).error}`)
              }
              set({ 
                user: null, 
                isAuthenticated: false,
                lastLogin: null,
                sessionExpiry: null
              })
            }
          } catch (error) {
            console.error('❌ Auth status check failed:', error)
            set({ 
              user: null, 
              isAuthenticated: false,
              lastLogin: null,
              sessionExpiry: null
            })
            
            // If it's a timeout or network error, we might be offline
            if (error instanceof Error) {
              if (error.message.includes('timeout')) {
                console.warn('⏰ Auth check timed out - assuming not authenticated')
              } else if (error.message.includes('Failed to fetch')) {
                console.warn('🌐 Network error - might be offline')
              }
            }
          } finally {
            console.log('✅ Auth check completed, setting loading to false')
            set({ isLoading: false })
          }
        },
        
        refreshSession: async () => {
          const state = get()
          if (state.isAuthenticated && state.sessionExpiry) {
            const now = new Date()
            const expiryTime = new Date(state.sessionExpiry)
            
            // Refresh if within 1 hour of expiry
            if (expiryTime.getTime() - now.getTime() < 60 * 60 * 1000) {
              await state.checkAuthStatus()
            }
          }
        },
        
        syncToDatabase: async () => {
          try {
            const state = get()
            
            // Prepare auth state for sync
            const authState = {
              isAuthenticated: state.isAuthenticated,
              lastLogin: state.lastLogin?.toISOString(),
              sessionExpiry: state.sessionExpiry?.toISOString(),
              userId: state.user?.id
            }
            
            // Sync to database
            await apiService.post('/state/update', {
              auth: authState
            })
            
            console.debug('Auth state synced to database')
          } catch (error) {
            console.error('Failed to sync auth state:', error)
          }
        }
      }),
      {
        name: 'auth-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          lastLogin: state.lastLogin,
          sessionExpiry: state.sessionExpiry
        })
      }
    ),
    {
      name: 'AuthStore'
    }
  )
)