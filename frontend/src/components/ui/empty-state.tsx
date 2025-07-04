import * as React from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'var(--pp-space-8)',
    iconSize: '2rem',
    titleSize: 'var(--pp-font-size-lg)',
    descriptionSize: 'var(--pp-font-size-sm)',
    gap: 'var(--pp-space-3)',
  },
  md: {
    container: 'var(--pp-space-12)',
    iconSize: '3rem',
    titleSize: 'var(--pp-font-size-xl)',
    descriptionSize: 'var(--pp-font-size-md)',
    gap: 'var(--pp-space-4)',
  },
  lg: {
    container: 'var(--pp-space-16)',
    iconSize: '4rem',
    titleSize: 'var(--pp-font-size-2xl)',
    descriptionSize: 'var(--pp-font-size-lg)',
    gap: 'var(--pp-space-6)',
  },
} as const;

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ title, description, icon, action, className, size = 'md', ...props }, ref) => {
    const { container, iconSize, titleSize, descriptionSize, gap } = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center text-center', className)}
        style={{
          padding: container,
          gap,
        }}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <div
            style={{
              width: iconSize,
              height: iconSize,
              color: 'var(--pp-color-neutral-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}

        {/* Content */}
        <div
          className="flex flex-col items-center"
          style={{
            gap: 'var(--pp-space-2)',
            maxWidth: '400px',
          }}
        >
          <h3
            style={{
              fontSize: titleSize,
              fontWeight: 'var(--pp-font-weight-semibold)',
              color: 'var(--pp-color-neutral-700)',
              margin: 0,
            }}
          >
            {title}
          </h3>

          {description && (
            <p
              style={{
                fontSize: descriptionSize,
                color: 'var(--pp-color-neutral-500)',
                lineHeight: 'var(--pp-line-height-normal)',
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Action */}
        {action && (
          <Button
            variant={action.variant || 'default'}
            onClick={action.onClick}
            style={{
              marginTop: 'var(--pp-space-2)',
            }}
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';