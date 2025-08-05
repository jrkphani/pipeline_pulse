import React, { useState } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Separator } from './separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  Info, 
  RefreshCw,
  Wallet,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CurrencyRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: string;
  source: 'live' | 'cached' | 'fallback' | 'manual';
  staleDays?: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface CurrencyConversionIssue {
  type: 'unsupported_currency' | 'stale_rates' | 'api_unavailable' | 'rate_variance' | 'historical_unavailable';
  severity: 'warning' | 'error' | 'info';
  message: string;
  affectedAmount?: number;
  originalCurrency?: string;
  fallbackPath?: string[];
  suggestion?: string;
  canOverride?: boolean;
}

export interface CurrencyFallbackIndicatorProps {
  rate: CurrencyRate;
  issues?: CurrencyConversionIssue[];
  onRefreshRate?: () => Promise<void>;
  onManualOverride?: (newRate: number) => Promise<void>;
  onViewDetails?: () => void;
  className?: string;
  showTooltip?: boolean;
  compact?: boolean;
}

const getSeverityColor = (severity: CurrencyConversionIssue['severity']) => {
  switch (severity) {
    case 'error':
      return 'destructive';
    case 'warning':
      return 'secondary'; // Will use warning colors in CSS
    case 'info':
      return 'outline';
    default:
      return 'outline';
  }
};

const getSeverityIcon = (severity: CurrencyConversionIssue['severity']) => {
  switch (severity) {
    case 'error':
      return AlertTriangle;
    case 'warning':
      return Clock;
    case 'info':
      return Info;
    default:
      return Info;
  }
};

const getSourceBadgeColor = (source: CurrencyRate['source']) => {
  switch (source) {
    case 'live':
      return 'success';
    case 'cached':
      return 'secondary';
    case 'fallback':
      return 'warning';
    case 'manual':
      return 'outline';
    default:
      return 'outline';
  }
};

const getSourceLabel = (source: CurrencyRate['source']) => {
  switch (source) {
    case 'live':
      return 'Live Rate';
    case 'cached':
      return 'Cached Rate';
    case 'fallback':
      return 'Fallback Rate';
    case 'manual':
      return 'Manual Override';
    default:
      return 'Unknown';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

export const CurrencyFallbackIndicator: React.FC<CurrencyFallbackIndicatorProps> = ({
  rate,
  issues = [],
  onRefreshRate,
  onManualOverride,
  onViewDetails,
  className,
  showTooltip = true,
  compact = false
}) => {
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideRate, setOverrideRate] = useState(rate.rate.toString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasIssues = issues.length > 0;
  const highestSeverity = issues.reduce((max, issue) => {
    const severityLevel = { info: 1, warning: 2, error: 3 }[issue.severity];
    const maxLevel = { info: 1, warning: 2, error: 3 }[max];
    return severityLevel > maxLevel ? issue.severity : max;
  }, 'info' as CurrencyConversionIssue['severity']);

  const handleRefresh = async () => {
    if (!onRefreshRate) return;
    setIsRefreshing(true);
    try {
      await onRefreshRate();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualOverride = async () => {
    if (!onManualOverride) return;
    const newRate = parseFloat(overrideRate);
    if (isNaN(newRate) || newRate <= 0) return;
    
    await onManualOverride(newRate);
    setIsOverrideOpen(false);
  };

  const rateDisplay = `1 ${rate.fromCurrency} = ${rate.rate.toFixed(4)} ${rate.toCurrency}`;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2', className)}>
              <Badge variant={getSourceBadgeColor(rate.source)} className="text-xs">
                {rate.fromCurrency}/{rate.toCurrency}
              </Badge>
              {hasIssues && (
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  highestSeverity === 'error' ? 'bg-destructive' : 
                  highestSeverity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                )} />
              )}
            </div>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent side="top" className="max-w-sm">
              <div className="space-y-2">
                <p className="font-medium text-xs">{rateDisplay}</p>
                <p className="text-xs text-muted-foreground">
                  {getSourceLabel(rate.source)} • Updated {formatTimestamp(rate.lastUpdated)}
                </p>
                {hasIssues && (
                  <div className="space-y-1">
                    {issues.slice(0, 2).map((issue, index) => (
                      <p key={index} className="text-xs text-orange-600">
                        {issue.message}
                      </p>
                    ))}
                    {issues.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{issues.length - 2} more issues
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn('pp-currency-fallback-indicator', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{rateDisplay}</CardTitle>
              <CardDescription className="text-sm">
                {getSourceLabel(rate.source)} • Updated {formatTimestamp(rate.lastUpdated)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getSourceBadgeColor(rate.source)}>
              {getSourceLabel(rate.source)}
            </Badge>
            {rate.confidence !== 'high' && (
              <Badge variant="outline" className="text-xs">
                {rate.confidence} confidence
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Issues Alert */}
        {hasIssues && (
          <div className="space-y-3">
            {issues.map((issue, index) => {
              const SeverityIcon = getSeverityIcon(issue.severity);
              return (
                <Alert key={index} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                  <SeverityIcon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-xs text-muted-foreground">{issue.suggestion}</p>
                      )}
                      {issue.fallbackPath && (
                        <div className="text-xs">
                          <span className="font-medium">Conversion path: </span>
                          <span className="text-muted-foreground">
                            {issue.fallbackPath.join(' → ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}

        {/* Rate Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Source</p>
            <p className="font-medium">{getSourceLabel(rate.source)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Confidence</p>
            <div className="flex items-center gap-1">
              <span className="font-medium capitalize">{rate.confidence}</span>
              {rate.confidence === 'high' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-orange-600" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Last Updated</p>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{formatTimestamp(rate.lastUpdated)}</span>
            </div>
          </div>
          {rate.staleDays && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Data Age</p>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-600" />
                <span className="font-medium text-orange-600">{rate.staleDays} days old</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onRefreshRate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh Rate
            </Button>
          )}

          {onManualOverride && (
            <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Manual Override
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manual Rate Override</DialogTitle>
                  <DialogDescription>
                    Set a custom exchange rate for {rate.fromCurrency} to {rate.toCurrency}.
                    This will override the automatic rate until the next refresh.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="override-rate">
                      Exchange Rate (1 {rate.fromCurrency} = ? {rate.toCurrency})
                    </Label>
                    <Input
                      id="override-rate"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={overrideRate}
                      onChange={(e) => setOverrideRate(e.target.value)}
                      placeholder="Enter exchange rate"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Current rate: {rate.rate.toFixed(4)}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsOverrideOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleManualOverride}>
                        Apply Override
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetails}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};