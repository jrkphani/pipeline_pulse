import { Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Command,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/useAuthStore'
import { GlobalDataStatusIndicator } from '@/components/layout/GlobalDataStatusIndicator'

interface HeaderProps {
  onMenuToggle: () => void
  onCommandPaletteToggle: () => void
  className?: string
}

export function Header({ onMenuToggle, onCommandPaletteToggle, className }: HeaderProps) {
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container mx-auto px-4 lg:px-8 flex h-16 items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

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
          <Button
            variant="outline"
            onClick={onCommandPaletteToggle}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Search or jump to...</span>
            <span className="sm:hidden">Search...</span>
            <div className="ml-auto hidden sm:flex items-center space-x-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-2xs font-medium text-muted-foreground opacity-100">
                <Command className="h-3 w-3" />
              </kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-2xs font-medium text-muted-foreground opacity-100">
                K
              </kbd>
            </div>
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Global Sync Status */}
          <GlobalDataStatusIndicator />

          {/* Help */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/help" aria-label="Help and documentation">
              <HelpCircle className="h-5 w-5" />
            </Link>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-success to-forecast text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">
                    {user?.display_name || user?.full_name || 'Admin User'}
                  </div>
                  {user?.role && (
                    <div className="text-xs text-muted-foreground">
                      {user.role}
                    </div>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.display_name || user?.full_name || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'admin@example.com'}
                  </p>
                  {user?.role && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.role}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/help" className="flex w-full">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
