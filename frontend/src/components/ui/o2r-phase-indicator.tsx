import * as React from 'react';
import { cn } from '../../lib/utils';

export interface O2RPhaseIndicatorProps {
  currentPhase: 1 | 2 | 3 | 4;
  className?: string;
  variant?: 'default' | 'compact';
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const phases = [
  { number: 1, label: 'Opportunity', shortLabel: 'Opp' },
  { number: 2, label: 'Qualified', shortLabel: 'Qual' },
  { number: 3, label: 'Proposal', shortLabel: 'Prop' },
  { number: 4, label: 'Revenue', shortLabel: 'Rev' },
] as const;

export const O2RPhaseIndicator = React.forwardRef<HTMLDivElement, O2RPhaseIndicatorProps>(
  ({ currentPhase, className, variant = 'default', showLabels = true, size = 'md', ...props }, ref) => {
    const isCompact = variant === 'compact';
    const sizeMap = {
      sm: { circle: 'var(--pp-space-5)', line: 'var(--pp-space-5)', font: 'var(--pp-font-size-xs)' },
      md: { circle: 'var(--pp-space-6)', line: 'var(--pp-space-6)', font: 'var(--pp-font-size-sm)' },
      lg: { circle: 'var(--pp-space-8)', line: 'var(--pp-space-8)', font: 'var(--pp-font-size-md)' }
    };
    const circleSize = isCompact ? sizeMap.sm.circle : sizeMap[size].circle;
    const lineWidth = isCompact ? sizeMap.sm.line : sizeMap[size].line;
    const fontSize = isCompact ? sizeMap.sm.font : sizeMap[size].font;

    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        style={{ gap: 'var(--pp-space-2)' }}
        role="progressbar"
        aria-label="O2R Phase Progress"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={currentPhase}
        aria-valuetext={`Phase ${currentPhase} of 4: ${phases[currentPhase - 1].label}`}
        {...props}
      >
        {phases.map((phase, index) => (
          <div key={phase.number} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* Phase Circle */}
              <div
                className="flex items-center justify-center rounded-full transition-all duration-200"
                role="img"
                aria-label={`Phase ${phase.number}: ${phase.label}${phase.number < currentPhase ? ' (completed)' : phase.number === currentPhase ? ' (current)' : ' (upcoming)'}`}
                style={{
                  width: circleSize,
                  height: circleSize,
                  fontSize: fontSize,
                  fontWeight: 'var(--pp-font-weight-semibold)',
                  backgroundColor:
                    phase.number <= currentPhase
                      ? 'var(--pp-color-primary-500)'
                      : 'var(--pp-color-neutral-100)',
                  color:
                    phase.number <= currentPhase
                      ? 'var(--pp-color-primary-50)'
                      : 'var(--pp-color-neutral-500)',
                  transition: `all var(--pp-duration-normal) var(--pp-ease-out)`,
                  border:
                    phase.number === currentPhase
                      ? '2px solid var(--pp-color-primary-600)'
                      : '2px solid transparent',
                }}
              >
                {phase.number}
              </div>

              {/* Phase Label */}
              {showLabels && (
                <span
                  style={{
                    fontSize: 'var(--pp-font-size-xs)',
                    fontWeight: 'var(--pp-font-weight-medium)',
                    color:
                      phase.number <= currentPhase
                        ? 'var(--pp-color-primary-600)'
                        : 'var(--pp-color-neutral-500)',
                    marginTop: 'var(--pp-space-1)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isCompact ? phase.shortLabel : phase.label}
                </span>
              )}
            </div>

            {/* Connector Line */}
            {index < phases.length - 1 && (
              <div
                style={{
                  marginLeft: 'var(--pp-space-2)',
                  marginRight: 'var(--pp-space-2)',
                  height: '2px',
                  width: lineWidth,
                  backgroundColor:
                    phase.number < currentPhase
                      ? 'var(--pp-color-primary-500)'
                      : 'var(--pp-color-neutral-200)',
                  transition: `all var(--pp-duration-normal) var(--pp-ease-out)`,
                  marginTop: showLabels ? '0' : '0',
                }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    );
  }
);

O2RPhaseIndicator.displayName = 'O2RPhaseIndicator';