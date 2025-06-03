import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  email: string
  first_name: string
  last_name: string
  display_name: string
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
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
  const [isLoading, setIsLoading] = useState(false)

  // Direct access mode - no authentication required
  const defaultUser: User = {
    email: 'admin@1cloudhub.com',
    first_name: 'System',
    last_name: 'Administrator',
    display_name: 'System Administrator',
    is_admin: true
  }

  useEffect(() => {
    // Set loading to false immediately since no auth is needed
    setIsLoading(false)
  }, [])

  const value: AuthContextType = {
    user: defaultUser,
    isAuthenticated: true, // Always authenticated in direct access mode
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
