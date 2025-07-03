import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock,
  TrendingUp,
  Activity,
  Database,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Timer,
  Zap,
  FileX,
  GitMerge
} from 'lucide-react';
import { liveSyncApi } from '@/services/liveSyncApi';
import { formatDistanceToNow, format } from 'date-fns';
import { SyncStatusCard } from '@/components/sync/SyncStatusCard';
import { ProgressTracker } from '@/components/sync/ProgressTracker';
import { ConflictResolver } from '@/components/sync/ConflictResolver';
import { HealthIndicator } from '@/components/sync/HealthIndicator';

export const SyncStatus: React.FC = () => {
  const { toast } = useToast();
  const [selectedConflict, setSelectedConflict] = useState<any>(null);

  // Fetch sync overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['sync-overview'],
    queryFn: liveSyncApi.getSyncOverview,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Fetch sync conflicts
  const { data: conflicts, isLoading: conflictsLoading } = useQuery({
    queryKey: ['sync-conflicts'],
    queryFn: liveSyncApi.getSyncConflicts,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch sync history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['sync-history'],
    queryFn: liveSyncApi.getSyncHistory,
  });

  // Fetch performance metrics
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['sync-performance'],
    queryFn: liveSyncApi.getSyncPerformance,
    refetchInterval: 60000, // Poll every minute
  });

  // Resolve conflict mutation
  const { mutate: resolveConflict } = useMutation({
    mutationFn: liveSyncApi.resolveConflict,
    onSuccess: () => {
      toast({
        title: 'Conflict Resolved',
        description: 'The sync conflict has been resolved successfully.',
      });
      setSelectedConflict(null);
      refetchOverview();
    },
    onError: (error: any) => {
      toast({
        title: 'Resolution Failed',
        description: error.message || 'Failed to resolve conflict.',
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-500">Partial</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="outline">Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (overviewLoading) {
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
          <h1 className="text-3xl font-bold">Sync Status Monitor</h1>
          <p className="text-gray-600 mt-1">Comprehensive synchronization health and performance monitoring</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetchOverview()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conflicts" className="relative">
            Conflicts
            {conflicts && conflicts.length > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {conflicts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SyncStatusCard
              title="Overall Health"
              status={overview?.overall_health || 'unknown'}
              value={overview?.health_score || 0}
              icon={<HealthIndicator score={overview?.health_score || 0} />}
              description="System synchronization health"
            />
            
            <SyncStatusCard
              title="Active Connections"
              status={overview?.connection_status || 'unknown'}
              value={overview?.active_connections || 0}
              icon={<Database className="h-5 w-5 text-blue-500" />}
              description="Connected CRM instances"
            />
            
            <SyncStatusCard
              title="Sync Success Rate"
              status={overview?.success_rate > 95 ? 'healthy' : overview?.success_rate > 80 ? 'warning' : 'error'}
              value={overview?.success_rate || 0}
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
              description="Last 24 hours"
              suffix="%"
            />
          </div>

          {/* Active Sync Progress */}
          {overview?.active_sync && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                  Active Synchronization
                </CardTitle>
                <CardDescription>
                  Current sync operation in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressTracker syncData={overview.active_sync} />
              </CardContent>
            </Card>
          )}

          {/* Recent Issues Alert */}
          {overview?.recent_issues && overview.recent_issues.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Recent Issues Detected</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {overview.recent_issues.slice(0, 3).map((issue, index) => (
                      <li key={index}>{issue.message}</li>
                    ))}
                  </ul>
                  {overview.recent_issues.length > 3 && (
                    <p className="text-sm text-gray-600">
                      And {overview.recent_issues.length - 3} more issues...
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  Total Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview?.total_records?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Across all sources</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  Last Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {overview?.last_sync_time 
                    ? formatDistanceToNow(new Date(overview.last_sync_time), { addSuffix: true })
                    : 'Never'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview?.last_sync_records || 0} records processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Pending Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview?.pending_conflicts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Require resolution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  Avg Sync Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overview?.avg_sync_time || '0s'}</p>
                <p className="text-xs text-gray-500 mt-1">Last 10 syncs</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitMerge className="h-5 w-5 text-orange-500" />
                Sync Conflicts
              </CardTitle>
              <CardDescription>
                Data conflicts requiring manual resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conflictsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : conflicts && conflicts.length > 0 ? (
                <div className="space-y-4">
                  {conflicts.map((conflict) => (
                    <div 
                      key={conflict.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedConflict(conflict)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{conflict.record_type} - {conflict.record_id}</h4>
                            {getSeverityBadge(conflict.severity)}
                          </div>
                          <p className="text-sm text-gray-600">{conflict.description}</p>
                          <p className="text-xs text-gray-500">
                            Detected {formatDistanceToNow(new Date(conflict.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No conflicts detected</p>
                  <p className="text-sm text-gray-400 mt-1">All data is synchronized properly</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conflict Resolution Modal */}
          {selectedConflict && (
            <ConflictResolver
              conflict={selectedConflict}
              onResolve={(resolution) => resolveConflict({ 
                conflict_id: selectedConflict.id, 
                resolution 
              })}
              onClose={() => setSelectedConflict(null)}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization History</CardTitle>
              <CardDescription>
                Complete log of all synchronization operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : history && history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {format(new Date(entry.timestamp), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(entry.status)}
                        </TableCell>
                        <TableCell>
                          {entry.records_processed?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>{entry.duration || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.sync_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.details || 'No details available'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sync history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Sync Speed</span>
                        <span className="font-medium">{performance?.avg_speed || 0} rec/min</span>
                      </div>
                      <Progress value={Math.min((performance?.avg_speed || 0) / 100 * 100, 100)} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Error Rate</span>
                        <span className="font-medium">{performance?.error_rate || 0}%</span>
                      </div>
                      <Progress 
                        value={performance?.error_rate || 0} 
                        className="[&>div]:bg-red-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>API Response Time</span>
                        <span className="font-medium">{performance?.api_response_time || 0}ms</span>
                      </div>
                      <Progress value={Math.min((performance?.api_response_time || 0) / 1000 * 100, 100)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-green-500" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">CPU Usage</p>
                    <p className="text-xl font-semibold">{performance?.cpu_usage || 0}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Memory Usage</p>
                    <p className="text-xl font-semibold">{performance?.memory_usage || 0}MB</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Network I/O</p>
                    <p className="text-xl font-semibold">{performance?.network_io || 0} KB/s</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Queue Size</p>
                    <p className="text-xl font-semibold">{performance?.queue_size || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};