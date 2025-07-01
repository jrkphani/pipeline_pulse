import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridLayoutProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  responsive?: boolean
  gap?: "sm" | "md" | "lg"
  className?: string
}

const GridLayout = React.forwardRef<HTMLDivElement, GridLayoutProps>(
  ({ children, cols = 3, responsive = true, gap = "md", className, ...props }, ref) => {
    const gridClasses = responsive 
      ? `pp-grid--responsive-${cols}`
      : `pp-grid--${cols}`
      
    const gapClasses = {
      sm: "gap-4",
      md: "gap-6", 
      lg: "gap-8"
    }
    
    return (
      <div 
        ref={ref} 
        className={cn("pp-grid", gridClasses, gapClasses[gap], className)} 
        {...props}
      >
        {children}
      </div>
    )
  }
)
GridLayout.displayName = "GridLayout"

export { GridLayout }