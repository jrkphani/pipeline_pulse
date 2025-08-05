import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { O2RPhaseIndicator } from '../o2r-phase-indicator'

describe('O2RPhaseIndicator', () => {
  it('renders all four phases', () => {
    render(<O2RPhaseIndicator currentPhase={2} />)
    
    expect(screen.getByText('Opportunity')).toBeInTheDocument()
    expect(screen.getByText('Qualified')).toBeInTheDocument()
    expect(screen.getByText('Proposal')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })

  it('shows current phase correctly', () => {
    render(<O2RPhaseIndicator currentPhase={3} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '3')
    expect(progressbar).toHaveAttribute('aria-valuetext', 'Phase 3 of 4: Proposal')
  })

  it('renders compact variant with short labels', () => {
    render(<O2RPhaseIndicator currentPhase={1} variant="compact" />)
    
    expect(screen.getByText('Opp')).toBeInTheDocument()
    expect(screen.getByText('Qual')).toBeInTheDocument()
    expect(screen.getByText('Prop')).toBeInTheDocument()
    expect(screen.getByText('Rev')).toBeInTheDocument()
  })

  it('hides labels when showLabels is false', () => {
    render(<O2RPhaseIndicator currentPhase={2} showLabels={false} />)
    
    expect(screen.queryByText('Opportunity')).not.toBeInTheDocument()
    expect(screen.queryByText('Qualified')).not.toBeInTheDocument()
    expect(screen.queryByText('Proposal')).not.toBeInTheDocument()
    expect(screen.queryByText('Revenue')).not.toBeInTheDocument()
  })

  it('supports different sizes', () => {
    const { rerender } = render(<O2RPhaseIndicator currentPhase={2} size="sm" />)
    
    let progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
    
    rerender(<O2RPhaseIndicator currentPhase={2} size="lg" />)
    progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <O2RPhaseIndicator currentPhase={2} className="custom-indicator" />
    )
    
    expect(container.firstChild).toHaveClass('custom-indicator')
  })

  it('is accessible with proper ARIA attributes', () => {
    render(<O2RPhaseIndicator currentPhase={2} />)
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-label', 'O2R Phase Progress')
    expect(progressbar).toHaveAttribute('aria-valuemin', '1')
    expect(progressbar).toHaveAttribute('aria-valuemax', '4')
    expect(progressbar).toHaveAttribute('aria-valuenow', '2')
    expect(progressbar).toHaveAttribute('aria-valuetext', 'Phase 2 of 4: Qualified')
  })

  it('shows completed phases correctly', () => {
    render(<O2RPhaseIndicator currentPhase={3} />)
    
    // Check that phase circles have appropriate ARIA labels
    const phaseElements = document.querySelectorAll('[role="img"]')
    expect(phaseElements).toHaveLength(4)
    
    // Phase 1 should be completed
    expect(phaseElements[0]).toHaveAttribute('aria-label', expect.stringContaining('(completed)'))
    // Phase 2 should be completed  
    expect(phaseElements[1]).toHaveAttribute('aria-label', expect.stringContaining('(completed)'))
    // Phase 3 should be current
    expect(phaseElements[2]).toHaveAttribute('aria-label', expect.stringContaining('(current)'))
    // Phase 4 should be upcoming
    expect(phaseElements[3]).toHaveAttribute('aria-label', expect.stringContaining('(upcoming)'))
  })

  it('handles all phase values correctly', () => {
    const phases = [1, 2, 3, 4] as const
    
    phases.forEach(phase => {
      const { rerender } = render(<O2RPhaseIndicator currentPhase={phase} />)
      
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', phase.toString())
      
      rerender(<></>)
    })
  })

  it('connector lines are hidden from screen readers', () => {
    render(<O2RPhaseIndicator currentPhase={2} />)
    
    const connectorLines = document.querySelectorAll('[aria-hidden="true"]')
    // Should have 3 connector lines between 4 phases
    expect(connectorLines.length).toBeGreaterThanOrEqual(3)
  })

  it('maintains consistent styling across sizes', () => {
    const { rerender } = render(<O2RPhaseIndicator currentPhase={2} size="sm" />)
    
    let container = document.querySelector('.flex.items-center')
    expect(container).toBeInTheDocument()
    
    rerender(<O2RPhaseIndicator currentPhase={2} size="lg" />)
    container = document.querySelector('.flex.items-center')
    expect(container).toBeInTheDocument()
  })
})