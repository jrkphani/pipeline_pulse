import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Skeleton } from "./skeleton"
import { Button } from "./button"
import { Progress } from "./progress"
import { Separator } from "./separator"
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

export interface MetricCardProps {
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

// Utility function to format values
const formatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return value
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
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
            </div>
          </CardContent>
        </Card>
      )
    }

    if (variant === "compact") {
      return (
        <Card ref={ref} className={cn("", className)} {...props}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="flex-shrink-0 text-primary">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm font-medium text-muted-foreground truncate">{title}</div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              {trend && (
                <div className="flex-shrink-0">
                  <Badge
                    variant={trend.type === "positive" ? "default" : trend.type === "negative" ? "destructive" : "secondary"}
                    className="flex items-center space-x-1"
                  >
                    {trend.icon}
                    <span className="text-xs">{trend.value}</span>
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            {icon && (
              <div className="flex justify-center text-primary mb-3">
                {icon}
              </div>
            )}

            <div className="text-3xl font-bold">{value}</div>

            <div className="text-sm font-medium text-muted-foreground">{title}</div>

            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}

            {trend && (
              <div className="flex items-center justify-center space-x-1 mt-3">
                <Badge
                  variant={trend.type === "positive" ? "default" : trend.type === "negative" ? "destructive" : "secondary"}
                  className="flex items-center space-x-1"
                >
                  {trend.icon}
                  <span className="text-xs">{trend.value}</span>
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
MetricCard.displayName = "MetricCard"

export { MetricCard }