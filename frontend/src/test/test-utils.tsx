/**
 * Custom render wrapper for testing-library/react.
 * Re-exports everything from @testing-library/react plus a custom render
 * that wraps components in required providers.
 */
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

function AllProviders({ children }: { children: React.ReactNode }) {
  // Add providers here as they're needed (QueryClient, Router, etc.)
  return <>{children}</>
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render with custom version
export { customRender as render }
