import React, { Suspense, ComponentType, lazy } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { LoadingSpinner } from './loading-spinner';

export interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export interface LazyComponentProps {
  loadingMessage?: string;
  errorMessage?: string;
  retryable?: boolean;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback, 
  errorFallback 
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
    </div>
  );

  const defaultErrorFallback = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <p className="text-destructive">Failed to load component</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback || defaultErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  loadComponent: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentProps = {}
) {
  const LazyComponent = lazy(loadComponent);
  
  return React.forwardRef<any, P>((props, ref) => {
    const fallback = (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner 
          size="lg" 
          label={options.loadingMessage || 'Loading...'} 
        />
      </div>
    );

    const errorFallback = (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-destructive">
          {options.errorMessage || 'Failed to load component'}
        </p>
        {options.retryable && (
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        )}
      </div>
    );

    return (
      <LazyWrapper fallback={fallback} errorFallback={errorFallback}>
        <LazyComponent {...props} ref={ref} />
      </LazyWrapper>
    );
  });
}

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}