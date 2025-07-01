import * as React from "react"
import { cn } from "@/lib/utils"

export interface EnhancedProgressProps {
  value: number
  max?: number
  variant?: "default" | "success" | "warning" | "error"
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  label?: string
  className?: string
}

const EnhancedProgress = React.forwardRef<HTMLDivElement, EnhancedProgressProps>(
  ({ 
    value, 
    max = 100, 
    variant = "default", 
    size = "md", 
    showValue = false, 
    label, 
    className, 
    ...props 
  }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    
    const sizeClasses = {
      sm: "h-1",
      md: "h-2", 
      lg: "h-3"
    }
    
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center text-sm">
            {label && <span className="font-medium">{label}</span>}
            {showValue && <span className="text-muted-foreground">{value}/{max}</span>}
          </div>
        )}
        
        <div className={cn("pp-progress", sizeClasses[size])}>
          <div 
            className={cn(
              "pp-progress__bar",
              variant !== "default" && `pp-progress__bar--${variant}`
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
EnhancedProgress.displayName = "EnhancedProgress"

export { EnhancedProgress }