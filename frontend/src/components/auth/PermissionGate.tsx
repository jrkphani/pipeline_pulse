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
  const { user } = useAuth()

  if (!user) {
    return <>{fallback}</>
  }

  // Direct access mode - all permissions granted
  // In direct access mode, everyone has admin privileges and all permissions
  return <>{children}</>
}

export default PermissionGate
