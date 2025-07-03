import { useNavigation } from '@/contexts/NavigationContext'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { Breadcrumbs } from './Breadcrumbs'

interface NavigationProps {
  children: React.ReactNode
}

export function Navigation({ children }: NavigationProps) {
  const { state, actions } = useNavigation()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={state.isOpen}
        onClose={actions.closeSidebar}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuToggle={actions.toggleSidebar}
          onCommandPaletteToggle={actions.toggleCommandPalette}
        />

        {/* Breadcrumbs */}
        {state.breadcrumbs.length > 0 && (
          <div className="border-b bg-muted/30">
            <div className="container mx-auto px-4 py-3 lg:px-8">
              <Breadcrumbs items={state.breadcrumbs} />
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={state.commandPaletteOpen}
        onClose={actions.closeCommandPalette}
      />
    </div>
  )
}