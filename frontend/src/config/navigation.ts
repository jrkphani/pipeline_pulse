import { 
  LayoutDashboard, 
  Target, 
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  Settings,
  User,
  HelpCircle,
  Users,
  Activity,
  Briefcase,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import type { NavigationConfig, UserRole } from '../types/navigation';

// Define user roles
export const USER_ROLES: Record<string, UserRole> = {
  EXECUTIVE: {
    id: 'executive',
    name: 'Executive',
    permissions: [
      'dashboard:executive:view',
      'analytics:executive:view',
      'finance:revenue:view',
      'o2r:health:view'
    ]
  },
  SALES_LEADER: {
    id: 'sales_leader',
    name: 'Sales Leader',
    permissions: [
      'dashboard:sales:view',
      'pipeline:all:view',
      'o2r:all:view',
      'analytics:sales:view',
      'gtm:all:view',
      'finance:forecast:view'
    ]
  },
  SALES_REP: {
    id: 'sales_rep',
    name: 'Sales Representative',
    permissions: [
      'dashboard:sales:view',
      'pipeline:my:view',
      'o2r:my:view',
      'gtm:journey:view',
      'finance:payments:view'
    ]
  },
  SALES_OPS: {
    id: 'sales_ops',
    name: 'Sales Operations',
    permissions: [
      'dashboard:operations:view',
      'pipeline:all:manage',
      'o2r:all:manage',
      'sync:all:manage',
      'bulk:all:manage',
      'analytics:all:view',
      'finance:all:view'
    ]
  },
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      'admin:all:manage',
      'sync:mappings:manage',
      'o2r:config:manage',
      'system:health:view'
    ]
  }
};

// Navigation configuration with role-based access
export const NAVIGATION_CONFIG: NavigationConfig = {
  sections: [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          description: 'Real-time pipeline insights',
          children: [
            {
              name: 'Executive View',
              href: '/dashboard/executive',
              icon: TrendingUp,
              description: 'High-level strategic overview'
            },
            {
              name: 'Sales View',
              href: '/dashboard/sales',
              icon: Target,
              description: 'Sales team performance'
            },
            {
              name: 'Operations View',
              href: '/dashboard/operations',
              icon: Activity,
              description: 'Operations insights'
            }
          ]
        }
      ]
    },
    {
      title: 'Sales',
      items: [
        {
          name: 'Pipeline',
          href: '/pipeline',
          icon: Target,
          description: 'Opportunity management',
          children: [
            {
              name: 'All Opportunities',
              href: '/pipeline/all',
              icon: Target,
              description: 'Complete pipeline view'
            },
            {
              name: 'My Opportunities',
              href: '/pipeline/my',
              icon: User,
              description: 'Your opportunities'
            }
          ]
        },
        {
          name: 'O2R Tracker',
          href: '/o2r',
          icon: TrendingUp,
          description: 'Opportunity-to-Revenue tracking',
          children: [
            {
              name: 'Phase Overview',
              href: '/o2r/phases',
              icon: Activity,
              description: 'Four-phase progression'
            },
            {
              name: 'Health Dashboard',
              href: '/o2r/health',
              icon: Gauge,
              description: 'Deal health monitoring'
            },
            {
              name: 'Attention Required',
              href: '/o2r/attention',
              icon: AlertTriangle,
              description: 'Items needing attention',
              badge: '3'
            }
          ]
        }
      ]
    },
    {
      title: 'Finance',
      items: [
        {
          name: 'Financial Intelligence',
          href: '/finance',
          icon: DollarSign,
          description: 'Financial insights',
          children: [
            {
              name: 'Revenue Dashboard',
              href: '/finance/revenue',
              icon: TrendingUp,
              description: 'Revenue tracking'
            },
            {
              name: 'Currency Management',
              href: '/finance/currency',
              icon: DollarSign,
              description: 'Multi-currency tools'
            }
          ]
        },
        {
          name: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          description: 'Advanced analytics',
          children: [
            {
              name: 'Executive Reports',
              href: '/analytics/executive',
              icon: Briefcase,
              description: 'Executive reporting'
            },
            {
              name: 'Sales Performance',
              href: '/analytics/sales',
              icon: Target,
              description: 'Sales analytics'
            }
          ]
        }
      ]
    },
    {
      title: 'Operations',
      items: [
        {
          name: 'Sync Control',
          href: '/sync',
          icon: RefreshCw,
          description: 'Data synchronization',
          children: [
            {
              name: 'Sync Dashboard',
              href: '/sync/dashboard',
              icon: Gauge,
              description: 'Sync overview'
            },
            {
              name: 'Manual Sync',
              href: '/sync/manual',
              icon: RefreshCw,
              description: 'Manual sync tools'
            }
          ]
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          name: 'Administration',
          href: '/admin',
          icon: Settings,
          description: 'System administration',
          children: [
            {
              name: 'User Management',
              href: '/admin/users',
              icon: Users,
              description: 'User accounts'
            },
            {
              name: 'System Health',
              href: '/admin/health',
              icon: Activity,
              description: 'Health monitoring'
            }
          ]
        }
      ]
    },
    {
      title: 'Utilities',
      items: [
        {
          name: 'Profile',
          href: '/profile',
          icon: User,
          description: 'User profile'
        },
        {
          name: 'Help',
          href: '/help',
          icon: HelpCircle,
          description: 'Support & docs'
        }
      ]
    }
  ],
  
  // Role-based access control
  roleBasedAccess: {
    [USER_ROLES.EXECUTIVE.id]: [
      '/dashboard/executive',
      '/analytics/executive',
      '/finance/revenue',
      '/o2r/health'
    ],
    [USER_ROLES.SALES_LEADER.id]: [
      '/dashboard',
      '/dashboard/sales',
      '/pipeline',
      '/pipeline/all',
      '/o2r',
      '/analytics/sales',
      '/finance'
    ],
    [USER_ROLES.SALES_REP.id]: [
      '/dashboard',
      '/dashboard/sales',
      '/pipeline/my',
      '/o2r/phases'
    ],
    [USER_ROLES.SALES_OPS.id]: [
      '/dashboard/operations',
      '/pipeline',
      '/o2r',
      '/sync',
      '/analytics',
      '/finance'
    ],
    [USER_ROLES.ADMIN.id]: [
      '/admin',
      '/admin/users',
      '/admin/health'
    ]
  }
};

// Helper function to get navigation items for a specific role
export const getNavigationForRole = (roleId: string) => {
  const allowedRoutes = NAVIGATION_CONFIG.roleBasedAccess[roleId] || [];
  
  return NAVIGATION_CONFIG.sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      // Check if the main item is allowed
      const isMainItemAllowed = allowedRoutes.some(route => item.href.startsWith(route));
      
      if (!isMainItemAllowed) return false;
      
      // Filter children based on allowed routes
      if (item.children) {
        item.children = item.children.filter(child =>
          allowedRoutes.some(route => child.href.startsWith(route))
        );
      }
      
      return true;
    })
  })).filter(section => section.items.length > 0);
};

// Helper function to check if a route is accessible for a role
export const canAccessRoute = (roleId: string, route: string): boolean => {
  const allowedRoutes = NAVIGATION_CONFIG.roleBasedAccess[roleId] || [];
  return allowedRoutes.some(allowedRoute => route.startsWith(allowedRoute));
};