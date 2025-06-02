import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface PermissionGateProps {
  children: React.ReactNode
  module?: string
  action?: string
  territory?: string
  requireAdmin?: boolean
  fallback?: React.ReactNode
  requireAll?: boolean // If true, all conditions must be met; if false, any condition can be met
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  module,
  action,
  territory,
  requireAdmin = false,
  fallback = null,
  requireAll = true
}) => {
  const { user, hasPermission, hasTerritory } = useAuth()

  if (!user) {
    return <>{fallback}</>
  }

  const conditions: boolean[] = []

  // Check admin requirement
  if (requireAdmin) {
    conditions.push(user.is_admin || false)
  }

  // Check module permission
  if (module && action) {
    conditions.push(hasPermission(module, action))
  }

  // Check territory access
  if (territory) {
    conditions.push(hasTerritory(territory))
  }

  // If no conditions specified, allow access
  if (conditions.length === 0) {
    return <>{children}</>
  }

  // Check conditions based on requireAll flag
  const hasAccess = requireAll 
    ? conditions.every(condition => condition)
    : conditions.some(condition => condition)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

export default PermissionGate
