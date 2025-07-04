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
import type { 
  PipelineValueDataPoint, 
  O2RPhaseDataPoint, 
  HealthStatusDataPoint 
} from '@/components/charts';

// Dashboard data interfaces (structure only, no mock data)
export interface DashboardMetrics {
  totalPipelineValue: number;
  dealsInProgress: number;
  averageDealSize: number;
  winRate: number;
}

export interface AttentionRequiredItem {
  id: string;
  dealName: string;
  phase: string;
  value: number;
  daysInPhase: number;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

export interface DashboardData {
  metrics: DashboardMetrics | null;
  pipelineValueData: PipelineValueDataPoint[];
  o2rPhaseData: O2RPhaseDataPoint[];
  healthStatusData: HealthStatusDataPoint[];
  attentionRequired: AttentionRequiredItem[];
  loading: boolean;
  lastUpdated: string | null;
}

// Hook for dashboard data (placeholder structure)
function useDashboardData(): DashboardData {
  const [data, setData] = React.useState<DashboardData>({
    metrics: null,
    pipelineValueData: [],
    o2rPhaseData: [],
    healthStatusData: [],
    attentionRequired: [],
    loading: true,
    lastUpdated: null,
  });

  React.useEffect(() => {
    // Simulate loading state for demonstration
    const timer = setTimeout(() => {
      setData(prev => ({
        ...prev,
        loading: false,
        lastUpdated: new Date().toISOString(),
      }));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return data;
}

export default function DashboardPage() {
  const {
    metrics,
    pipelineValueData,
    o2rPhaseData,
    healthStatusData,
    attentionRequired,
    loading,
    lastUpdated
  } = useDashboardData();

  const handleRefresh = () => {
    // Implement refresh logic
    window.location.reload();
  };

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
            {lastUpdated && (
              <span className="ml-2 text-xs text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
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
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Now
        </Button>
      </div>

      {/* Metrics Grid */}
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 'var(--pp-space-4)' }}
      >
        <MetricCard
          title="Total Pipeline Value (SGD)"
          value={metrics?.totalPipelineValue ? `${(metrics.totalPipelineValue / 1000000).toFixed(1)}M` : '0'}
          prefix="$"
          change={metrics ? 12 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Deals in Progress"
          value={metrics?.dealsInProgress || 0}
          change={metrics ? -5 : undefined}
          trend="down"
          loading={loading}
        />
        <MetricCard
          title="Average Deal Size (SGD)"
          value={metrics?.averageDealSize ? `${(metrics.averageDealSize / 1000).toFixed(1)}K` : '0'}
          prefix="$"
          change={metrics ? 8 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Win Rate"
          value={metrics?.winRate || 0}
          suffix="%"
          change={metrics ? 3 : undefined}
          trend="up"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div 
        className="grid gap-6 lg:grid-cols-2"
        style={{ gap: 'var(--pp-space-6)' }}
      >
        <PipelineValueChart 
          data={pipelineValueData} 
          loading={loading} 
        />
        <O2RPhaseChart 
          data={o2rPhaseData} 
          loading={loading} 
        />
      </div>

      {/* Full Width Chart */}
      <HealthStatusChart 
        data={healthStatusData} 
        loading={loading} 
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
              { phase: 'Phase I', count: 0, status: 'neutral' as const },
              { phase: 'Phase II', count: 0, status: 'neutral' as const },
              { phase: 'Phase III', count: 0, status: 'neutral' as const },
              { phase: 'Phase IV', count: 0, status: 'neutral' as const },
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
                  {loading ? '-' : item.count}
                </p>
                {!loading && <StatusBadge status={item.status} size="sm" />}
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
            {attentionRequired.length > 0 && (
              <StatusBadge 
                status="warning" 
                label={`${attentionRequired.length} items`} 
                size="sm" 
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : attentionRequired.length === 0 ? (
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
                  <TableHead>Days in Phase</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attentionRequired.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell 
                      style={{ fontWeight: 'var(--pp-font-weight-medium)' }}
                    >
                      {item.dealName}
                    </TableCell>
                    <TableCell>{item.phase}</TableCell>
                    <TableCell>${item.value.toLocaleString()}</TableCell>
                    <TableCell>{item.daysInPhase}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} size="sm" />
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