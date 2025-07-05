import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRealTimeSync, type SyncProgress } from '@/hooks/useRealTimeSync';

interface SyncProgressIndicatorProps {
  sessionId?: string;
  className?: string;
}

const getStatusColor = (status: SyncProgress['status']) => {
  switch (status) {
    case 'pending':
      return 'pp-neutral';
    case 'in_progress':
      return 'pp-primary';
    case 'completed':
      return 'pp-success';
    case 'failed':
      return 'pp-danger';
    default:
      return 'pp-neutral';
  }
};

const getStatusText = (status: SyncProgress['status']) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
};

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({
  sessionId,
  className = '',
}) => {
  const { syncProgress, isConnected, error } = useRealTimeSync(sessionId);

  if (error) {
    return (
      <div className={`text-sm text-pp-danger-500 ${className}`}>
        Connection error: {error}
      </div>
    );
  }

  if (!sessionId || !syncProgress) {
    return (
      <div className={`text-sm text-pp-neutral-500 ${className}`}>
        No active sync
      </div>
    );
  }

  return (
    <div 
      className={`space-y-3 ${className}`}
      role="region"
      aria-labelledby="sync-progress-title"
      aria-live="polite"
    >
      {/* Status and Connection Indicator */}
      <div className="flex items-center justify-between">
        <div id="sync-progress-title" className="sr-only">
          Sync Progress: {getStatusText(syncProgress.status)}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(syncProgress.status) as "default" | "secondary" | "destructive" | "outline"}>
            {getStatusText(syncProgress.status)}
          </Badge>
          <span className="text-sm text-pp-neutral-600">
            {syncProgress.type} sync
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {syncProgress.status === 'in_progress' && (
            <LoadingSpinner className="h-4 w-4" />
          )}
          <div 
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-pp-success-500' : 'bg-pp-danger-500'
            }`}
            role="status"
            aria-label={isConnected ? 'Connected to server' : 'Disconnected from server'}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
      </div>

      {/* Progress Bar */}
      {syncProgress.status === 'in_progress' && (
        <div className="space-y-2">
          <Progress 
            value={syncProgress.progress} 
            className="h-2"
            aria-label={`Sync progress: ${syncProgress.progress}% complete`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={syncProgress.progress}
            aria-valuetext={`${syncProgress.progress}% complete, ${syncProgress.currentStep}`}
          />
          <div className="flex items-center justify-between text-xs text-pp-neutral-500">
            <span>{syncProgress.currentStep}</span>
            <span>{syncProgress.progress}%</span>
          </div>
        </div>
      )}

      {/* Records Progress */}
      {syncProgress.recordsProcessed > 0 && (
        <div className="text-xs text-pp-neutral-500">
          Processed {syncProgress.recordsProcessed.toLocaleString()}
          {syncProgress.recordsTotal && (
            <> of {syncProgress.recordsTotal.toLocaleString()}</>
          )} records
        </div>
      )}

      {/* Error Message */}
      {syncProgress.status === 'failed' && syncProgress.errorMessage && (
        <div 
          className="text-xs text-pp-danger-500 bg-pp-danger-50 p-2 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <span className="sr-only">Sync error: </span>
          {syncProgress.errorMessage}
        </div>
      )}

      {/* Estimated Completion */}
      {syncProgress.status === 'in_progress' && syncProgress.estimatedCompletion && (
        <div className="text-xs text-pp-neutral-500">
          Est. completion: {new Date(syncProgress.estimatedCompletion).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};