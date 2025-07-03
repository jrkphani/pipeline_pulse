import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Use relative path for Vite proxy
const API_BASE_URL = '/api'

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

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    // Check for OAuth success redirect first
    const urlParams = new URLSearchParams(window.location.search)
    const isOAuthSuccess = urlParams.get('success') === 'true'
    
    if (isOAuthSuccess) {
      // OAuth callback successful, clean URL and check auth status
      window.history.replaceState({}, document.title, window.location.pathname)
      checkAuthStatus()
      return
    }
    
    // Check for stored session first
    const storedSession = localStorage.getItem('pipeline_pulse_session')
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession)
        const sessionAge = Date.now() - sessionData.timestamp
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        if (sessionAge < maxAge && sessionData.user) {
          // Session is still valid, restore user
          setUser(sessionData.user)
          setIsAuthenticated(true)
          setIsLoading(false)
          console.info('🔄 Restored user session from localStorage')
          
          // Verify session in background
          verifyStoredSession()
          return
        } else {
          // Session expired, clear it
          localStorage.removeItem('pipeline_pulse_session')
          console.info('🕐 Session expired, clearing stored data')
        }
      } catch (error) {
        console.warn('🚨 Invalid session data in localStorage, clearing')
        localStorage.removeItem('pipeline_pulse_session')
      }
    }
    
    // In development, allow bypass for testing but prefer real auth
    const devBypass = localStorage.getItem('dev_auth_bypass')
    const isDevelopment = import.meta.env.DEV
    
    if (devBypass === 'true' && isDevelopment) {
      // Set up development user (only in development mode)
      const devUser: User = {
        id: 'dev-user-123',
        email: 'dev@1cloudhub.com',
        first_name: 'Development',
        last_name: 'User',
        display_name: 'Development User',
        full_name: 'Development User',
        role: 'admin',
        is_admin: true
      }
      setUser(devUser)
      setIsAuthenticated(true)
      setIsLoading(false)
      console.warn('🚧 Using development auth bypass - disable for production testing')
      return
    }

    // Otherwise check real auth status
    checkAuthStatus()
  }, [])

  const verifyStoredSession = async () => {
    try {
      // Verify the stored session is still valid with backend
      const response = await fetch(`${API_BASE_URL}/zoho/status`)
      
      if (!response.ok) {
        console.info('🚨 Stored session invalid, requiring fresh login')
        localStorage.removeItem('pipeline_pulse_session')
        setUser(null)
        setIsAuthenticated(false)
        return
      }
      
      console.info('✅ Stored session verified with backend')
    } catch (error) {
      console.warn('⚠️ Failed to verify stored session:', error)
      // Don't clear session on network errors, just log the issue
    }
  }

  const storeSession = (user: User) => {
    const sessionData = {
      user,
      timestamp: Date.now()
    }
    localStorage.setItem('pipeline_pulse_session', JSON.stringify(sessionData))
    console.info('💾 User session stored to localStorage')
  }

  const clearSession = () => {
    localStorage.removeItem('pipeline_pulse_session')
    console.info('🗑️ User session cleared from localStorage')
  }

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/zoho/status`)
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          console.info('Authentication required - user needs to login')
        } else if (response.status >= 500) {
          console.error(`Server error during auth check: ${response.status}`)
        } else {
          console.warn(`Auth status check failed: ${response.status}`)
        }
        setUser(null)
        setIsAuthenticated(false)
        clearSession()
        return
      }
      
      const responseText = await response.text()
      if (!responseText) {
        console.warn('Empty response from auth status check')
        setUser(null)
        setIsAuthenticated(false)
        clearSession()
        return
      }
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse auth status response:', parseError)
        setUser(null)
        setIsAuthenticated(false)
        clearSession()
        return
      }

      // Handle different response statuses
      if (data.status === 'not_configured') {
        console.info('OAuth not configured - check backend configuration')
        setUser(null)
        setIsAuthenticated(false)
        clearSession()
        return
      }
      
      if (data.status === 'authentication_failed' || data.status === 'token_error') {
        console.warn('Authentication failed - token may be expired or invalid')
        setUser(null)
        setIsAuthenticated(false)
        clearSession()
        return
      }

      if (data.connected && data.user && data.status === 'authenticated') {
        // Transform Zoho user data to our User interface
        const nameParts = data.user.name?.split(' ') || []
        const firstName = data.user.first_name || nameParts[0] || ''
        const lastName = data.user.last_name || nameParts.slice(1).join(' ') || ''

        const transformedUser: User = {
          id: data.user.id || 'unknown',
          email: data.user.email || '',
          first_name: firstName,
          last_name: lastName,
          display_name: data.user.display_name || data.user.name || data.user.email || 'Unknown User',
          full_name: data.user.full_name || data.user.name || `${firstName} ${lastName}`.trim() || 'Unknown User',
          role: data.user.role || 'User',
          is_admin: true // All authenticated users have admin access in this system
        }

        console.info(`✅ Authenticated as: ${transformedUser.display_name}`)
        setUser(transformedUser)
        setIsAuthenticated(true)
        
        // Store session for persistence
        storeSession(transformedUser)
      } else {
        console.info('Authentication response indicates not connected')
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
      
      // Provide more specific error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - check if backend is running')
      }
      
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async () => {
    try {
      setIsLoading(true)

      // Get OAuth authorization URL
      const response = await fetch(`${API_BASE_URL}/zoho/auth-url`)
      const data = await response.json()

      if (data.auth_url) {
        // Redirect to OAuth flow
        window.location.href = data.auth_url
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (error) {
      console.error('Failed to start OAuth flow:', error)
      setIsLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)

      // Check if user was using development bypass
      const wasUsingBypass = localStorage.getItem('dev_auth_bypass') === 'true'
      
      // Clear development bypass if set
      localStorage.removeItem('dev_auth_bypass')

      // Only call disconnect endpoint if not using development bypass
      if (!wasUsingBypass) {
        try {
          const response = await fetch(`${API_BASE_URL}/zoho/disconnect`, {
            method: 'POST'
          })
          
          if (response.ok) {
            console.info('✅ Successfully disconnected from Zoho CRM')
          } else {
            console.warn(`Disconnect API returned: ${response.status}`)
          }
        } catch (error) {
          console.warn('Disconnect API call failed:', error)
          // Don't fail logout just because disconnect failed
        }
      } else {
        console.info('Development bypass mode - skipping API disconnect')
      }

      // Clear local state and session
      setUser(null)
      setIsAuthenticated(false)
      clearSession()
      
      console.info('🚪 User logged out successfully')
    } catch (error) {
      console.error('Failed to logout:', error)
      // Clear local state even if API call fails
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
