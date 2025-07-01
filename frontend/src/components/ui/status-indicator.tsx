import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusIndicatorProps {
  status: "healthy" | "warning" | "critical" | "info"
  label: string
  description?: string
  className?: string
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, label, description, className, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn("pp-status", `pp-status--${status}`, className)} 
        {...props}
      >
        <div className="pp-status__dot" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator }