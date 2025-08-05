import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  XCircle, 
  CheckCircle2,
  Play,
  SkipForward,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SyncFailureDetails {
  sessionId: string;
  failureReason: string;
  failureType: 'rate_limit' | 'network' | 'api_error' | 'timeout' | 'partial_failure';
  recordsProcessed: number;
  recordsTotal: number;
  lastSuccessfulRecord?: string;
  canResume: boolean;
  retryAttempts: number;
  maxRetryAttempts: number;
  estimatedRecoveryTime?: string;
  affectedEntities: string[];
}

export interface SyncFailureRecoveryProps {
  failure: SyncFailureDetails;
  onResume: (sessionId: string) => Promise<void>;
  onRetry: (sessionId: string) => Promise<void>;
  onSkipFailed: (sessionId: string) => Promise<void>;
  onCancel: (sessionId: string) => Promise<void>;
  onDownloadReport: (sessionId: string) => Promise<void>;
  className?: string;
}

const getFailureIcon = (type: SyncFailureDetails['failureType']) => {
  switch (type) {
    case 'rate_limit':
      return Clock;
    case 'network':
      return XCircle;
    case 'api_error':
      return AlertTriangle;
    case 'timeout':
      return Clock;
    case 'partial_failure':
      return AlertTriangle;
    default:
      return XCircle;
  }
};

const getFailureColor = (type: SyncFailureDetails['failureType']) => {
  switch (type) {
    case 'rate_limit':
      return 'warning';
    case 'network':
      return 'error';
    case 'api_error':
      return 'error';
    case 'timeout':
      return 'warning';
    case 'partial_failure':
      return 'warning';
    default:
      return 'error';
  }
};

const getFailureTitle = (type: SyncFailureDetails['failureType']) => {
  switch (type) {
    case 'rate_limit':
      return 'Rate Limit Exceeded';
    case 'network':
      return 'Network Connection Error';
    case 'api_error':
      return 'API Error Occurred';
    case 'timeout':
      return 'Sync Operation Timed Out';
    case 'partial_failure':
      return 'Partial Sync Failure';
    default:
      return 'Sync Failed';
  }
};

const getRecoveryRecommendation = (type: SyncFailureDetails['failureType']) => {
  switch (type) {
    case 'rate_limit':
      return 'Wait for rate limit to reset, then resume the sync operation.';
    case 'network':
      return 'Check your internet connection and try again.';
    case 'api_error':
      return 'The external API returned an error. Try again or contact support.';
    case 'timeout':
      return 'The operation took too long. Try resuming or reducing batch size.';
    case 'partial_failure':
      return 'Some records failed to sync. You can skip failed records or retry all.';
    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
};

export const SyncFailureRecovery: React.FC<SyncFailureRecoveryProps> = ({
  failure,
  onResume,
  onRetry,
  onSkipFailed,
  onCancel,
  onDownloadReport,
  className
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  
  const FailureIcon = getFailureIcon(failure.failureType);
  const failureColor = getFailureColor(failure.failureType);
  const progressPercentage = (failure.recordsProcessed / failure.recordsTotal) * 100;

  const handleAction = async (action: string, handler: (id: string) => Promise<void>) => {
    setLoading(action);
    try {
      await handler(failure.sessionId);
    } finally {
      setLoading(null);
    }
  };

  const hasProgress = failure.recordsProcessed > 0;
  const isRetryAvailable = failure.retryAttempts < failure.maxRetryAttempts;

  return (
    <Card 
      className={cn('pp-sync-failure-recovery', className)}
      role="alert"
      aria-labelledby="sync-failure-title"
      aria-describedby="sync-failure-description"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            failureColor === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-orange-100 text-orange-600'
          )}>
            <FailureIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle id="sync-failure-title" className="text-lg">
              {getFailureTitle(failure.failureType)}
            </CardTitle>
            <CardDescription id="sync-failure-description" className="text-sm mt-1">
              Session: {failure.sessionId}
            </CardDescription>
          </div>
          <Badge variant={failureColor === 'error' ? 'destructive' : 'secondary'}>
            Retry {failure.retryAttempts}/{failure.maxRetryAttempts}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Failure Details */}
        <Alert variant={failureColor === 'error' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Error Details:</p>
              <p className="text-sm">{failure.failureReason}</p>
              <p className="text-sm text-muted-foreground">
                {getRecoveryRecommendation(failure.failureType)}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Progress Information */}
        {hasProgress && (
          <div className="space-y-3" role="group" aria-labelledby="progress-info-title">            <div className="sr-only" id="progress-info-title">Sync Progress Information</div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Sync Progress</span>
              <span className="text-muted-foreground">
                {failure.recordsProcessed.toLocaleString()} of {failure.recordsTotal.toLocaleString()} records
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
              aria-label={`Sync progress: ${Math.round(progressPercentage)}% complete`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercentage}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% completed</span>
              {failure.lastSuccessfulRecord && (
                <span>Last: {failure.lastSuccessfulRecord}</span>
              )}
            </div>
          </div>
        )}

        {/* Affected Entities */}
        {failure.affectedEntities.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Affected Data Types:</p>
            <div className="flex flex-wrap gap-2">
              {failure.affectedEntities.map((entity) => (
                <Badge key={entity} variant="outline" className="text-xs">
                  {entity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Recovery Time */}
        {failure.estimatedRecoveryTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated recovery time: {failure.estimatedRecoveryTime}</span>
          </div>
        )}

        <Separator />

        {/* Recovery Actions */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Recovery Options</h4>
          
          <div className="grid gap-3">
            {/* Resume Option */}
            {failure.canResume && hasProgress && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Play className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Resume Sync</p>
                    <p className="text-xs text-muted-foreground">
                      Continue from where it left off
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('resume', onResume)}
                  disabled={loading === 'resume'}
                >
                  {loading === 'resume' ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Resume'}
                </Button>
              </div>
            )}

            {/* Retry Option */}
            {isRetryAvailable && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Retry from Beginning</p>
                    <p className="text-xs text-muted-foreground">
                      Start the sync operation over
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('retry', onRetry)}
                  disabled={loading === 'retry'}
                >
                  {loading === 'retry' ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Retry'}
                </Button>
              </div>
            )}

            {/* Skip Failed Records */}
            {failure.failureType === 'partial_failure' && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <SkipForward className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">Skip Failed Records</p>
                    <p className="text-xs text-muted-foreground">
                      Continue with successful records only
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('skip', onSkipFailed)}
                  disabled={loading === 'skip'}
                >
                  {loading === 'skip' ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Skip'}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('download', onDownloadReport)}
              disabled={!!loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Error Report
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('cancel', onCancel)}
              disabled={!!loading}
              className="text-destructive hover:text-destructive"
            >
              Cancel Sync
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Empty state component for when there are no sync failures
export const NoSyncFailures: React.FC<{ onStartSync?: () => void }> = ({ onStartSync }) => {
  return (
    <EmptyState
      icon={<CheckCircle2 className="w-full h-full" />}
      title="All Syncs Successful"
      description="No sync failures to recover from. All your data is up to date."
      action={onStartSync ? {
        label: "Start New Sync",
        onClick: onStartSync,
        variant: "default"
      } : undefined}
      variant="default"
      size="md"
    />
  );
};