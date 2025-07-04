/**
 * Unified StatusCard Component
 * 
 * A comprehensive, reusable component for displaying various status information
 * Replaces multiple similar components: CRMConnectionStatus, ConnectionStatus,
 * DataSourceIndicator, SyncStatusCard, etc.
 * 
 * Features:
 * - Strong TypeScript typing with generics
 * - Consistent shadcn/ui design tokens
 * - Flexible layout options (compact, full, inline)
 * - Accessibility support
 * - Progress indicators
 * - Action buttons
 * - Status-based styling
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Status type definitions
export type StatusType = 'healthy' | 'warning' | 'error' | 'loading' | 'disconnected' | 'idle' | 'success'
export type StatusCategory = 'connection' | 'health' | 'sync' | 'currency' | 'data-source' | 'generic'
export type LayoutVariant = 'card' | 'compact' | 'inline'

// Props interface with strong typing
export interface StatusCardProps {
  // Core properties
  title: string
  status: StatusType
  category?: StatusCategory
  variant?: LayoutVariant
  
  // Content
  value?: string | number
  description?: string
  lastUpdated?: string | Date
  
  // Visual elements
  icon?: LucideIcon
  customIcon?: React.ReactNode
  showIcon?: boolean
  
  // Progress/metrics
  showProgress?: boolean
  progressValue?: number
  progressLabel?: string
  
  // Details breakdown
  details?: Array<{
    label: string
    value: string | number
    status?: StatusType
  }>
  
  // Actions
  actions?: React.ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  
  // Layout & styling
  className?: string
  contentClassName?: string
  
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
}

// Status configuration mapping
const statusConfig: Record<StatusType, {
  color: string
  bgColor: string
  borderColor: string
  icon: LucideIcon
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}> = {
  healthy: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    badgeVariant: 'default'
  },
  success: {
    color: 'text-green-600',
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    badgeVariant: 'default'
  },
  warning: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertTriangle,
    badgeVariant: 'secondary'
  },
  error: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    badgeVariant: 'destructive'
  },
  loading: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Loader2,
    badgeVariant: 'outline'
  },
  disconnected: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: WifiOff,
    badgeVariant: 'outline'
  },
  idle: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Clock,
    badgeVariant: 'outline'
  }
}

// Category-specific configurations
const categoryDefaults: Record<StatusCategory, Partial<StatusCardProps>> = {
  connection: {
    showIcon: true,
    customIcon: <Wifi className="h-4 w-4" />
  },
  health: {
    showProgress: true,
    showIcon: true
  },
  sync: {
    showProgress: true,
    showIcon: true
  },
  currency: {
    showIcon: true
  },
  'data-source': {
    showIcon: true
  },
  generic: {}
}

// Utility functions
const formatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return value
}

const formatLastUpdated = (date: string | Date): string => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return dateObj.toLocaleDateString()
}

// Main component
export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  category = 'generic',
  variant = 'card',
  value,
  description,
  lastUpdated,
  icon,
  customIcon,
  showIcon = true,
  showProgress = false,
  progressValue,
  progressLabel,
  details = [],
  actions,
  onRefresh,
  refreshing = false,
  className,
  contentClassName,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...categoryDefaults[category]
}) => {
  const config = statusConfig[status]
  const IconComponent = icon || config.icon
  const displayIcon = customIcon || (showIcon && <IconComponent className={cn("h-4 w-4", config.color)} />)
  
  // Status badge
  const statusBadge = (
    <Badge 
      variant={config.badgeVariant}
      className={cn(
        config.badgeVariant === 'default' && "bg-green-500 text-white",
        status === 'loading' && "animate-pulse"
      )}
    >
      {status === 'loading' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  )

  // Compact variant
  if (variant === 'compact') {
    return (
      <div 
        className={cn("flex items-center gap-2 p-2 rounded-md border", config.borderColor, config.bgColor, className)}
        aria-label={ariaLabel || `${title} status: ${status}`}
      >
        {displayIcon}
        <span className="font-medium text-sm truncate">{title}</span>
        {statusBadge}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-6 w-6 p-0 ml-auto"
            aria-label={`Refresh ${title}`}
          >
            <Loader2 className={cn("h-3 w-3", refreshing && "animate-spin")} />
          </Button>
        )}
      </div>
    )
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div 
        className={cn("flex items-center gap-3", className)}
        aria-label={ariaLabel || `${title}: ${status}`}
      >
        {displayIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{title}</span>
            {statusBadge}
          </div>
          {value && (
            <p className="text-sm text-muted-foreground">{formatValue(value)}</p>
          )}
        </div>
        {actions}
      </div>
    )
  }

  // Full card variant (default)
  return (
    <Card 
      className={cn(
        "transition-colors duration-200",
        config.borderColor,
        className
      )}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {displayIcon}
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0"
                aria-label={`Refresh ${title}`}
              >
                <Loader2 className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className={cn("pt-0", contentClassName)}>
        {/* Main value display */}
        {value && (
          <div className="mb-4">
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {formatLastUpdated(lastUpdated)}
              </p>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {showProgress && progressValue !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{progressLabel || 'Progress'}</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        {/* Details breakdown */}
        {details.length > 0 && (
          <div className="space-y-2">
            <Separator className="my-3" />
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{detail.label}</span>
                <span className={cn(
                  "font-medium",
                  detail.status && statusConfig[detail.status]?.color
                )}>
                  {formatValue(detail.value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="mt-4 pt-3 border-t">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export default for easier importing
export default StatusCard