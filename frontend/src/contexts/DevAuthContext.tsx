import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Development Auth Context with bypass option
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

interface DevAuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>
  bypassAuth: () => void
}

const DevAuthContext = createContext<DevAuthContextType | undefined>(undefined)

export const useDevAuth = () => {
  const context = useContext(DevAuthContext)
  if (context === undefined) {
    throw new Error('useDevAuth must be used within a DevAuthProvider')
  }
  return context
}

interface DevAuthProviderProps {
  children: ReactNode
}

export const DevAuthProvider: React.FC<DevAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for development bypass
  useEffect(() => {
    const devBypass = localStorage.getItem('dev_auth_bypass')
    if (devBypass === 'true') {
      // Set up development user
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
      return
    }

    // Otherwise check real auth status
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      
      // Try to connect to backend
      const response = await fetch('/api/zoho/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.connected && data.user) {
          // Transform Zoho user data to our User interface
          const nameParts = data.user.name?.split(' ') || []
          const firstName = data.user.first_name || nameParts[0] || ''
          const lastName = data.user.last_name || nameParts.slice(1).join(' ') || ''

          const transformedUser: User = {
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            display_name: data.user.display_name || data.user.name || data.user.email,
            full_name: data.user.full_name || data.user.name || `${firstName} ${lastName}`.trim(),
            role: data.user.role,
            is_admin: true
          }

          setUser(transformedUser)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        // Backend connection failed
        console.warn('Backend connection failed, showing login form')
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
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
      const response = await fetch('/api/zoho/auth-url')
      
      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.auth_url) {
        // Redirect to OAuth flow
        window.location.href = data.auth_url
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)

      // Clear development bypass if set
      localStorage.removeItem('dev_auth_bypass')

      // Try to call disconnect endpoint
      try {
        await fetch('/api/zoho/disconnect', {
          method: 'POST'
        })
      } catch (error) {
        console.warn('Disconnect API call failed:', error)
      }

      // Clear local state
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout failed:', error)
      // Clear local state even if API call fails
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const bypassAuth = () => {
    // Development only - bypass authentication
    localStorage.setItem('dev_auth_bypass', 'true')
    
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
  }

  const value: DevAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
    bypassAuth
  }

  return (
    <DevAuthContext.Provider value={value}>
      {children}
    </DevAuthContext.Provider>
  )
}