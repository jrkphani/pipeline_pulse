import * as React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { O2RPhaseIndicator } from '@/components/ui/o2r-phase-indicator';
import { PipelineValueChart, O2RPhaseChart, HealthStatusChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Users, Target } from 'lucide-react';
import { useDashboardData, useTriggerIncrementalSync } from '@/hooks';
import type { 
  PipelineValueDataPoint, 
  O2RPhaseDataPoint, 
  HealthStatusDataPoint 
} from '@/components/charts';


export default function SalesManagerDashboardPage() {
  const [dateRange] = React.useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  const {
    metrics,
    pipelineChart,
    o2rChart,
    healthChart,
    isLoading,
    isError
  } = useDashboardData(dateRange);

  const triggerSync = useTriggerIncrementalSync();

  const handleRefresh = () => {
    triggerSync.mutate();
  };

  // Convert chart data format
  const pipelineValueData: PipelineValueDataPoint[] = [];
  const o2rPhaseData: O2RPhaseDataPoint[] = o2rChart.data ? [
    { phase: 'Phase I', value: o2rChart.data.phase1 || 0, color: '#8b5cf6' },
    { phase: 'Phase II', value: o2rChart.data.phase2 || 0, color: '#06b6d4' },
    { phase: 'Phase III', value: o2rChart.data.phase3 || 0, color: '#10b981' },
    { phase: 'Phase IV', value: o2rChart.data.phase4 || 0, color: '#f59e0b' },
  ] : [];
  const healthStatusData: HealthStatusDataPoint[] = [];

  const quotaAttainment = metrics.data ? Math.round((metrics.data.totalRevenue / (metrics.data.totalPipelineValue || 1)) * 100) : 0;

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Error loading dashboard data</p>
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
              Sales Manager Dashboard
            </h1>
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Team Performance
            </Badge>
          </div>
          <p 
            style={{ 
              fontSize: 'var(--pp-font-size-md)',
              color: 'var(--pp-color-neutral-600)',
              marginTop: 'var(--pp-space-1)',
            }}
          >
            Monitor team performance and pipeline health
            {metrics.dataUpdatedAt && (
              <span className="ml-2 text-xs text-muted-foreground">
                Last updated: {new Date(metrics.dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          style={{
            height: 'var(--pp-button-height-md)',
            paddingLeft: 'var(--pp-button-padding-x-md)',
            paddingRight: 'var(--pp-button-padding-x-md)',
          }}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${triggerSync.isPending ? 'animate-spin' : ''}`} />
          {triggerSync.isPending ? 'Syncing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Team Performance Overview */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: 'var(--pp-font-size-lg)',
              fontWeight: 'var(--pp-font-weight-semibold)',
            }}
          >
            <Target className="h-5 w-5 mr-2 inline" />
            Team Quota Attainment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="animate-pulse h-8 bg-muted rounded w-1/3" />
              <div className="animate-pulse h-4 bg-muted rounded w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <span 
                  style={{ 
                    fontSize: 'var(--pp-font-size-3xl)',
                    fontWeight: 'var(--pp-font-weight-bold)',
                    color: quotaAttainment >= 100 ? 'var(--pp-color-success-500)' : 'var(--pp-color-warning-500)',
                  }}
                >
                  {quotaAttainment}%
                </span>
                <div className="text-sm text-muted-foreground">
                  <p>${metrics.data?.totalRevenue?.toLocaleString() || 0} of ${metrics.data?.totalPipelineValue?.toLocaleString() || 0}</p>
                  <p>Revenue vs Pipeline Value</p>
                </div>
              </div>
              <Progress value={quotaAttainment} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 'var(--pp-space-4)' }}
      >
        <MetricCard
          title="Average Deal Size (SGD)"
          value={metrics.data?.avgDealSize ? `${(metrics.data.avgDealSize / 1000).toFixed(0)}K` : '0'}
          prefix="$"
          change={metrics.data ? 12 : undefined}
          trend="up"
          loading={isLoading}
        />
        <MetricCard
          title="Win Rate"
          value={metrics.data?.winRate || 0}
          suffix="%"
          change={metrics.data ? -8 : undefined}
          trend="up"
          loading={isLoading}
        />
        <MetricCard
          title="Total Revenue (SGD)"
          value={metrics.data?.totalRevenue ? `${(metrics.data.totalRevenue / 1000000).toFixed(1)}M` : '0'}
          prefix="$"
          change={metrics.data ? 15 : undefined}
          trend="up"
          loading={isLoading}
        />
        <MetricCard
          title="Active Deals"
          value={metrics.data?.dealsInProgress || 0}
          change={metrics.data ? 7 : undefined}
          trend="up"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div 
        className="grid gap-6 lg:grid-cols-2"
        style={{ gap: 'var(--pp-space-6)' }}
      >
        <PipelineValueChart 
          data={pipelineValueData} 
          loading={isLoading} 
        />
        <O2RPhaseChart 
          data={o2rPhaseData} 
          loading={isLoading} 
        />
      </div>

      {/* Health Status Chart */}
      <HealthStatusChart 
        data={healthStatusData} 
        loading={isLoading} 
      />

      {/* Team Performance Table */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: 'var(--pp-font-size-lg)',
              fontWeight: 'var(--pp-font-weight-semibold)',
            }}
          >
            <Users className="h-5 w-5 mr-2 inline" />
            Individual Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-1/6" />
                  </div>
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Individual team performance coming soon</p>
              <p className="text-xs">Team member data will be available after user management implementation</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* O2R Pipeline Status */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: 'var(--pp-font-size-lg)',
              fontWeight: 'var(--pp-font-weight-semibold)',
            }}
          >
            O2R Pipeline Status
          </CardTitle>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pp-space-4)' }}>
          <O2RPhaseIndicator currentPhase={2} showLabels />
          <div 
            className="grid gap-4 md:grid-cols-4"
            style={{ gap: 'var(--pp-space-4)' }}
          >
            {[
              { phase: 'Phase I', count: o2rChart.data?.phase1 || 0, status: 'neutral' as const },
              { phase: 'Phase II', count: o2rChart.data?.phase2 || 0, status: 'neutral' as const },
              { phase: 'Phase III', count: o2rChart.data?.phase3 || 0, status: 'neutral' as const },
              { phase: 'Phase IV', count: o2rChart.data?.phase4 || 0, status: 'neutral' as const },
            ].map((item) => (
              <div 
                key={item.phase}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pp-space-2)' }}
              >
                <p 
                  style={{ 
                    fontSize: 'var(--pp-font-size-sm)',
                    fontWeight: 'var(--pp-font-weight-medium)',
                  }}
                >
                  {item.phase}
                </p>
                <p 
                  style={{ 
                    fontSize: 'var(--pp-font-size-2xl)',
                    fontWeight: 'var(--pp-font-weight-bold)',
                  }}
                >
                  {isLoading ? '-' : `$${(item.count / 1000000).toFixed(1)}M`}
                </p>
                {!isLoading && <StatusBadge status={item.status} size="sm" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}