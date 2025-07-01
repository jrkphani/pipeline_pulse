import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { navigationDomains } from '@/data/navigation.data'
import { NavigationDomain, NavigationItem } from '@/types/navigation.types'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface NavigationDomainItemProps {
  domain: NavigationDomain
  isActive: boolean
  onItemClick: () => void
  currentPath: string
}

interface NavigationItemComponentProps {
  item: NavigationItem
  isActive: boolean
  isChild?: boolean
  onItemClick: () => void
  currentPath: string
}

function NavigationItemComponent({ item, isActive, isChild = false, onItemClick, currentPath }: NavigationItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  const handleItemClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    } else {
      onItemClick()
    }
  }

  const ItemIcon = item.icon

  return (
    <div>
      <Link
        to={item.href}
        onClick={handleItemClick}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors group",
          isChild && "ml-4 pl-6",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
          item.disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-disabled={item.disabled}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {ItemIcon && (
            <ItemIcon className={cn(
              "h-4 w-4 flex-shrink-0",
              isActive && "text-primary-foreground"
            )} />
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate">{item.label}</span>
            {item.description && (
              <span className="block text-xs opacity-70 truncate">{item.description}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {item.badge && (
            <EnhancedBadge 
              variant={item.badge === 'New' ? 'success' : item.badge === 'Beta' ? 'warning' : 'secondary'}
              className="text-xs"
            >
              {item.badge}
            </EnhancedBadge>
          )}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault()
                setIsExpanded(!isExpanded)
              }}
              className="p-1 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </Link>

      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              isActive={currentPath === child.href}
              isChild={true}
              onItemClick={onItemClick}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NavigationDomainItem({ domain, isActive, onItemClick, currentPath }: NavigationDomainItemProps) {
  const [isExpanded, setIsExpanded] = useState(isActive)
  
  const DomainIcon = domain.icon

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
          isActive 
            ? `pp-nav-${domain.color} text-white` 
            : "text-foreground hover:bg-accent"
        )}
      >
        <div className="flex items-center space-x-3">
          <DomainIcon className="h-5 w-5" />
          <span>{domain.label}</span>
          {domain.beta && (
            <EnhancedBadge variant="warning" className="text-xs">
              Beta
            </EnhancedBadge>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="ml-4 space-y-1">
          {domain.items.map((item) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              isActive={currentPath === item.href}
              onItemClick={onItemClick}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const location = useLocation()

  const getActiveDomain = () => {
    for (const domain of navigationDomains) {
      for (const item of domain.items) {
        if (location.pathname.startsWith(item.href) || location.pathname === item.href) {
          return domain.id
        }
      }
    }
    return null
  }

  const activeDomainId = getActiveDomain()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-background border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b md:hidden">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-forecast flex items-center justify-center">
                <span className="text-white font-bold text-sm">PP</span>
              </div>
              <div>
                <h2 className="font-semibold">Pipeline Pulse</h2>
                <p className="text-xs text-muted-foreground">Revenue Intelligence</p>
              </div>
            </div>
            <EnhancedButton variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </EnhancedButton>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="space-y-4">
              {navigationDomains.map((domain) => (
                domain.enabled && (
                  <NavigationDomainItem
                    key={domain.id}
                    domain={domain}
                    isActive={activeDomainId === domain.id}
                    onItemClick={onClose}
                    currentPath={location.pathname}
                  />
                )
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <div className="text-xs text-muted-foreground">
              <p>Pipeline Pulse v2.0</p>
              <p>© 2024 1CloudHub</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}