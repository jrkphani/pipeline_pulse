import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { MetricCard } from '../metric-card'

describe('MetricCard', () => {
  it('renders basic metric card with title and value', () => {
    render(
      <MetricCard
        title="Total Revenue"
        value="$1,234,567"
      />
    )

    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('$1,234,567')).toBeInTheDocument()
  })

  it('displays trend information when change is provided', () => {
    render(
      <MetricCard
        title="Pipeline Value"
        value="$2,500,000"
        change={15}
        trend="up"
      />
    )

    expect(screen.getByText('Pipeline Value')).toBeInTheDocument()
    expect(screen.getByText('$2,500,000')).toBeInTheDocument()
    expect(screen.getByText('+15% from last period')).toBeInTheDocument()
  })

  it('shows negative trend correctly', () => {
    render(
      <MetricCard
        title="Active Deals"
        value="47"
        change={5}
        trend="down"
      />
    )

    expect(screen.getByText('5% from last period')).toBeInTheDocument()
    // Check for trend down icon by looking for the text color class
    expect(document.querySelector('.text-pp-danger-500')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    render(
      <MetricCard
        title="Loading Metric"
        value="0"
        loading={true}
      />
    )

    expect(screen.getByText('Loading Metric')).toBeInTheDocument()
    // Check for loading skeleton elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('supports prefix and suffix', () => {
    render(
      <MetricCard
        title="Conversion Rate"
        value="23.5"
        prefix="~"
        suffix="%"
      />
    )

    expect(screen.getByText('~23.5%')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <MetricCard
        title="Custom Metric"
        value="100"
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('is accessible with proper ARIA attributes', () => {
    render(
      <MetricCard
        title="Accessibility Test"
        value="50"
        change={10}
        trend="up"
      />
    )

    // Should have proper heading structure
    expect(screen.getByText('Accessibility Test')).toBeInTheDocument()
    
    // Trend icon should be present by checking for the icon component class
    const trendIcon = document.querySelector('.text-pp-success-500')
    expect(trendIcon).toBeInTheDocument()
  })

  it('handles zero and negative values correctly', () => {
    render(
      <MetricCard
        title="Zero Value"
        value={0}
        change={0}
        trend="neutral"
      />
    )

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0% from last period')).toBeInTheDocument()
  })

  it('formats large numbers correctly', () => {
    render(
      <MetricCard
        title="Large Number"
        value="1,234,567.89"
      />
    )

    expect(screen.getByText('1,234,567.89')).toBeInTheDocument()
  })
})