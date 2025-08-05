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
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'error' | 'offline' | 'warning';
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
  ({ title, description, icon, action, secondaryAction, variant = 'default', className, size = 'md', ...props }, ref) => {
    const { container, iconSize, titleSize, descriptionSize, gap } = sizeConfig[size];
    
    const variantColors = {
      default: {
        title: 'var(--pp-color-neutral-700)',
        description: 'var(--pp-color-neutral-500)',
        icon: 'var(--pp-color-neutral-400)'
      },
      error: {
        title: 'var(--pp-color-danger-600)',
        description: 'var(--pp-color-danger-500)',
        icon: 'var(--pp-color-danger-400)'
      },
      offline: {
        title: 'var(--pp-color-warning-600)',
        description: 'var(--pp-color-warning-500)',
        icon: 'var(--pp-color-warning-400)'
      },
      warning: {
        title: 'var(--pp-color-warning-600)',
        description: 'var(--pp-color-warning-500)',
        icon: 'var(--pp-color-warning-400)'
      }
    }[variant];

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
              color: variantColors.icon,
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
              color: variantColors.title,
              margin: 0,
            }}
          >
            {title}
          </h3>

          {description && (
            <p
              style={{
                fontSize: descriptionSize,
                color: variantColors.description,
                lineHeight: 'var(--pp-line-height-normal)',
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div
            style={{
              marginTop: 'var(--pp-space-4)',
              display: 'flex',
              gap: 'var(--pp-space-3)',
              flexDirection: size === 'sm' ? 'column' : 'row',
              alignItems: 'center'
            }}
          >
            {action && (
              <Button
                variant={action.variant || 'default'}
                onClick={action.onClick}
                disabled={action.loading}
                style={{
                  minWidth: '120px'
                }}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                style={{
                  minWidth: '120px'
                }}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';