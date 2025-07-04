/**
 * Enhanced MetricCard Component
 * 
 * A comprehensive, reusable component for displaying metrics and KPIs
 * Replaces SyncStatusCard and other metric display components
 * 
 * Features:
 * - Strong TypeScript typing
 * - Multiple layout variants
 * - Progress indicators
 * - Breakdown details
 * - Status indicators
 * - Action buttons
 * - Accessibility support
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { Progress } from "./progress"
import { Separator } from "./separator"
import { Skeleton } from "./skeleton"
import { Loader2, RefreshCw } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type TrendType = "positive" | "negative" | "neutral"
export type MetricVariant = "default" | "compact" | "detailed"
export type MetricStatus = "healthy" | "warning" | "error" | "neutral"

export interface TrendInfo {
  value: string
  type: TrendType
  icon?: React.ReactNode
  label?: string
}

export interface MetricBreakdown {
  label: string
  value: string | number
  color?: string
  status?: MetricStatus
}

export interface EnhancedMetricCardProps {
  // Core properties
  title: string
  value: string | number
  description?: string
  
  // Visual elements
  trend?: TrendInfo
  icon?: LucideIcon | React.ReactNode
  status?: MetricStatus
  
  // Enhanced features
  showProgress?: boolean
  progressValue?: number
  progressLabel?: string
  breakdown?: MetricBreakdown[]
  
  // Actions
  actions?: React.ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  
  // Layout
  variant?: MetricVariant
  className?: string
  loading?: boolean
  
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
}

// Status color mapping
const statusColors: Record<MetricStatus, string> = {
  healthy: "text-green-600",
  warning: "text-amber-600", 
  error: "text-red-600",
  neutral: "text-muted-foreground"
}

// Trend badge variants
const trendVariants: Record<TrendType, "default" | "destructive" | "secondary"> = {
  positive: "default",
  negative: "destructive",
  neutral: "secondary"
}

// Utility function to format values
const formatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return value
}

export const EnhancedMetricCard = React.forwardRef<HTMLDivElement, EnhancedMetricCardProps>(
  ({ 
    title, 
    value, 
    description, 
    trend, 
    icon, 
    status = "neutral",
    showProgress = false,
    progressValue,
    progressLabel,
    breakdown = [],
    actions,
    onRefresh,
    refreshing = false,
    variant = "default", 
    className, 
    loading = false, 
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props 
  }, ref) => {
    // Loading state
    if (loading) {
      return (
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardContent className={cn("p-6", variant === "compact" && "p-4")}>
            <div className="space-y-2">
              {icon && <Skeleton className="h-6 w-6 mx-auto" />}
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              {description && <Skeleton className="h-3 w-32 mx-auto" />}
              {trend && <Skeleton className="h-4 w-20 mx-auto" />}
              {showProgress && <Skeleton className="h-2 w-full mx-auto mt-3" />}
            </div>
          </CardContent>
        </Card>
      )
    }

    // Render icon
    const iconElement = icon && (
      <div className={cn("flex-shrink-0", statusColors[status])}>
        {React.isValidElement(icon) ? icon : React.createElement(icon as LucideIcon, { className: "h-5 w-5" })}
      </div>
    )

    // Render trend badge
    const trendElement = trend && (
      <Badge
        variant={trendVariants[trend.type]}
        className={cn(
          "flex items-center space-x-1",
          trend.type === "positive" && "bg-green-500 text-white"
        )}
      >
        {trend.icon}
        <span className="text-xs">{trend.value}</span>
      </Badge>
    )

    // Compact variant
    if (variant === "compact") {
      return (
        <Card 
          ref={ref} 
          className={cn("", className)} 
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          {...props}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {iconElement}
              <div className="flex-1 min-w-0">
                <div className={cn("text-2xl font-bold", statusColors[status])}>
                  {formatValue(value)}
                </div>
                <div className="text-sm font-medium text-muted-foreground truncate">
                  {title}
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {trendElement}
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="h-8 w-8 p-0"
                    aria-label={`Refresh ${title}`}
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Progress in compact mode */}
            {showProgress && progressValue !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>{progressLabel || 'Progress'}</span>
                  <span>{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    // Detailed variant
    if (variant === "detailed") {
      return (
        <Card 
          ref={ref} 
          className={cn("", className)}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          {...props}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {iconElement}
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {trendElement}
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="h-8 w-8 p-0"
                    aria-label={`Refresh ${title}`}
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  </Button>
                )}
              </div>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <div className={cn("text-3xl font-bold mb-4", statusColors[status])}>
              {formatValue(value)}
            </div>

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

            {/* Breakdown details */}
            {breakdown.length > 0 && (
              <div className="space-y-2">
                <Separator className="my-3" />
                {breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn(
                      "font-medium",
                      item.status ? statusColors[item.status] : "",
                      item.color ? item.color : ""
                    )}>
                      {formatValue(item.value)}
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

    // Default variant
    return (
      <Card 
        ref={ref} 
        className={cn("", className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            {iconElement && (
              <div className="flex justify-center mb-3">
                {iconElement}
              </div>
            )}

            <div className={cn("text-3xl font-bold", statusColors[status])}>
              {formatValue(value)}
            </div>

            <div className="text-sm font-medium text-muted-foreground">{title}</div>

            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}

            {trendElement && (
              <div className="flex items-center justify-center space-x-1 mt-3">
                {trendElement}
              </div>
            )}

            {/* Progress indicator */}
            {showProgress && progressValue !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>{progressLabel || 'Progress'}</span>
                  <span>{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            )}

            {/* Actions */}
            {(actions || onRefresh) && (
              <div className="mt-4 pt-3 border-t flex justify-center gap-2">
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={refreshing}
                    aria-label={`Refresh ${title}`}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                    Refresh
                  </Button>
                )}
                {actions}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

EnhancedMetricCard.displayName = "EnhancedMetricCard"

export { EnhancedMetricCard }
export default EnhancedMetricCard