import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  email: string
  first_name: string
  last_name: string
  display_name: string
  zoho_user_id?: string
  roles: string[]
  territories?: string[]
  permissions?: {
    module_permissions?: Record<string, any>
    field_permissions?: Record<string, any>
  }
  is_admin?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (redirectUrl?: string) => void
  logout: () => void
  verifyToken: () => Promise<boolean>
  refreshPermissions: () => Promise<void>
  hasPermission: (module: string, action: string) => boolean
  hasTerritory: (territory: string) => boolean
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
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on app load
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user_info')

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)
        // Verify token is still valid
        verifyStoredToken(storedToken)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        clearAuthData()
      }
    }
    setIsLoading(false)
  }, [])

  const verifyStoredToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (!result.valid) {
        // Token is invalid, clear auth data
        clearAuthData()
      }
    } catch (error) {
      console.error('Error verifying token:', error)
      clearAuthData()
    }
  }

  const verifyToken = async (): Promise<boolean> => {
    if (!token) return false

    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      return result.valid
    } catch (error) {
      console.error('Error verifying token:', error)
      return false
    }
  }

  const login = (redirectUrl?: string) => {
    // Redirect to SAML login endpoint
    const loginUrl = `/api/auth/saml/login${redirectUrl ? `?relay_state=${encodeURIComponent(redirectUrl)}` : ''}`
    window.location.href = loginUrl
  }

  const logout = async () => {
    try {
      // Call logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Clear local auth data
      clearAuthData()
      // Redirect to SAML logout
      window.location.href = '/api/auth/saml/logout'
    }
  }

  const refreshPermissions = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/auth/refresh-permissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.permissions) {
          // Update user with fresh permissions
          const updatedUser = {
            ...user,
            permissions: result.permissions,
            territories: result.permissions.territories,
            is_admin: result.permissions.is_admin
          }
          setUser(updatedUser)
          localStorage.setItem('user_info', JSON.stringify(updatedUser))
        }
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error)
    }
  }

  const hasPermission = (module: string, action: string): boolean => {
    if (!user?.permissions?.module_permissions) return false

    // Admins have all permissions
    if (user.is_admin) return true

    const modulePerms = user.permissions.module_permissions[module]
    return modulePerms?.[action] || false
  }

  const hasTerritory = (territory: string): boolean => {
    if (!user) return false

    // Admins have access to all territories
    if (user.is_admin) return true

    return user.territories?.includes(territory) || false
  }

  const clearAuthData = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
  }

  const isAuthenticated = !!user && !!token

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    verifyToken,
    refreshPermissions,
    hasPermission,
    hasTerritory
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
