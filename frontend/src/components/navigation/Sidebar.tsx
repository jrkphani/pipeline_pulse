import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, X, Menu, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { navigationDomains } from '@/data/navigation.data'
import { NavigationDomain, NavigationItem } from '@/types/navigation.types'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface NavigationDomainItemProps {
  domain: NavigationDomain
  isActive: boolean
  onItemClick: () => void
  currentPath: string
  isCollapsed?: boolean
  expandedDomains: Record<string, boolean>
  onToggleDomain: (domainId: string) => void
}

interface NavigationItemComponentProps {
  item: NavigationItem
  isActive: boolean
  isChild?: boolean
  onItemClick: () => void
  currentPath: string
  isCollapsed?: boolean
  expandedItems: Record<string, boolean>
  onToggleItem: (itemId: string) => void
}

function NavigationItemComponent({ 
  item, 
  isActive, 
  isChild = false, 
  onItemClick, 
  currentPath, 
  isCollapsed = false,
  expandedItems,
  onToggleItem
}: NavigationItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expandedItems[item.id] || false

  const handleItemClick = () => {
    if (hasChildren) {
      onToggleItem(item.id)
    } else {
      onItemClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick()
    }
  }

  const ItemIcon = item.icon

  const linkContent = (
    <>
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {ItemIcon && (
          <ItemIcon className={cn(
            "h-4 w-4 flex-shrink-0",
            isActive && "text-primary-foreground"
          )} />
        )}
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <span className="block truncate">{item.label}</span>
            {item.description && (
              <span className="block text-xs opacity-70 truncate">{item.description}</span>
            )}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex items-center space-x-2">
          {item.badge && (
            <Badge 
              variant={item.badge === 'New' ? 'default' : item.badge === 'Beta' ? 'secondary' : 'default'}
              className="text-xs"
            >
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleItem(item.id)
              }}
              className="p-1 hover:bg-accent rounded transition-colors"
              tabIndex={-1}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}
    </>
  )

  const linkElement = (
    <Link
      to={item.href}
      onClick={handleItemClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isChild && "ml-4 pl-6",
        isCollapsed && "justify-center px-2",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
        item.disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-disabled={item.disabled}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-label={isCollapsed ? item.label : undefined}
    >
      {linkContent}
    </Link>
  )

  return (
    <div>
      {isCollapsed && !isChild ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {linkElement}
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <div>
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-xs opacity-70">{item.description}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        linkElement
      )}

      {hasChildren && isExpanded && !isCollapsed && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              isActive={currentPath === child.href}
              isChild={true}
              onItemClick={onItemClick}
              currentPath={currentPath}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              onToggleItem={onToggleItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NavigationDomainItem({ 
  domain, 
  isActive, 
  onItemClick, 
  currentPath, 
  isCollapsed = false,
  expandedDomains,
  onToggleDomain
}: NavigationDomainItemProps) {
  const isExpanded = expandedDomains[domain.id] || false
  const [expandedItems, setExpandedItems] = useLocalStorage<Record<string, boolean>>(
    `sidebar-expanded-items-${domain.id}`, 
    {}
  )
  
  const DomainIcon = domain.icon

  const handleToggleItem = useCallback((itemId: string) => {
    setExpandedItems((prev: Record<string, boolean>) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }, [setExpandedItems])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleDomain(domain.id)
    }
  }

  const buttonContent = (
    <>
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <DomainIcon className={cn(
          "h-5 w-5 flex-shrink-0",
          isCollapsed && "h-4 w-4"
        )} />
        {!isCollapsed && (
          <>
            <span className="truncate">{domain.label}</span>
            {domain.beta && (
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            )}
          </>
        )}
      </div>
      {!isCollapsed && (
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform duration-200",
          isExpanded && "rotate-90"
        )} />
      )}
    </>
  )

  return (
    <Collapsible open={isExpanded && !isCollapsed} onOpenChange={() => onToggleDomain(domain.id)}>
      <div className="space-y-1">
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn(
                    "flex items-center justify-center w-full px-2 py-3 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive 
                      ? `pp-nav-${domain.color} text-white` 
                      : "text-foreground hover:bg-accent"
                  )}
                  onKeyDown={handleKeyDown}
                  aria-label={domain.label}
                >
                  {buttonContent}
                </CollapsibleTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <div>
                  <div className="font-medium">{domain.label}</div>
                  {domain.description && (
                    <div className="text-xs opacity-70">{domain.description}</div>
                  )}
                  {domain.beta && (
                    <div className="text-xs text-warning-foreground">Beta</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <CollapsibleTrigger
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              isActive 
                ? `pp-nav-${domain.color} text-white` 
                : "text-foreground hover:bg-accent"
            )}
            onKeyDown={handleKeyDown}
          >
            {buttonContent}
          </CollapsibleTrigger>
        )}

        <CollapsibleContent className="space-y-1">
          <div className={cn("space-y-1", !isCollapsed && "ml-4")}>
            {domain.items.map((item) => (
              <NavigationItemComponent
                key={item.id}
                item={item}
                isActive={currentPath === item.href}
                onItemClick={onItemClick}
                currentPath={currentPath}
                isCollapsed={isCollapsed}
                expandedItems={expandedItems}
                onToggleItem={handleToggleItem}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// Mobile Sidebar Component
function MobileSidebar({ 
  isOpen, 
  onClose, 
  activeDomainId, 
  currentPath, 
  expandedDomains, 
  onToggleDomain 
}: {
  isOpen: boolean
  onClose: () => void
  activeDomainId: string | null
  currentPath: string
  expandedDomains: Record<string, boolean>
  onToggleDomain: (domainId: string) => void
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-forecast flex items-center justify-center">
              <span className="text-white font-bold text-sm">PP</span>
            </div>
            <div>
              <SheetTitle className="text-left">Pipeline Pulse</SheetTitle>
              <p className="text-xs text-muted-foreground">Revenue Intelligence</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="space-y-4">
            {navigationDomains.map((domain) => (
              domain.enabled && (
                <NavigationDomainItem
                  key={domain.id}
                  domain={domain}
                  isActive={activeDomainId === domain.id}
                  onItemClick={onClose}
                  currentPath={currentPath}
                  isCollapsed={false}
                  expandedDomains={expandedDomains}
                  onToggleDomain={onToggleDomain}
                />
              )
            ))}
          </div>
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground">
            <p>Pipeline Pulse v2.0</p>
            <p>© 2024 1CloudHub</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Desktop Sidebar Component
function DesktopSidebar({ 
  isCollapsed = false,
  onToggleCollapse,
  activeDomainId, 
  currentPath, 
  expandedDomains, 
  onToggleDomain,
  className
}: {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  activeDomainId: string | null
  currentPath: string
  expandedDomains: Record<string, boolean>
  onToggleDomain: (domainId: string) => void
  className?: string
}) {
  return (
    <aside className={cn(
      "hidden md:flex flex-col h-full bg-background border-r transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-72",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center p-4 border-b",
        isCollapsed && "justify-center px-2"
      )}>
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-forecast flex items-center justify-center cursor-pointer">
                  <span className="text-white font-bold text-sm">PP</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <div>
                  <div className="font-medium">Pipeline Pulse</div>
                  <div className="text-xs opacity-70">Revenue Intelligence</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center space-x-3 flex-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-forecast flex items-center justify-center">
              <span className="text-white font-bold text-sm">PP</span>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">Pipeline Pulse</h2>
              <p className="text-xs text-muted-foreground">Revenue Intelligence</p>
            </div>
          </div>
        )}
        
        {onToggleCollapse && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggleCollapse}
                  className={cn(
                    "h-8 w-8 p-0",
                    isCollapsed && "mx-auto"
                  )}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "bottom"} className={isCollapsed ? "ml-2" : ""}>
                {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-2 overflow-y-auto",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <div className="space-y-4">
          {navigationDomains.map((domain) => (
            domain.enabled && (
              <NavigationDomainItem
                key={domain.id}
                domain={domain}
                isActive={activeDomainId === domain.id}
                onItemClick={() => {}}
                currentPath={currentPath}
                isCollapsed={isCollapsed}
                expandedDomains={expandedDomains}
                onToggleDomain={onToggleDomain}
              />
            )
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground">
            <p>Pipeline Pulse v2.0</p>
            <p>© 2024 1CloudHub</p>
          </div>
        </div>
      )}
    </aside>
  )
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  className, 
  isCollapsed = false, 
  onToggleCollapse 
}: SidebarProps) {
  const location = useLocation()
  
  // Persistent state for expanded domains
  const [expandedDomains, setExpandedDomains] = useLocalStorage<Record<string, boolean>>(
    'sidebar-expanded-domains', 
    {}
  )

  const getActiveDomain = useCallback(() => {
    for (const domain of navigationDomains) {
      for (const item of domain.items) {
        if (location.pathname.startsWith(item.href) || location.pathname === item.href) {
          return domain.id
        }
      }
    }
    return null
  }, [location.pathname])

  const activeDomainId = getActiveDomain()

  // Auto-expand active domain
  useEffect(() => {
    if (activeDomainId && !expandedDomains[activeDomainId]) {
      setExpandedDomains((prev: Record<string, boolean>) => ({
        ...prev,
        [activeDomainId]: true
      }))
    }
  }, [activeDomainId, expandedDomains, setExpandedDomains])

  const handleToggleDomain = useCallback((domainId: string) => {
    setExpandedDomains((prev: Record<string, boolean>) => ({
      ...prev,
      [domainId]: !prev[domainId]
    }))
  }, [setExpandedDomains])

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isOpen}
        onClose={onClose}
        activeDomainId={activeDomainId}
        currentPath={location.pathname}
        expandedDomains={expandedDomains}
        onToggleDomain={handleToggleDomain}
      />

      {/* Desktop Sidebar */}
      <DesktopSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        activeDomainId={activeDomainId}
        currentPath={location.pathname}
        expandedDomains={expandedDomains}
        onToggleDomain={handleToggleDomain}
        className={className}
      />
    </>
  )
}