import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SyncData {
  progress: number;
  stage: string;
  records_processed: number;
  total_records: number;
  started_at: string;
  estimated_completion?: string;
  current_operation?: string;
  speed?: number; // records per minute
}

interface ProgressTrackerProps {
  syncData: SyncData;
  showDetails?: boolean;
  compact?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  syncData,
  showDetails = true,
  compact = false,
}) => {
  const {
    progress,
    stage,
    records_processed,
    total_records,
    started_at,
    estimated_completion,
    current_operation,
    speed
  } = syncData;

  const getStageIcon = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'initializing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'fetching':
      case 'downloading':
        return <Database className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'processing':
      case 'transforming':
        return <Activity className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'syncing':
      case 'uploading':
        return <Zap className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'initializing':
        return <Badge variant="outline">Initializing</Badge>;
      case 'fetching':
      case 'downloading':
        return <Badge variant="default" className="bg-blue-500">Fetching Data</Badge>;
      case 'processing':
      case 'transforming':
        return <Badge variant="default" className="bg-orange-500">Processing</Badge>;
      case 'syncing':
      case 'uploading':
        return <Badge variant="default" className="bg-purple-500">Syncing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      default:
        return <Badge variant="secondary">{stage}</Badge>;
    }
  };

  const getProgressColor = () => {
    if (progress >= 90) return '[&>div]:bg-green-500';
    if (progress >= 60) return '[&>div]:bg-blue-500';
    if (progress >= 30) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-blue-500';
  };

  const calculateTimeRemaining = () => {
    if (!speed || speed === 0) return 'Calculating...';
    
    const remainingRecords = total_records - records_processed;
    const minutesRemaining = remainingRecords / speed;
    
    if (minutesRemaining < 1) return 'Less than 1 minute';
    if (minutesRemaining < 60) return `${Math.round(minutesRemaining)} minutes`;
    
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = Math.round(minutesRemaining % 60);
    return `${hours}h ${minutes}m`;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStageIcon(stage)}
            <span className="font-medium">{stage}</span>
          </div>
          <span className="text-gray-600">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className={`h-2 ${getProgressColor()}`} />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{records_processed.toLocaleString()} / {total_records.toLocaleString()}</span>
          {speed && <span>{Math.round(speed)} rec/min</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stage and Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStageIcon(stage)}
          <div>
            <h4 className="font-medium">{stage}</h4>
            {current_operation && (
              <p className="text-sm text-gray-600">{current_operation}</p>
            )}
          </div>
        </div>
        {getStageBadge(stage)}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className={`h-3 ${getProgressColor()}`} />
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* Records Progress */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Records</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold">{records_processed.toLocaleString()}</span>
              <span className="text-sm text-gray-500">/ {total_records.toLocaleString()}</span>
            </div>
          </div>

          {/* Speed */}
          {speed && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Speed</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold">{Math.round(speed)}</span>
                <span className="text-sm text-gray-500">rec/min</span>
              </div>
            </div>
          )}

          {/* Time Elapsed */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Elapsed</p>
            <p className="text-lg font-semibold">
              {formatDistanceToNow(new Date(started_at))}
            </p>
          </div>

          {/* Time Remaining */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining</p>
            <p className="text-lg font-semibold">
              {estimated_completion 
                ? formatDistanceToNow(new Date(estimated_completion))
                : calculateTimeRemaining()
              }
            </p>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {showDetails && current_operation && (
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current operation:</span> {current_operation}
          </p>
        </div>
      )}
    </div>
  );
};