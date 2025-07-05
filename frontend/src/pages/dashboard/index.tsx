import * as React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { O2RPhaseIndicator } from '@/components/ui/o2r-phase-indicator';
import { PipelineValueChart, O2RPhaseChart, HealthStatusChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useDashboardData, useTriggerIncrementalSync } from '@/hooks';
import type { 
  PipelineValueDataPoint, 
  O2RPhaseDataPoint, 
  HealthStatusDataPoint 
} from '@/components/charts';


export default function DashboardPage() {
  const [dateRange] = React.useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  const {
    metrics,
    pipelineChart,
    o2rChart,
    healthChart,
    attentionRequired,
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
          <h1 
            style={{ 
              fontSize: 'var(--pp-font-size-3xl)',
              fontWeight: 'var(--pp-font-weight-bold)',
              lineHeight: 'var(--pp-line-height-tight)',
            }}
          >
            Pipeline Dashboard
          </h1>
          <p 
            style={{ 
              fontSize: 'var(--pp-font-size-md)',
              color: 'var(--pp-color-neutral-600)',
              marginTop: 'var(--pp-space-1)',
            }}
          >
            Real-time insights into your sales pipeline
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
          {triggerSync.isPending ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 'var(--pp-space-4)' }}
      >
        <MetricCard
          title="Total Pipeline Value (SGD)"
          value={metrics.data?.totalPipelineValue ? `${(metrics.data.totalPipelineValue / 1000000).toFixed(1)}M` : '0'}
          prefix="$"
          change={metrics.data ? 12 : undefined}
          trend="up"
          loading={isLoading}
        />
        <MetricCard
          title="Deals in Progress"
          value={metrics.data?.dealsInProgress || 0}
          change={metrics.data ? -5 : undefined}
          trend="down"
          loading={isLoading}
        />
        <MetricCard
          title="Total Revenue (SGD)"
          value={metrics.data?.totalRevenue ? `${(metrics.data.totalRevenue / 1000000).toFixed(1)}M` : '0'}
          prefix="$"
          change={metrics.data ? 8 : undefined}
          trend="up"
          loading={isLoading}
        />
        <MetricCard
          title="Win Rate"
          value={metrics.data?.winRate || 0}
          suffix="%"
          change={metrics.data ? 3 : undefined}
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

      {/* Full Width Chart */}
      <HealthStatusChart 
        data={healthStatusData} 
        loading={isLoading} 
      />

      {/* O2R Status Overview */}
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

      {/* Attention Required Table */}
      <Card className="pp-metric-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle 
              style={{ 
                fontSize: 'var(--pp-font-size-lg)',
                fontWeight: 'var(--pp-font-weight-semibold)',
              }}
            >
              Attention Required
            </CardTitle>
            {attentionRequired.data && attentionRequired.data.length > 0 && (
              <StatusBadge 
                status="warning" 
                label={`${attentionRequired.data.length} items`} 
                size="sm" 
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !attentionRequired.data || attentionRequired.data.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No critical items - your pipeline is healthy!</p>
                <p className="text-xs mt-1">All deals are progressing within expected timeframes</p>
              </div>
            </div>
          ) : (
            <Table className="pp-data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Deal Name</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Value (SGD)</TableHead>
                  <TableHead>Health Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attentionRequired.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell 
                      style={{ fontWeight: 'var(--pp-font-weight-medium)' }}
                    >
                      {item.name}
                    </TableCell>
                    <TableCell>Phase {item.phase}</TableCell>
                    <TableCell>${item.amountSgd?.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.healthStatus} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}