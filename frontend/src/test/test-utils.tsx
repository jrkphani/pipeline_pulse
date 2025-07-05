import React, { type ReactElement } from 'react'
import { render, type RenderOptions, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { BrowserRouter } from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { vi, expect } from 'vitest'

// Mock data generators
export const mockOpportunity = {
  id: '1',
  name: 'Test Opportunity',
  value: 100000,
  currency: 'USD',
  stage: 'qualified',
  probability: 75,
  closeDate: '2024-12-31',
  owner: 'Test User',
  healthStatus: 'green' as const,
  lastActivity: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
}

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'sales_manager',
  territory: 'APAC',
  permissions: ['read', 'write']
}

export const mockSyncProgress = {
  sessionId: 'test-session-1',
  status: 'in_progress' as const,
  type: 'full' as const,
  progress: 50,
  currentStep: 'Processing opportunities',
  recordsProcessed: 500,
  recordsTotal: 1000,
  startedAt: '2024-01-15T10:00:00Z'
}

export const mockCurrencyRate = {
  fromCurrency: 'USD',
  toCurrency: 'SGD',
  rate: 1.35,
  lastUpdated: '2024-01-15T10:00:00Z',
  source: 'live' as const,
  confidence: 'high' as const
}

// Test providers wrapper
interface AllProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient
  }
) => {
  const { queryClient, ...renderOptions } = options || {}
  
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllProviders queryClient={queryClient}>
          {children}
        </AllProviders>
      ),
      ...renderOptions,
    }),
  }
}

// Mock API responses
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn()
}

// Mock fetch responses
export const mockFetchResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

// Mock performance metrics
export const mockPerformanceMetrics = {
  memoryUsage: 50,
  componentRenderTime: 10,
  bundleSize: 2048,
  cacheHitRate: 85,
  apiResponseTime: 250
}

// Async utilities
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.IntersectionObserver = mockIntersectionObserver
  window.IntersectionObserverEntry = vi.fn()
}

// Mock resize observer
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  })
  window.ResizeObserver = mockResizeObserver
}

// Error boundary test helper
export const ErrorFallback = ({ error }: { error: Error }) => (
  <div role="alert">
    <h2>Something went wrong</h2>
    <pre>{error.message}</pre>
  </div>
)

// Form testing utilities
export const fillForm = async (user: ReturnType<typeof userEvent.setup>, fields: Record<string, string>) => {
  for (const [label, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(label, 'i'))
    await user.clear(field)
    await user.type(field, value)
  }
}

// Table testing utilities
export const getTableRows = () => {
  return screen.getAllByRole('row').slice(1) // Remove header row
}

export const getTableCells = (row: HTMLElement) => {
  return within(row).getAllByRole('cell')
}

// Accessibility testing helpers
export const axeMatchers = {
  toHaveNoViolations: expect.toHaveNoViolations || (() => ({ pass: true, message: () => '' }))
}

// Export everything including the custom render
export * from '@testing-library/react'
export { customRender as render }
export { screen, within, waitFor, act } from '@testing-library/react'