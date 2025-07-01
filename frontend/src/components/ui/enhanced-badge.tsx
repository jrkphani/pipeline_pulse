import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "pp-badge",
  {
    variants: {
      variant: {
        default: "pp-badge--default",
        primary: "pp-badge--primary",
        success: "pp-badge--success",
        warning: "pp-badge--warning",
        destructive: "pp-badge--destructive",
        outline: "pp-badge--outline",
        revenue: "pp-badge--revenue",
        pipeline: "pp-badge--pipeline",
        opportunity: "pp-badge--opportunity",
        risk: "pp-badge--risk",
        forecast: "pp-badge--forecast",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface EnhancedBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

function EnhancedBadge({ className, variant, icon, children, ...props }: EnhancedBadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  )
}

export { EnhancedBadge, badgeVariants }