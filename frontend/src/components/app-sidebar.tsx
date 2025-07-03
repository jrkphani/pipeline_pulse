import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { SearchForm } from "@/components/search-form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import { navigationDomains } from "@/data/navigation.data"
import { NavigationDomain, NavigationItem } from "@/types/navigation.types"

// Helper function to check if a path is active
const isPathActive = (itemPath: string, currentPath: string): boolean => {
  if (itemPath === '/') {
    return currentPath === '/'
  }
  return currentPath.startsWith(itemPath)
}

// Helper function to check if any child item is active
const hasActiveChild = (items: NavigationItem[], currentPath: string): boolean => {
  return items.some(item => {
    if (isPathActive(item.path, currentPath)) return true
    if (item.children) return hasActiveChild(item.children, currentPath)
    return false
  })
}

// Render navigation item component
const NavigationItemComponent: React.FC<{
  item: NavigationItem
  currentPath: string
  level?: number
}> = ({ item, currentPath, level = 0 }) => {
  const isActive = isPathActive(item.path, currentPath)
  const hasChildren = item.children && item.children.length > 0
  const hasActiveChildren = hasChildren ? hasActiveChild(item.children!, currentPath) : false
  const shouldExpand = hasActiveChildren || isActive

  if (hasChildren) {
    return (
      <Collapsible defaultOpen={shouldExpand}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={isActive}
              className={level > 0 ? "pl-6" : ""}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
              <ChevronRightIcon className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenu>
              {item.children!.map((child) => (
                <NavigationItemComponent
                  key={child.id}
                  item={child}
                  currentPath={currentPath}
                  level={level + 1}
                />
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className={level > 0 ? "pl-6" : ""}>
        <Link to={item.path}>
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">PP</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Pipeline Pulse</span>
            <span className="text-xs text-muted-foreground">O2R Tracker</span>
          </div>
        </div>
        <SearchForm />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Navigation Domains */}
        {navigationDomains
          .filter(domain => domain.enabled)
          .map((domain) => {
            const hasActiveDomainItem = hasActiveChild(domain.items, currentPath)

            return (
              <Collapsible
                key={domain.id}
                defaultOpen={hasActiveDomainItem}
                className="group/collapsible"
              >
                <SidebarGroup>
                  <SidebarGroupLabel
                    asChild
                    className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <domain.icon className="h-4 w-4" />
                        <span>{domain.label}</span>
                        {domain.beta && (
                          <Badge variant="secondary" className="text-xs">
                            Beta
                          </Badge>
                        )}
                      </div>
                      <ChevronRightIcon className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {domain.items.map((item) => (
                          <NavigationItemComponent
                            key={item.id}
                            item={item}
                            currentPath={currentPath}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )
          })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted">
                  <span className="text-xs">⚙️</span>
                </div>
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
