import * as React from "react"
import { cn } from "@/lib/utils"
import { EnhancedCard } from "./enhanced-card"

export interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: string
    type: "positive" | "negative" | "neutral"
    icon?: React.ReactNode
  }
  icon?: React.ReactNode
  className?: string
  loading?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, description, trend, icon, className, loading = false, ...props }, ref) => {
    return (
      <EnhancedCard 
        ref={ref} 
        className={cn("pp-metric-card", loading && "pp-loading", className)} 
        hoverable
        {...props}
      >
        {icon && (
          <div className="flex justify-center mb-2 text-primary">
            {icon}
          </div>
        )}
        
        <div className="pp-metric-card__value">
          {loading ? "..." : value}
        </div>
        
        <div className="pp-metric-card__label">
          {title}
        </div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        
        {trend && (
          <div className={cn(
            "pp-metric-card__trend",
            `pp-metric-card__trend--${trend.type}`
          )}>
            {trend.icon}
            <span>{trend.value}</span>
          </div>
        )}
      </EnhancedCard>
    )
  }
)
MetricCard.displayName = "MetricCard"

export { MetricCard }