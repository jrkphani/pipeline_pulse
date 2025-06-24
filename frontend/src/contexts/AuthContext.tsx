import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Get API base URL from environment
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api'

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
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/zoho/status`)
      const data = await response.json()

      if (data.connected && data.user) {
        // Transform Zoho user data to our User interface
        const transformedUser: User = {
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.first_name || data.user.name?.split(' ')[0] || '',
          last_name: data.user.last_name || data.user.name?.split(' ').slice(1).join(' ') || '',
          display_name: data.user.display_name || data.user.name || data.user.email,
          full_name: data.user.full_name || data.user.name || `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim(),
          role: data.user.role,
          is_admin: true // All authenticated users have admin access in this system
        }

        setUser(transformedUser)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
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

      // Call disconnect endpoint
      await fetch(`${API_BASE_URL}/zoho/disconnect`, {
        method: 'POST'
      })

      // Clear local state
      setUser(null)
      setIsAuthenticated(false)
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
