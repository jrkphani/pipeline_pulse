import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { liveSyncApi, SyncOverview } from '@/services/liveSyncApi';
import { formatDistanceToNow } from 'date-fns';

interface GlobalSyncStatusProps {
  compact?: boolean;
}

export const GlobalSyncStatus: React.FC<GlobalSyncStatusProps> = ({ 
  compact = false 
}) => {
  const { toast } = useToast();
  const [triggering, setTriggering] = useState(false);

  const { data: syncOverview, isLoading, error, refetch } = useQuery({
    queryKey: ['sync-overview'],
    queryFn: () => liveSyncApi.getSyncOverview(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider stale after 15 seconds
    retry: 3,
  });

  const getConnectionIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (health: string, connectionStatus: string) => {
    if (connectionStatus === 'disconnected') {
      return <Badge variant="destructive">Offline</Badge>;
    }
    
    switch (health) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Live</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-500">Issues</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleQuickSync = async () => {
    try {
      setTriggering(true);
      const result = await liveSyncApi.triggerManualSync();
      
      if (result.success) {
        toast({
          title: "Sync Started",
          description: "Manual sync has been triggered successfully.",
        });
        refetch(); // Refresh status immediately
      } else {
        toast({
          title: "Sync Failed",
          description: result.message || "Failed to start sync",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to trigger sync",
        variant: "destructive",
      });
    } finally {
      setTriggering(false);
    }
  };

  const formatLastSync = (lastSyncTime: string | null) => {
    if (!lastSyncTime) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading || error || !syncOverview) {
    return (
      <div className="flex items-center gap-2">
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        {!compact && (
          <span className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : 'Connection Error'}
          </span>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getConnectionIcon(syncOverview.connection_status)}
        {getStatusBadge(syncOverview.overall_health, syncOverview.connection_status)}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuickSync}
          disabled={triggering}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${triggering ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        {getConnectionIcon(syncOverview.connection_status)}
        <div>
          <div className="flex items-center gap-2">
            {getHealthIcon(syncOverview.overall_health)}
            {getStatusBadge(syncOverview.overall_health, syncOverview.connection_status)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {syncOverview.connection_status === 'connected' ? 'CRM Connected' : 'CRM Offline'}
          </p>
        </div>
      </div>

      {/* Sync Info */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {syncOverview.total_records.toLocaleString()} records
          </span>
          <span className="text-xs text-gray-500">
            {formatLastSync(syncOverview.last_sync_time)}
          </span>
        </div>
        
        {/* Active Sync Progress */}
        {syncOverview.active_sync && (
          <div className="text-xs text-blue-600">
            Syncing: {syncOverview.active_sync.stage} ({syncOverview.active_sync.progress}%)
          </div>
        )}

        {/* Recent Issues */}
        {syncOverview.recent_issues.length > 0 && (
          <div className="text-xs text-red-600">
            {syncOverview.recent_issues.length} recent issue(s)
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickSync}
          disabled={triggering || syncOverview.connection_status === 'disconnected'}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${triggering ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>
    </div>
  );
};