import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
// UserProfile component removed - direct access mode
import {
  BarChart3,
  Upload,
  RefreshCw,
  TrendingUp,
  Settings,
  Target,
  Edit3
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
    },
    {
      name: 'Upload CSV',
      href: '/upload',
      icon: Upload,
    },
    {
      name: 'CRM Sync',
      href: '/crm-sync',
      icon: RefreshCw,
    },
    {
      name: 'O2R Tracker',
      href: '/o2r',
      icon: Target,
    },
    {
      name: 'Bulk Update',
      href: '/bulk-update',
      icon: Edit3,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="flex h-16 items-center px-4 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">Pipeline Pulse</h1>
            </div>
          </div>
          
          <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === item.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {/* UserProfile removed - direct access mode */}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-2 md:flex-row md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 Pipeline Pulse. Built for revenue leaders.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Transform your CRM data into revenue insights</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
