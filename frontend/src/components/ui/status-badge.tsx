import * as React from 'react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

export type StatusType = 'success' | 'warning' | 'danger' | 'neutral';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig = {
  success: {
    label: 'On Track',
    className: 'text-white',
    style: {
      backgroundColor: 'var(--pp-color-success-500)',
      color: 'white',
    },
  },
  warning: {
    label: 'Minor Issues',
    className: 'text-black',
    style: {
      backgroundColor: 'var(--pp-color-warning-500)',
      color: 'black',
    },
  },
  danger: {
    label: 'Critical',
    className: 'text-white',
    style: {
      backgroundColor: 'var(--pp-color-danger-500)',
      color: 'white',
    },
  },
  neutral: {
    label: 'Blocked',
    className: 'text-white',
    style: {
      backgroundColor: 'var(--pp-color-neutral-500)',
      color: 'white',
    },
  },
} as const;

const sizeConfig = {
  sm: {
    fontSize: 'var(--pp-font-size-xs)',
    padding: 'var(--pp-space-1) var(--pp-space-2)',
  },
  md: {
    fontSize: 'var(--pp-font-size-sm)',
    padding: 'var(--pp-space-2) var(--pp-space-3)',
  },
  lg: {
    fontSize: 'var(--pp-font-size-md)',
    padding: 'var(--pp-space-3) var(--pp-space-4)',
  },
} as const;

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, label, className, size = 'md', showIcon = true, ...props }, _ref) => {
    const config = statusConfig[status];
    const sizeStyles = sizeConfig[size];

    return (
      <Badge
        className={cn('pp-status-indicator', config.className, className)}
        style={{
          ...config.style,
          ...sizeStyles,
          borderRadius: 'var(--pp-radius-md)',
          fontWeight: 'var(--pp-font-weight-medium)',
          transition: `all var(--pp-duration-normal) var(--pp-ease-out)`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: showIcon ? 'var(--pp-space-1)' : '0',
        }}
        variant="default"
        {...props}
      >
        {showIcon && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
            }}
          />
        )}
        {label || config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';