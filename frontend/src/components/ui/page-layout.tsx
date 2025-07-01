import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("pp-page", className)} {...props}>
      {children}
    </div>
  )
)
PageLayout.displayName = "PageLayout"

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, className, ...props }, ref) => (
    <div ref={ref} className={cn("pp-page__header", className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="pp-page__title">{title}</h1>
          {description && (
            <p className="pp-page__description">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
)
PageHeader.displayName = "PageHeader"

export { PageLayout, PageHeader }