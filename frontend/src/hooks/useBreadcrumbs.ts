import { useLocation } from 'react-router-dom'
import { BreadcrumbItem } from '@/types/navigation.types'

// Route to breadcrumb mapping
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/': [],
  '/dashboard': [
    { label: 'Dashboard', href: '/dashboard' }
  ],
  '/o2r': [
    { label: 'O2R Dashboard', href: '/o2r' }
  ],
  '/o2r/opportunities': [
    { label: 'O2R Dashboard', href: '/o2r' },
    { label: 'Opportunities', href: '/o2r/opportunities', current: true }
  ],
  '/analytics': [
    { label: 'Analytics', href: '/analytics' }
  ],
  '/analytics/country-pivot': [
    { label: 'Analytics', href: '/analytics' },
    { label: 'Country Pivot', href: '/analytics/country-pivot', current: true }
  ],
  '/analytics/account-manager': [
    { label: 'Analytics', href: '/analytics' },
    { label: 'Account Manager Performance', href: '/analytics/account-manager', current: true }
  ],
  '/crm': [
    { label: 'CRM Integration', href: '/crm' }
  ],
  '/crm/sync': [
    { label: 'CRM Integration', href: '/crm' },
    { label: 'Sync', href: '/crm/sync', current: true }
  ],
  '/live-sync': [
    { label: 'Live Sync', href: '/live-sync' }
  ],
  '/sync-status': [
    { label: 'Sync Status', href: '/sync-status' }
  ],
  '/bulk-update': [
    { label: 'Bulk Update', href: '/bulk-update' }
  ],
  '/settings': [
    { label: 'Settings', href: '/settings' }
  ],
  '/profile': [
    { label: 'Profile', href: '/profile' }
  ]
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation()
  const pathname = location.pathname

  // Get exact match first
  if (routeBreadcrumbs[pathname]) {
    return routeBreadcrumbs[pathname]
  }

  // Try to find a partial match for dynamic routes
  const segments = pathname.split('/').filter(Boolean)
  let breadcrumbs: BreadcrumbItem[] = []

  // Build breadcrumbs from segments
  for (let i = 0; i < segments.length; i++) {
    const path = '/' + segments.slice(0, i + 1).join('/')
    
    if (routeBreadcrumbs[path]) {
      breadcrumbs = [...routeBreadcrumbs[path]]
    } else {
      // Create a breadcrumb for unknown segments
      const label = segments[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      breadcrumbs.push({
        label,
        href: path,
        current: i === segments.length - 1
      })
    }
  }

  return breadcrumbs
}
