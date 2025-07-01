import {
  BarChart3,
  Target,
  TrendingUp,
  Database,
  Users,
  Workflow,
  Settings,
  Upload,
  RefreshCw,
  DollarSign,
  Globe,
  Filter,
  Calendar,
  FileText,
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  PieChart,
  LineChart,
  Activity,
  Briefcase,
  Phone,
  Mail,
  UserPlus,
  Building2,
  Archive,
  Download,
  Search,
  Bell,
  HelpCircle
} from 'lucide-react'

import { NavigationDomain, CommandPaletteItem } from '@/types/navigation.types'

export const navigationDomains: NavigationDomain[] = [
  {
    id: 'revenue-intelligence',
    label: 'Revenue Intelligence Hub',
    description: 'AI-powered revenue insights and forecasting',
    icon: TrendingUp,
    color: 'pp-nav-intelligence',
    enabled: true,
    beta: false,
    items: [
      {
        id: 'revenue-dashboard',
        label: 'Revenue Dashboard',
        href: '/revenue',
        icon: TrendingUp,
        description: 'Real-time revenue performance and trends'
      },
      {
        id: 'forecasting',
        label: 'AI Forecasting',
        href: '/revenue/forecasting',
        icon: Zap,
        description: 'Machine learning revenue predictions',
        badge: 'AI'
      },
      {
        id: 'pipeline-health',
        label: 'Pipeline Health Score',
        href: '/revenue/health',
        icon: Activity,
        description: 'Pipeline quality and risk assessment'
      },
      {
        id: 'win-loss',
        label: 'Win/Loss Analysis',
        href: '/revenue/win-loss',
        icon: BarChart3,
        description: 'Deal outcome analysis and insights'
      },
      {
        id: 'revenue-attribution',
        label: 'Revenue Attribution',
        href: '/revenue/attribution',
        icon: PieChart,
        description: 'Source and channel attribution analysis'
      }
    ]
  },
  {
    id: 'o2r-tracker',
    label: 'O2R Tracker',
    description: 'Opportunity-to-Revenue lifecycle tracking',
    icon: Target,
    color: 'pp-nav-o2r',
    enabled: true,
    beta: false,
    items: [
      {
        id: 'o2r-dashboard',
        label: 'O2R Dashboard',
        href: '/o2r',
        icon: Target,
        description: 'Complete opportunity lifecycle view'
      },
      {
        id: 'opportunity-flow',
        label: 'Opportunity Flow',
        href: '/o2r/flow',
        icon: Workflow,
        description: 'Visual pipeline flow and stage analysis'
      },
      {
        id: 'conversion-metrics',
        label: 'Conversion Metrics',
        href: '/o2r/conversions',
        icon: TrendingUp,
        description: 'Stage conversion rates and velocity'
      },
      {
        id: 'deal-insights',
        label: 'Deal Insights',
        href: '/o2r/insights',
        icon: Zap,
        description: 'AI-powered deal recommendations',
        badge: 'Smart'
      },
      {
        id: 'revenue-realization',
        label: 'Revenue Realization',
        href: '/o2r/realization',
        icon: CheckCircle,
        description: 'Closed-won to revenue tracking'
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    description: 'Comprehensive business intelligence and reporting',
    icon: BarChart3,
    color: 'pp-nav-analytics',
    enabled: true,
    beta: false,
    items: [
      {
        id: 'executive-dashboard',
        label: 'Executive Dashboard',
        href: '/analytics',
        icon: BarChart3,
        description: 'High-level business performance metrics'
      },
      {
        id: 'sales-analytics',
        label: 'Sales Analytics',
        href: '/analytics/sales',
        icon: TrendingUp,
        description: 'Sales team and individual performance'
      },
      {
        id: 'custom-reports',
        label: 'Custom Reports',
        href: '/analytics/reports',
        icon: FileText,
        description: 'Build and schedule custom reports'
      },
      {
        id: 'data-explorer',
        label: 'Data Explorer',
        href: '/analytics/explorer',
        icon: Search,
        description: 'Interactive data exploration tool',
        badge: 'Beta'
      },
      {
        id: 'export-center',
        label: 'Export Center',
        href: '/analytics/exports',
        icon: Download,
        description: 'Data export and scheduling hub'
      }
    ]
  },
  {
    id: 'data-management',
    label: 'Data Management',
    description: 'Data sources, quality, and integration management',
    icon: Database,
    color: 'pp-nav-data',
    enabled: true,
    beta: false,
    items: [
      {
        id: 'data-sources',
        label: 'Data Sources',
        href: '/data',
        icon: Database,
        description: 'Connected systems and data sources'
      },
      {
        id: 'crm-sync',
        label: 'CRM Sync',
        href: '/data/crm-sync',
        icon: RefreshCw,
        description: 'Real-time CRM data synchronization'
      },
      {
        id: 'data-quality',
        label: 'Data Quality',
        href: '/data/quality',
        icon: Shield,
        description: 'Data validation and quality monitoring'
      },
      {
        id: 'field-mapping',
        label: 'Field Mapping',
        href: '/data/mapping',
        icon: Filter,
        description: 'Configure data field mappings'
      },
      {
        id: 'sync-history',
        label: 'Sync History',
        href: '/data/history',
        icon: Clock,
        description: 'Data synchronization logs and history'
      }
    ]
  },
  {
    id: 'crm-operations',
    label: 'CRM Operations',
    description: 'CRM data management and operational tools',
    icon: Users,
    color: 'pp-nav-crm',
    enabled: true,
    beta: false,
    items: [
      {
        id: 'crm-dashboard',
        label: 'CRM Overview',
        href: '/crm',
        icon: Users,
        description: 'CRM system status and overview'
      },
      {
        id: 'contact-management',
        label: 'Contact Management',
        href: '/crm/contacts',
        icon: UserPlus,
        description: 'Contact and lead management'
      },
      {
        id: 'account-management',
        label: 'Account Management',
        href: '/crm/accounts',
        icon: Building2,
        description: 'Account and company management'
      },
      {
        id: 'activity-tracking',
        label: 'Activity Tracking',
        href: '/crm/activities',
        icon: Calendar,
        description: 'Sales activities and engagement tracking'
      },
      {
        id: 'communication-center',
        label: 'Communication Center',
        href: '/crm/communications',
        icon: Mail,
        description: 'Email and call management'
      }
    ]
  },
  {
    id: 'workflow',
    label: 'Workflow & Automation',
    description: 'Process automation and workflow management',
    icon: Workflow,
    color: 'pp-nav-workflow',
    enabled: true,
    beta: true,
    items: [
      {
        id: 'workflow-dashboard',
        label: 'Workflow Center',
        href: '/workflow',
        icon: Workflow,
        description: 'Automation workflows and triggers'
      },
      {
        id: 'alert-management',
        label: 'Smart Alerts',
        href: '/workflow/alerts',
        icon: Bell,
        description: 'Intelligent deal and pipeline alerts'
      },
      {
        id: 'notification-center',
        label: 'Notifications',
        href: '/workflow/notifications',
        icon: AlertTriangle,
        description: 'System and deal notifications'
      },
      {
        id: 'task-automation',
        label: 'Task Automation',
        href: '/workflow/tasks',
        icon: Zap,
        description: 'Automated task creation and assignment',
        badge: 'New'
      },
      {
        id: 'process-builder',
        label: 'Process Builder',
        href: '/workflow/builder',
        icon: Settings,
        description: 'Visual workflow designer',
        disabled: true
      }
    ]
  },
  {
    id: 'administration',
    label: 'Administration',
    description: 'System configuration and user management',
    icon: Settings,
    color: 'pp-nav-admin',
    enabled: true,
    beta: false,
    items: [
      {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        href: '/admin',
        icon: Settings,
        description: 'System administration overview',
        permission: 'admin'
      },
      {
        id: 'user-management',
        label: 'User Management',
        href: '/admin/users',
        icon: Users,
        description: 'User accounts and permissions',
        permission: 'admin'
      },
      {
        id: 'system-settings',
        label: 'System Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'Global system configuration',
        permission: 'admin'
      },
      {
        id: 'integration-settings',
        label: 'Integrations',
        href: '/admin/integrations',
        icon: Globe,
        description: 'Third-party integrations and APIs',
        permission: 'admin'
      },
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        href: '/admin/audit',
        icon: Archive,
        description: 'System activity and security logs',
        permission: 'admin'
      },
      {
        id: 'support-center',
        label: 'Support Center',
        href: '/admin/support',
        icon: HelpCircle,
        description: 'Help documentation and support'
      }
    ]
  }
]

export const commandPaletteItems: CommandPaletteItem[] = [
  // Revenue Intelligence Hub
  {
    id: 'revenue-dashboard',
    label: 'Revenue Dashboard',
    description: 'View real-time revenue performance',
    href: '/revenue',
    icon: TrendingUp,
    keywords: ['revenue', 'dashboard', 'performance', 'sales'],
    section: 'Revenue Intelligence',
    priority: 10
  },
  {
    id: 'ai-forecasting',
    label: 'AI Forecasting',
    description: 'Machine learning revenue predictions',
    href: '/revenue/forecasting',
    icon: Zap,
    keywords: ['ai', 'forecast', 'prediction', 'machine learning'],
    section: 'Revenue Intelligence',
    priority: 9
  },
  
  // O2R Tracker
  {
    id: 'o2r-dashboard',
    label: 'O2R Dashboard',
    description: 'Opportunity-to-Revenue tracking',
    href: '/o2r',
    icon: Target,
    keywords: ['o2r', 'opportunity', 'revenue', 'pipeline'],
    section: 'O2R Tracker',
    priority: 10
  },
  {
    id: 'deal-insights',
    label: 'Deal Insights',
    description: 'AI-powered deal recommendations',
    href: '/o2r/insights',
    icon: Zap,
    keywords: ['deal', 'insights', 'recommendations', 'ai'],
    section: 'O2R Tracker',
    priority: 8
  },
  
  // Analytics
  {
    id: 'executive-dashboard',
    label: 'Executive Dashboard',
    description: 'High-level business metrics',
    href: '/analytics',
    icon: BarChart3,
    keywords: ['executive', 'analytics', 'dashboard', 'metrics'],
    section: 'Analytics',
    priority: 9
  },
  {
    id: 'custom-reports',
    label: 'Custom Reports',
    description: 'Build and schedule reports',
    href: '/analytics/reports',
    icon: FileText,
    keywords: ['reports', 'custom', 'analytics', 'schedule'],
    section: 'Analytics',
    priority: 7
  },
  
  // Data Management
  {
    id: 'upload-center',
    label: 'Upload Center',
    description: 'Upload CSV files for analysis',
    href: '/upload',
    icon: Upload,
    keywords: ['upload', 'csv', 'data', 'import'],
    section: 'Data Management',
    priority: 8
  },
  {
    id: 'crm-sync',
    label: 'CRM Sync',
    description: 'Synchronize CRM data',
    href: '/data/crm-sync',
    icon: RefreshCw,
    keywords: ['crm', 'sync', 'synchronize', 'zoho'],
    section: 'Data Management',
    priority: 8
  },
  
  // CRM Operations
  {
    id: 'contact-management',
    label: 'Contact Management',
    description: 'Manage contacts and leads',
    href: '/crm/contacts',
    icon: UserPlus,
    keywords: ['contacts', 'leads', 'crm', 'management'],
    section: 'CRM Operations',
    priority: 6
  },
  
  // Workflow
  {
    id: 'smart-alerts',
    label: 'Smart Alerts',
    description: 'Intelligent pipeline alerts',
    href: '/workflow/alerts',
    icon: Bell,
    keywords: ['alerts', 'notifications', 'smart', 'workflow'],
    section: 'Workflow',
    priority: 5
  },
  
  // Administration
  {
    id: 'user-management',
    label: 'User Management',
    description: 'Manage user accounts',
    href: '/admin/users',
    icon: Users,
    keywords: ['users', 'admin', 'accounts', 'permissions'],
    section: 'Administration',
    priority: 4
  },
  
  // Quick Actions
  {
    id: 'quick-upload',
    label: 'Quick Upload',
    description: 'Upload new data file',
    href: '/upload',
    icon: Upload,
    keywords: ['quick', 'upload', 'new', 'file'],
    section: 'Quick Actions',
    priority: 9
  },
  {
    id: 'sync-now',
    label: 'Sync CRM Now',
    description: 'Trigger immediate CRM sync',
    href: '/data/crm-sync?action=sync',
    icon: RefreshCw,
    keywords: ['sync', 'now', 'immediate', 'crm'],
    section: 'Quick Actions',
    priority: 7
  }
]