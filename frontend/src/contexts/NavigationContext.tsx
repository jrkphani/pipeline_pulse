import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { NavigationContextType, NavigationState, BreadcrumbItem } from '@/types/navigation.types'
import { navigationDomains, commandPaletteItems } from '@/data/navigation.data'

type NavigationAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }
  | { type: 'OPEN_SIDEBAR' }
  | { type: 'SET_MOBILE'; payload: boolean }
  | { type: 'SET_CURRENT_PATH'; payload: string }
  | { type: 'SET_BREADCRUMBS'; payload: BreadcrumbItem[] }
  | { type: 'TOGGLE_COMMAND_PALETTE' }
  | { type: 'CLOSE_COMMAND_PALETTE' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_ACTIVE_DOMAIN'; payload: string }

const initialState: NavigationState = {
  isOpen: false,
  isMobile: false,
  currentPath: '/',
  breadcrumbs: [],
  searchQuery: '',
  commandPaletteOpen: false,
  activeDomain: undefined
}

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isOpen: !state.isOpen }
    case 'CLOSE_SIDEBAR':
      return { ...state, isOpen: false }
    case 'OPEN_SIDEBAR':
      return { ...state, isOpen: true }
    case 'SET_MOBILE':
      return { ...state, isMobile: action.payload, isOpen: action.payload ? false : state.isOpen }
    case 'SET_CURRENT_PATH':
      return { ...state, currentPath: action.payload }
    case 'SET_BREADCRUMBS':
      return { ...state, breadcrumbs: action.payload }
    case 'TOGGLE_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: !state.commandPaletteOpen }
    case 'CLOSE_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: false }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'SET_ACTIVE_DOMAIN':
      return { ...state, activeDomain: action.payload }
    default:
      return state
  }
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const location = useLocation()

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = []
    
    // Special handling for dynamic routes
    if (pathname.startsWith('/analysis/')) {
      breadcrumbs.push({
        label: 'Analytics & Reports',
        href: '/analysis'
      })
      breadcrumbs.push({
        label: 'Analysis Report',
        current: true
      })
      return breadcrumbs
    }
    
    if (pathname.startsWith('/o2r/')) {
      breadcrumbs.push({
        label: 'O2R Tracker',
        href: '/o2r'
      })
      if (pathname === '/o2r/opportunities') {
        breadcrumbs.push({
          label: 'Opportunities',
          current: true
        })
      }
      return breadcrumbs
    }
    
    // Find matching navigation item for exact matches
    for (const domain of navigationDomains) {
      for (const item of domain.items) {
        if (pathname === item.href) {
          // For root pages, show domain and page
          if (pathname !== '/') {
            breadcrumbs.push({
              label: domain.label,
              href: domain.items[0]?.href
            })
          }
          breadcrumbs.push({
            label: item.label,
            current: true
          })
          return breadcrumbs
        }
      }
    }
    
    // Fallback for unknown routes
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length > 0) {
      segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' '),
          href: isLast ? undefined : `/${segments.slice(0, index + 1).join('/')}`,
          current: isLast
        })
      })
    }
    
    return breadcrumbs
  }

  // Get active domain based on current path
  const getActiveDomain = (pathname: string): string | undefined => {
    // Special handling for dynamic routes
    if (pathname.startsWith('/analysis/')) {
      return 'analytics'
    }
    if (pathname.startsWith('/o2r')) {
      return 'o2r-tracker'
    }
    if (pathname === '/' || pathname.startsWith('/dashboard')) {
      return 'revenue-intelligence'
    }
    if (pathname.startsWith('/crm-sync') || pathname.startsWith('/live-sync') || pathname.startsWith('/sync-status')) {
      return 'data-management'
    }
    
    // Exact match for other routes
    for (const domain of navigationDomains) {
      for (const item of domain.items) {
        if (pathname === item.href) {
          return domain.id
        }
      }
    }
    return undefined
  }

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      dispatch({ type: 'SET_MOBILE', payload: isMobile })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle route changes
  useEffect(() => {
    dispatch({ type: 'SET_CURRENT_PATH', payload: location.pathname })
    dispatch({ type: 'SET_BREADCRUMBS', payload: generateBreadcrumbs(location.pathname) })
    dispatch({ type: 'SET_ACTIVE_DOMAIN', payload: getActiveDomain(location.pathname) || '' })
    
    // Close sidebar on mobile when route changes
    if (state.isMobile) {
      dispatch({ type: 'CLOSE_SIDEBAR' })
    }
  }, [location.pathname, state.isMobile])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })
      }
      
      // Escape to close command palette
      if (e.key === 'Escape' && state.commandPaletteOpen) {
        dispatch({ type: 'CLOSE_COMMAND_PALETTE' })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.commandPaletteOpen])

  const actions = {
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    closeSidebar: () => dispatch({ type: 'CLOSE_SIDEBAR' }),
    openSidebar: () => dispatch({ type: 'OPEN_SIDEBAR' }),
    setCurrentPath: (path: string) => dispatch({ type: 'SET_CURRENT_PATH', payload: path }),
    setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => dispatch({ type: 'SET_BREADCRUMBS', payload: breadcrumbs }),
    toggleCommandPalette: () => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' }),
    closeCommandPalette: () => dispatch({ type: 'CLOSE_COMMAND_PALETTE' }),
    setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    setActiveDomain: (domainId: string) => dispatch({ type: 'SET_ACTIVE_DOMAIN', payload: domainId })
  }

  const contextValue: NavigationContextType = {
    state,
    navigation: navigationDomains,
    commandItems: commandPaletteItems,
    actions
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}