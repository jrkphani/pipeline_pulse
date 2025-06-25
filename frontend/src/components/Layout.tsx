import { NavigationProvider } from '@/contexts/NavigationContext'
import { Navigation } from '@/components/navigation/Navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <NavigationProvider>
      <Navigation>
        {children}
      </Navigation>
    </NavigationProvider>
  )
}
