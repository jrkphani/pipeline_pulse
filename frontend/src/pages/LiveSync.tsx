import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Activity,
  Database,
  Zap,
  Settings,
  ChevronRight
} from 'lucide-react';
import { liveSyncApi } from '@/services/liveSyncApi';
import { formatDistanceToNow } from 'date-fns';

export const LiveSync: React.FC = () => {
  const { toast } = useToast();
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(15);

  // Fetch sync status
  const { data: syncStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: liveSyncApi.getSyncStatus,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch sync activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['sync-activities'],
    queryFn: liveSyncApi.getSyncActivities,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Manual sync mutation
  const { mutate: triggerSync, isPending: isSyncing } = useMutation({
    mutationFn: liveSyncApi.triggerManualSync,
    onSuccess: () => {
      toast({
        title: 'Sync Started',
        description: 'Manual synchronization has been initiated.',
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to start synchronization.',
        variant: 'destructive',
      });
    },
  });

  // Pause/Resume sync mutation
  const { mutate: toggleSync } = useMutation({
    mutationFn: syncStatus?.is_active ? liveSyncApi.pauseSync : liveSyncApi.resumeSync,
    onSuccess: () => {
      toast({
        title: syncStatus?.is_active ? 'Sync Paused' : 'Sync Resumed',
        description: `Synchronization has been ${syncStatus?.is_active ? 'paused' : 'resumed'}.`,
      });
      refetchStatus();
    },
  });

  // Update sync configuration
  const { mutate: updateConfig } = useMutation({
    mutationFn: liveSyncApi.updateSyncConfig,
    onSuccess: () => {
      toast({
        title: 'Configuration Updated',
        description: 'Sync configuration has been saved.',
      });
    },
  });

  const handleConfigUpdate = () => {
    updateConfig({
      auto_sync_enabled: autoSyncEnabled,
      sync_interval_minutes: syncInterval,
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'idle':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'idle':
        return <Badge variant="secondary">Idle</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Sync Control</h1>
          <p className="text-gray-600 mt-1">Monitor and control CRM data synchronization</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSync()}
            disabled={isSyncing}
          >
            {syncStatus?.is_active ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Sync
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Sync
              </>
            )}
          </Button>
          <Button
            onClick={() => triggerSync()}
            disabled={isSyncing || syncStatus?.is_active}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
              {getStatusIcon(syncStatus?.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(syncStatus?.status)}
              <span className="text-xs text-gray-500">
                {syncStatus?.current_progress}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {syncStatus?.last_sync_time 
                ? formatDistanceToNow(new Date(syncStatus.last_sync_time), { addSuffix: true })
                : 'Never'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {syncStatus?.records_synced || 0} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sync Health</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress value={syncStatus?.health_score || 0} className="h-2" />
              </div>
              <span className="text-sm font-semibold">{syncStatus?.health_score || 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Data Volume</CardTitle>
              <Database className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">{syncStatus?.total_records || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total records in CRM</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Active Sync Progress</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Sync Progress</CardTitle>
              <CardDescription>
                Real-time progress of the active synchronization process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStatus?.is_active ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-medium">{syncStatus.current_progress}%</span>
                    </div>
                    <Progress value={syncStatus.current_progress} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Records Processed</p>
                      <p className="text-xl font-semibold">
                        {syncStatus.records_processed} / {syncStatus.total_records}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Time Elapsed</p>
                      <p className="text-xl font-semibold">
                        {syncStatus.sync_duration || '0s'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <p className="text-sm font-medium">Current Stage</p>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm">{syncStatus.current_stage || 'Initializing...'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active synchronization</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => triggerSync()}
                  >
                    Start Manual Sync
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Settings</CardTitle>
              <CardDescription>
                Configure automatic synchronization behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">Automatic Synchronization</Label>
                  <p className="text-sm text-gray-500">
                    Enable scheduled automatic data synchronization
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="sync-interval"
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(Number(e.target.value))}
                    className="flex-1"
                    disabled={!autoSyncEnabled}
                  />
                  <span className="w-16 text-right font-medium">
                    {syncInterval} min
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  How often to synchronize data with Zoho CRM
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleConfigUpdate} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Real-time feed of synchronization activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-1">
                          {activity.type === 'success' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {activity.type === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {activity.type === 'info' && (
                            <Activity className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                          {activity.details && (
                            <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activities</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};