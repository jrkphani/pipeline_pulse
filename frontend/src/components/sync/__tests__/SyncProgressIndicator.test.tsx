import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { SyncProgressIndicator } from '../SyncProgressIndicator'
import { mockSyncProgress } from '@/test/test-utils'

// Mock the useRealTimeSync hook
vi.mock('@/hooks/useRealTimeSync', () => ({
  useRealTimeSync: vi.fn()
}))

import { useRealTimeSync } from '@/hooks/useRealTimeSync'

const mockUseRealTimeSync = useRealTimeSync as any

describe('SyncProgressIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "No active sync" when no session ID provided', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: null,
      isConnected: false,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator />)
    
    expect(screen.getByText('No active sync')).toBeInTheDocument()
  })

  it('shows connection error when error occurs', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: null,
      isConnected: false,
      error: 'Network connection failed',
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText('Connection error: Network connection failed')).toBeInTheDocument()
  })

  it('displays sync progress correctly', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: mockSyncProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('full sync')).toBeInTheDocument()
    expect(screen.getByText('Processing opportunities')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows progress bar for in-progress sync', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: mockSyncProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '50')
    expect(progressbar).toHaveAttribute('aria-valuetext', '50% complete, Processing opportunities')
  })

  it('displays records processed information', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: mockSyncProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText('Processed 500 of 1,000 records')).toBeInTheDocument()
  })

  it('shows connection status indicator', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: mockSyncProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    const connectionIndicator = document.querySelector('[role="status"][aria-label*="Connected"]')
    expect(connectionIndicator).toBeInTheDocument()
  })

  it('displays failed sync error message', () => {
    const failedProgress = {
      ...mockSyncProgress,
      status: 'failed' as const,
      errorMessage: 'API rate limit exceeded'
    }

    mockUseRealTimeSync.mockReturnValue({
      syncProgress: failedProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument()
  })

  it('shows estimated completion time', () => {
    const progressWithETA = {
      ...mockSyncProgress,
      estimatedCompletion: '2024-01-15T10:05:00Z'
    }

    mockUseRealTimeSync.mockReturnValue({
      syncProgress: progressWithETA,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText(/Est\. completion:/)).toBeInTheDocument()
  })

  it('displays completed sync status', () => {
    const completedProgress = {
      ...mockSyncProgress,
      status: 'completed' as const,
      progress: 100
    }

    mockUseRealTimeSync.mockReturnValue({
      syncProgress: completedProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: mockSyncProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    const { container } = render(
      <SyncProgressIndicator sessionId="test-session" className="custom-sync" />
    )
    
    expect(container.firstChild).toHaveClass('custom-sync')
  })

  it('is accessible with proper ARIA attributes', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: mockSyncProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    const region = screen.getByRole('region')
    expect(region).toHaveAttribute('aria-labelledby', 'sync-progress-title')
    expect(region).toHaveAttribute('aria-live', 'polite')
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-label', 'Sync progress: 50% complete')
  })

  it('handles disconnected state', () => {
    mockUseRealTimeSync.mockReturnValue({
      syncProgress: mockSyncProgress,
      isConnected: false,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    const connectionIndicator = document.querySelector('[aria-label*="Disconnected"]')
    expect(connectionIndicator).toBeInTheDocument()
  })

  it('shows pending status correctly', () => {
    const pendingProgress = {
      ...mockSyncProgress,
      status: 'pending' as const,
      progress: 0
    }

    mockUseRealTimeSync.mockReturnValue({
      syncProgress: pendingProgress,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('handles records processed without total', () => {
    const progressWithoutTotal = {
      ...mockSyncProgress,
      recordsTotal: undefined
    }

    mockUseRealTimeSync.mockReturnValue({
      syncProgress: progressWithoutTotal,
      isConnected: true,
      error: null,
      disconnect: vi.fn()
    })

    render(<SyncProgressIndicator sessionId="test-session" />)
    
    expect(screen.getByText('Processed 500 records')).toBeInTheDocument()
  })
})