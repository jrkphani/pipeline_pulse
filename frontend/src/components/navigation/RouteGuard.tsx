import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface RouteGuardProps {
  children: ReactNode
  requiresAuth?: boolean
  requiresPermission?: string
  fallback?: ReactNode
}

export function RouteGuard({ 
  children, 
  requiresAuth = true, 
  requiresPermission,
  fallback 
}: RouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check authentication requirement
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check permission requirement
  if (requiresPermission && user) {
    const hasPermission = user.permissions?.includes(requiresPermission) || 
                         user.role === 'admin' ||
                         user.role === 'super_admin'
    
    if (!hasPermission) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-muted-foreground">Access Denied</h2>
            <p className="text-muted-foreground mt-2">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}