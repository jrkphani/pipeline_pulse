import * as React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  message?: string;
  variant?: 'default' | 'primary' | 'muted';
}

const sizeConfig = {
  sm: {
    spinner: '1rem',
    fontSize: 'var(--pp-font-size-xs)',
  },
  md: {
    spinner: '1.5rem',
    fontSize: 'var(--pp-font-size-sm)',
  },
  lg: {
    spinner: '2rem',
    fontSize: 'var(--pp-font-size-md)',
  },
  xl: {
    spinner: '3rem',
    fontSize: 'var(--pp-font-size-lg)',
  },
} as const;

const variantConfig = {
  default: 'var(--pp-color-neutral-600)',
  primary: 'var(--pp-color-primary-500)',
  muted: 'var(--pp-color-neutral-400)',
} as const;

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className, message, variant = 'default', ...props }, ref) => {
    const { spinner: spinnerSize, fontSize } = sizeConfig[size];
    const color = variantConfig[variant];

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center', className)}
        style={{
          gap: message ? 'var(--pp-space-3)' : '0',
        }}
        {...props}
      >
        <div
          className="animate-spin"
          style={{
            width: spinnerSize,
            height: spinnerSize,
            border: '2px solid transparent',
            borderTop: `2px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        {message && (
          <p
            style={{
              fontSize,
              color,
              fontWeight: 'var(--pp-font-weight-medium)',
              textAlign: 'center',
            }}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';