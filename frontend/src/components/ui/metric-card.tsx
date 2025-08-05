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
      up: 'text-pp-success-500',
      down: 'text-pp-danger-500', 
      neutral: 'text-pp-neutral-500',
    }[trend];

    if (loading) {
      return (
        <Card ref={ref} className={cn('pp-metric-card', className)} {...props}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className="h-4 w-4 animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="animate-pulse bg-muted rounded h-8 w-24 mb-2" />
            <div className="animate-pulse bg-muted rounded h-3 w-16" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn('pp-metric-card', className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {change !== undefined && (
            <TrendIcon className={cn('h-4 w-4', trendStyles)} />
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold leading-tight">
            {prefix}
            {value}
            {suffix}
          </div>
          {change !== undefined && (
            <p className={cn('text-xs mt-1', trendStyles)}>
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