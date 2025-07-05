import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Separator } from './separator';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Database,
  Sync,
  Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  description: string;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface CachedData {
  entity: string;
  lastUpdated: string;
  recordCount: number;
  staleness: 'fresh' | 'stale' | 'expired';
}

export interface OfflineModeIndicatorProps {
  isOnline: boolean;
  isConnectedToBackend: boolean;
  pendingOperations: PendingOperation[];
  cachedData: CachedData[];
  onRetryConnection?: () => Promise<void>;
  onSyncPendingOperations?: () => Promise<void>;
  onViewCachedData?: () => void;
  onClearPendingOperations?: () => Promise<void>;
  className?: string;
  showDetails?: boolean;
}

const getStalenessColor = (staleness: CachedData['staleness']) => {
  switch (staleness) {
    case 'fresh':
      return 'text-green-600';
    case 'stale':
      return 'text-orange-600';
    case 'expired':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
};

const getStalenessLabel = (staleness: CachedData['staleness']) => {
  switch (staleness) {
    case 'fresh':
      return 'Fresh';
    case 'stale':
      return 'Stale';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

const getOperationIcon = (type: PendingOperation['type']) => {
  switch (type) {
    case 'create':
      return '➕';
    case 'update':
      return '✏️';
    case 'delete':
      return '🗑️';
    default:
      return '📝';
  }
};

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({
  isOnline,
  isConnectedToBackend,
  pendingOperations,
  cachedData,
  onRetryConnection,
  onSyncPendingOperations,
  onViewCachedData,
  onClearPendingOperations,
  className,
  showDetails = false
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const isFullyOnline = isOnline && isConnectedToBackend;
  const hasPendingOperations = pendingOperations.length > 0;
  const hasStaleData = cachedData.some(data => data.staleness !== 'fresh');

  const handleRetryConnection = async () => {
    if (!onRetryConnection) return;
    setIsRetrying(true);
    try {
      await onRetryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSyncOperations = async () => {
    if (!onSyncPendingOperations) return;
    setIsSyncing(true);
    try {
      await onSyncPendingOperations();
    } finally {
      setIsSyncing(false);
    }
  };

  // Connection status banner (always show when offline)
  if (!isFullyOnline && !showDetails) {
    return (
      <Alert variant={!isOnline ? 'destructive' : 'default'} className={cn('pp-offline-banner', className)}>
        <div className="flex items-center gap-2">
          {!isOnline ? <WifiOff className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
          <AlertDescription className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">
                  {!isOnline ? 'No Internet Connection' : 'Backend Disconnected'}
                </span>
                <span className="ml-2 text-sm">
                  {hasPendingOperations && `${pendingOperations.length} pending operations`}
                  {hasStaleData && ' • Using cached data'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasPendingOperations && (
                  <Badge variant="secondary" className="text-xs">
                    {pendingOperations.length} pending
                  </Badge>
                )}
                {onRetryConnection && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryConnection}
                    disabled={isRetrying}
                    className="h-7 text-xs"
                  >
                    {isRetrying ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      'Retry'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // Detailed offline mode card
  if (!showDetails) return null;

  return (
    <Card className={cn('pp-offline-mode-details', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              isFullyOnline ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            )}>
              {isOnline ? (
                isConnectedToBackend ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {isFullyOnline ? 'Online Mode' : 'Offline Mode'}
              </CardTitle>
              <CardDescription>
                {isFullyOnline 
                  ? 'All features available' 
                  : !isOnline 
                    ? 'No internet connection detected'
                    : 'Backend services unavailable'
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {isOnline ? 'Internet' : 'No Internet'}
            </Badge>
            <Badge variant={isConnectedToBackend ? 'default' : 'secondary'}>
              {isConnectedToBackend ? <Cloud className="h-3 w-3 mr-1" /> : <CloudOff className="h-3 w-3 mr-1" />}
              {isConnectedToBackend ? 'Backend' : 'Backend Down'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Actions */}
        {!isFullyOnline && onRetryConnection && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Retry Connection</p>
                <p className="text-xs text-muted-foreground">
                  Attempt to reconnect to services
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryConnection}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Retry'
              )}
            </Button>
          </div>
        )}

        {/* Pending Operations */}
        {hasPendingOperations && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Pending Operations</h4>
              <Badge variant="secondary">{pendingOperations.length} pending</Badge>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingOperations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getOperationIcon(operation.type)}</span>
                    <div>
                      <p className="font-medium">{operation.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {operation.entity} • {formatTimestamp(operation.timestamp)}
                        {operation.retryCount > 0 && ` • Retry ${operation.retryCount}/${operation.maxRetries}`}
                      </p>
                    </div>
                  </div>
                  {operation.retryCount >= operation.maxRetries && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {onSyncPendingOperations && isFullyOnline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncOperations}
                  disabled={isSyncing}
                  className="flex items-center gap-2"
                >
                  <Sync className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                  Sync All
                </Button>
              )}
              {onClearPendingOperations && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearPendingOperations}
                  className="text-destructive hover:text-destructive"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Cached Data Status */}
        {cachedData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Cached Data</h4>
              <Badge variant="outline">
                {cachedData.length} dataset{cachedData.length > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-2">
              {cachedData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{data.entity}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.recordCount.toLocaleString()} records • {formatTimestamp(data.lastUpdated)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStalenessColor(data.staleness)}>
                      {getStalenessLabel(data.staleness)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {onViewCachedData && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewCachedData}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Cached Data
              </Button>
            )}
          </div>
        )}

        {/* Online Status */}
        {isFullyOnline && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">
              All systems online. Real-time data synchronization active.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};