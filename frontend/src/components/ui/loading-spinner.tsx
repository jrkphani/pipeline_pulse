import React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  hideLabel?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className, 
  label = 'Loading',
  hideLabel = false 
}) => {
  const spinnerClass = cn(
    'animate-spin border-2 border-current border-t-transparent rounded-full',
    sizeClasses[size],
    className
  );

  return (
    <div 
      className="flex items-center gap-2" 
      role="status" 
      aria-live="polite"
      aria-label={label}
    >
      <div className={spinnerClass} aria-hidden="true" />
      {!hideLabel && (
        <span className="sr-only">
          {label}
        </span>
      )}
    </div>
  );
};