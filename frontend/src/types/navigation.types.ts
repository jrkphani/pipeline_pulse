import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: LucideIcon
  description?: string
  badge?: string | number
  active?: boolean
  children?: NavigationItem[]
  external?: boolean
  disabled?: boolean
  permission?: string
}

export interface NavigationDomain {
  id: string
  label: string
  description: string
  icon: LucideIcon
  color: string
  items: NavigationItem[]
  enabled: boolean
  beta?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export interface CommandPaletteItem {
  id: string
  label: string
  description?: string
  href: string
  icon?: LucideIcon
  keywords: string[]
  section: string
  priority: number
}

export interface NavigationState {
  isOpen: boolean
  isMobile: boolean
  currentPath: string
  breadcrumbs: BreadcrumbItem[]
  searchQuery: string
  commandPaletteOpen: boolean
  activeDomain?: string
}

export interface NavigationContextType {
  state: NavigationState
  navigation: NavigationDomain[]
  commandItems: CommandPaletteItem[]
  actions: {
    toggleSidebar: () => void
    closeSidebar: () => void
    openSidebar: () => void
    setCurrentPath: (path: string) => void
    setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
    toggleCommandPalette: () => void
    closeCommandPalette: () => void
    setSearchQuery: (query: string) => void
    setActiveDomain: (domainId: string) => void
  }
}

export interface NavigationConfig {
  domains: NavigationDomain[]
  settings: {
    enableCommandPalette: boolean
    enableBreadcrumbs: boolean
    enableSearch: boolean
    mobileBreakpoint: number
    collapsible: boolean
    defaultOpen: boolean
  }
}