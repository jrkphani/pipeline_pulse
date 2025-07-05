import * as React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { HealthStatusChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Database, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Zap
} from 'lucide-react';
import { useSyncOperations, useTriggerFullSync } from '@/hooks';
import type { HealthStatusDataPoint } from '@/components/charts';


export default function OperationsDashboardPage() {
  const {
    syncStatus,
    syncHistory,
    triggerFullSync,
    triggerIncrementalSync,
    cancelSync,
    isLoading,
    isError
  } = useSyncOperations();

  const manualFullSync = useTriggerFullSync();

  const handleRefresh = () => {
    syncStatus.refetch();
    syncHistory.refetch();
  };

  const handleManualSync = () => {
    manualFullSync.mutate();
  };

  const healthStatusData: HealthStatusDataPoint[] = [];

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Error loading operations data</p>
          <Button onClick={handleRefresh} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pp-space-6)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 
              style={{ 
                fontSize: 'var(--pp-font-size-3xl)',
                fontWeight: 'var(--pp-font-weight-bold)',
                lineHeight: 'var(--pp-line-height-tight)',
              }}
            >
              Operations Dashboard
            </h1>
            <Badge variant="outline" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              System Health
            </Badge>
          </div>
          <p 
            style={{ 
              fontSize: 'var(--pp-font-size-md)',
              color: 'var(--pp-color-neutral-600)',
              marginTop: 'var(--pp-space-1)',
            }}
          >
            Monitor data synchronization and system performance
            {syncStatus.dataUpdatedAt && (
              <span className="ml-2 text-xs text-muted-foreground">
                Last updated: {new Date(syncStatus.dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleManualSync}
            variant="outline"
            disabled={manualFullSync.isPending || syncStatus.data?.isRunning}
            style={{
              height: 'var(--pp-button-height-md)',
              paddingLeft: 'var(--pp-button-padding-x-md)',
              paddingRight: 'var(--pp-button-padding-x-md)',
            }}
          >
            <Zap className={`mr-2 h-4 w-4 ${manualFullSync.isPending ? 'animate-spin' : ''}`} />
            {manualFullSync.isPending ? 'Starting...' : 'Full Sync'}
          </Button>
          <Button 
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              height: 'var(--pp-button-height-md)',
              paddingLeft: 'var(--pp-button-padding-x-md)',
              paddingRight: 'var(--pp-button-padding-x-md)',
            }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        style={{ gap: 'var(--pp-space-4)' }}
      >
        <MetricCard
          title="Sync Status"
          value={syncStatus.data?.isRunning ? 'Running' : 'Idle'}
          loading={isLoading}
        />
        <MetricCard
          title="Sessions Today"
          value={syncHistory.data?.sessions?.length || 0}
          loading={isLoading}
        />
        <MetricCard
          title="Success Rate"
          value={syncHistory.data ? Math.round((syncHistory.data.sessions?.filter(s => s.status === 'completed').length || 0) / (syncHistory.data.sessions?.length || 1) * 100) : 0}
          suffix="%"
          loading={isLoading}
        />
      </div>

      {/* Performance Metrics */}
      <div 
        className="grid gap-4 md:grid-cols-3"
        style={{ gap: 'var(--pp-space-4)' }}
      >
        <MetricCard
          title="Records Processed"
          value={syncStatus.data?.currentSession?.recordsProcessed || syncHistory.data?.sessions?.[0]?.recordsProcessed || 0}
          loading={isLoading}
        />
        <MetricCard
          title="Last Full Sync"
          value={syncStatus.data?.lastFullSync ? new Date(syncStatus.data.lastFullSync).toLocaleDateString() : 'Never'}
          loading={isLoading}
        />
        <MetricCard
          title="Last Incremental"
          value={syncStatus.data?.lastIncrementalSync ? new Date(syncStatus.data.lastIncrementalSync).toLocaleDateString() : 'Never'}
          loading={isLoading}
        />
      </div>

      {/* System Components Health */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: 'var(--pp-font-size-lg)',
              fontWeight: 'var(--pp-font-weight-semibold)',
            }}
          >
            <Activity className="h-5 w-5 mr-2 inline" />
            System Components
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-6 bg-muted rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : systemHealth.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No system health data available</p>
              <p className="text-xs">System monitoring will appear once initialized</p>
            </div>
          ) : (
            <div className="space-y-4">
              {systemHealth.map((component, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{component.component}</p>
                    <p className="text-sm text-muted-foreground">
                      Uptime: {component.uptime}% • Last check: {new Date(component.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                  <StatusBadge 
                    status={
                      component.status === 'healthy' ? 'success' : 
                      component.status === 'warning' ? 'warning' : 'danger'
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: 'var(--pp-font-size-lg)',
              fontWeight: 'var(--pp-font-weight-semibold)',
            }}
          >
            <Database className="h-5 w-5 mr-2 inline" />
            Recent Sync Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-6 bg-muted rounded w-16" />
                  </div>
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : syncHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No sync history available</p>
              <p className="text-xs">Sync operations will appear once executed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {sync.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : sync.status === 'running' ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{sync.type} Sync</p>
                      <p className="text-sm text-muted-foreground">
                        {sync.recordsProcessed.toLocaleString()} records • {Math.round(sync.duration / 60)} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge 
                      status={
                        sync.status === 'completed' ? 'success' : 
                        sync.status === 'running' ? 'warning' : 'danger'
                      }
                      label={sync.status}
                      size="sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(sync.completedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Quality Trends */}
      <HealthStatusChart 
        data={healthStatusData} 
        loading={loading} 
      />

      {/* Quick Actions */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: 'var(--pp-font-size-lg)',
              fontWeight: 'var(--pp-font-weight-semibold)',
            }}
          >
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Database className="h-5 w-5" />
              <span className="text-xs">View Sync Logs</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <AlertCircle className="h-5 w-5" />
              <span className="text-xs">Resolve Conflicts</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Activity className="h-5 w-5" />
              <span className="text-xs">System Health</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Zap className="h-5 w-5" />
              <span className="text-xs">Force Sync</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}