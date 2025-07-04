import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
  className?: string;
  loading?: boolean;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      change,
      trend = 'neutral',
      prefix = '',
      suffix = '',
      className,
      loading = false,
      ...props
    },
    ref
  ) => {
    const TrendIcon = {
      up: TrendingUp,
      down: TrendingDown,
      neutral: Minus,
    }[trend];

    const trendStyles = {
      up: { color: 'var(--pp-color-success-500)' },
      down: { color: 'var(--pp-color-danger-500)' },
      neutral: { color: 'var(--pp-color-neutral-500)' },
    }[trend];

    if (loading) {
      return (
        <Card ref={ref} className={cn('pp-metric-card', className)} {...props}>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0"
            style={{ paddingBottom: 'var(--pp-space-2)' }}
          >
            <CardTitle
              style={{
                fontSize: 'var(--pp-font-size-sm)',
                fontWeight: 'var(--pp-font-weight-medium)',
                color: 'var(--pp-color-neutral-600)',
              }}
            >
              {title}
            </CardTitle>
            <div className="h-4 w-4 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent style={{ paddingTop: 0 }}>
            <div
              className="animate-pulse bg-muted rounded h-8 w-24 mb-2"
              style={{
                height: '2rem',
                marginBottom: 'var(--pp-space-2)',
              }}
            />
            <div className="animate-pulse bg-muted rounded h-3 w-16" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn('pp-metric-card', className)} {...props}>
        <CardHeader
          className="flex flex-row items-center justify-between space-y-0"
          style={{ paddingBottom: 'var(--pp-space-2)' }}
        >
          <CardTitle
            style={{
              fontSize: 'var(--pp-font-size-sm)',
              fontWeight: 'var(--pp-font-weight-medium)',
              color: 'var(--pp-color-neutral-600)',
            }}
          >
            {title}
          </CardTitle>
          {change !== undefined && (
            <TrendIcon className="h-4 w-4" style={trendStyles} />
          )}
        </CardHeader>
        <CardContent style={{ paddingTop: 0 }}>
          <div
            style={{
              fontSize: 'var(--pp-font-size-2xl)',
              fontWeight: 'var(--pp-font-weight-bold)',
              lineHeight: 'var(--pp-line-height-tight)',
            }}
          >
            {prefix}
            {value}
            {suffix}
          </div>
          {change !== undefined && (
            <p
              style={{
                fontSize: 'var(--pp-font-size-xs)',
                marginTop: 'var(--pp-space-1)',
                ...trendStyles,
              }}
            >
              {trend === 'up' && '+'}
              {change}% from last period
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
);

MetricCard.displayName = 'MetricCard';