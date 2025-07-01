import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Command
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'

interface HeaderProps {
  onMenuToggle: () => void
  onCommandPaletteToggle: () => void
  className?: string
}

export function Header({ onMenuToggle, onCommandPaletteToggle, className }: HeaderProps) {
  const [notificationCount] = useState(3)

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="pp-container flex h-16 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </EnhancedButton>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-forecast flex items-center justify-center">
              <span className="text-white font-bold text-sm">PP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-lg">Pipeline Pulse</h1>
              <p className="text-xs text-muted-foreground -mt-1">Revenue Intelligence Platform</p>
            </div>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <EnhancedButton
            variant="outline"
            onClick={onCommandPaletteToggle}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Search or jump to...</span>
            <span className="sm:hidden">Search...</span>
            <div className="ml-auto hidden sm:flex items-center space-x-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <Command className="h-3 w-3" />
              </kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                K
              </kbd>
            </div>
          </EnhancedButton>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <EnhancedButton variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <EnhancedBadge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
              >
                {notificationCount}
              </EnhancedBadge>
            )}
            <span className="sr-only">Notifications</span>
          </EnhancedButton>

          {/* Help */}
          <EnhancedButton variant="ghost" size="sm" asChild>
            <Link to="/help" aria-label="Help and documentation">
              <HelpCircle className="h-5 w-5" />
            </Link>
          </EnhancedButton>

          {/* Settings */}
          <EnhancedButton variant="ghost" size="sm" asChild>
            <Link to="/settings" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Link>
          </EnhancedButton>

          {/* User Menu */}
          <div className="relative">
            <EnhancedButton variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-success to-forecast flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">Admin User</span>
            </EnhancedButton>
            {/* User dropdown would be implemented here */}
          </div>
        </div>
      </div>
    </header>
  )
}