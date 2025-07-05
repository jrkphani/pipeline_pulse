import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { StatusBadge } from '../status-badge'

describe('StatusBadge', () => {
  it('renders success status badge', () => {
    render(<StatusBadge status="success" />)
    
    expect(screen.getByText('On Track')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: On Track')
  })

  it('renders warning status badge', () => {
    render(<StatusBadge status="warning" />)
    
    expect(screen.getByText('Attention Required')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Attention Required')
  })

  it('renders danger status badge', () => {
    render(<StatusBadge status="danger" />)
    
    expect(screen.getByText('Critical Issues')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Critical Issues')
  })

  it('renders neutral/blocked status badge', () => {
    render(<StatusBadge status="neutral" />)
    
    expect(screen.getByText('Blocked')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Blocked')
  })

  it('accepts custom label', () => {
    render(<StatusBadge status="success" label="Custom Status" />)
    
    expect(screen.getByText('Custom Status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Custom Status')
  })

  it('maps health status to semantic status', () => {
    render(<StatusBadge healthStatus="green" />)
    
    expect(screen.getByText('On Track')).toBeInTheDocument()
  })

  it('renders different sizes', () => {
    const { rerender } = render(<StatusBadge status="success" size="sm" />)
    
    let badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    
    rerender(<StatusBadge status="success" size="lg" />)
    badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
  })

  it('shows icon by default', () => {
    render(<StatusBadge status="success" />)
    
    // Should have a dot indicator
    const dot = document.querySelector('span[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('hides icon when showIcon is false', () => {
    render(<StatusBadge status="success" showIcon={false} />)
    
    // Should not have the dot indicator
    const dot = document.querySelector('span[aria-hidden="true"]')
    expect(dot).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<StatusBadge status="success" className="custom-badge" />)
    
    const badge = screen.getByRole('status')
    expect(badge).toHaveClass('custom-badge')
  })

  it('is accessible with proper ARIA attributes', () => {
    render(<StatusBadge status="danger" />)
    
    const badge = screen.getByRole('status')
    expect(badge).toHaveAttribute('aria-label', 'Status: Critical Issues')
    
    // Icon should be hidden from screen readers
    const icon = document.querySelector('span[aria-hidden="true"]')
    expect(icon).toBeInTheDocument()
  })

  it('handles health status mapping correctly', () => {
    const { rerender } = render(<StatusBadge healthStatus="green" />)
    expect(screen.getByText('On Track')).toBeInTheDocument()
    
    rerender(<StatusBadge healthStatus="yellow" />)
    expect(screen.getByText('Attention Required')).toBeInTheDocument()
    
    rerender(<StatusBadge healthStatus="red" />)
    expect(screen.getByText('Critical Issues')).toBeInTheDocument()
    
    rerender(<StatusBadge healthStatus="blocked" />)
    expect(screen.getByText('Blocked')).toBeInTheDocument()
  })

  it('prioritizes status prop over healthStatus prop', () => {
    render(<StatusBadge status="success" healthStatus="red" />)
    
    // Should show success status, not the red health status
    expect(screen.getByText('On Track')).toBeInTheDocument()
  })
})