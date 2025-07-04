import * as React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PipelineValueChart, HealthStatusChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import type { 
  PipelineValueDataPoint, 
  HealthStatusDataPoint 
} from '@/components/charts';

// Executive-specific data interfaces
export interface ExecutiveMetrics {
  totalRevenue: number;
  quarterlyGrowth: number;
  pipelineVelocity: number;
  conversionRate: number;
  teamPerformance: number;
  riskFactors: number;
}

export interface ExecutiveDashboardData {
  metrics: ExecutiveMetrics | null;
  pipelineValueData: PipelineValueDataPoint[];
  healthStatusData: HealthStatusDataPoint[];
  loading: boolean;
  lastUpdated: string | null;
}

// Hook for executive dashboard data
function useExecutiveDashboardData(): ExecutiveDashboardData {
  const [data, setData] = React.useState<ExecutiveDashboardData>({
    metrics: null,
    pipelineValueData: [],
    healthStatusData: [],
    loading: true,
    lastUpdated: null,
  });

  React.useEffect(() => {
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

export default function ExecutiveDashboardPage() {
  const {
    metrics,
    pipelineValueData,
    healthStatusData,
    loading,
    lastUpdated
  } = useExecutiveDashboardData();

  const handleRefresh = () => {
    window.location.reload();
  };

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
              Executive Dashboard
            </h1>
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Strategic View
            </Badge>
          </div>
          <p 
            style={{ 
              fontSize: 'var(--pp-font-size-md)',
              color: 'var(--pp-color-neutral-600)',
              marginTop: 'var(--pp-space-1)',
            }}
          >
            High-level performance insights and strategic KPIs
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
          Refresh Data
        </Button>
      </div>

      {/* Executive KPIs */}
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        style={{ gap: 'var(--pp-space-4)' }}
      >
        <MetricCard
          title="Total Revenue (SGD)"
          value={metrics?.totalRevenue ? `${(metrics.totalRevenue / 1000000).toFixed(1)}M` : '0'}
          prefix="$"
          change={metrics ? 15 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Quarterly Growth"
          value={metrics?.quarterlyGrowth || 0}
          suffix="%"
          change={metrics ? 8 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Pipeline Velocity"
          value={metrics?.pipelineVelocity || 0}
          suffix=" days"
          change={metrics ? -12 : undefined}
          trend="up"
          loading={loading}
        />
      </div>

      {/* Secondary Metrics */}
      <div 
        className="grid gap-4 md:grid-cols-3"
        style={{ gap: 'var(--pp-space-4)' }}
      >
        <MetricCard
          title="Conversion Rate"
          value={metrics?.conversionRate || 0}
          suffix="%"
          change={metrics ? 5 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Team Performance"
          value={metrics?.teamPerformance || 0}
          suffix="/10"
          change={metrics ? 0.3 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Risk Factors"
          value={metrics?.riskFactors || 0}
          change={metrics ? -2 : undefined}
          trend="up"
          loading={loading}
        />
      </div>

      {/* Strategic Charts */}
      <div 
        className="grid gap-6 lg:grid-cols-1"
        style={{ gap: 'var(--pp-space-6)' }}
      >
        <PipelineValueChart 
          data={pipelineValueData} 
          loading={loading} 
        />
      </div>

      {/* Health Overview */}
      <HealthStatusChart 
        data={healthStatusData} 
        loading={loading} 
      />

      {/* Strategic Insights */}
      <div 
        className="grid gap-6 lg:grid-cols-2"
        style={{ gap: 'var(--pp-space-6)' }}
      >
        {/* Key Insights */}
        <Card className="pp-metric-card">
          <CardHeader>
            <CardTitle 
              style={{ 
                fontSize: 'var(--pp-font-size-lg)',
                fontWeight: 'var(--pp-font-weight-semibold)',
              }}
            >
              <TrendingUp className="h-5 w-5 mr-2 inline" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pipeline health improving</p>
                    <p className="text-muted-foreground text-xs">15% increase in on-track deals this quarter</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Velocity optimization needed</p>
                    <p className="text-muted-foreground text-xs">Phase II duration averaging 45 days vs 30-day target</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Territory performance variance</p>
                    <p className="text-muted-foreground text-xs">Asia-Pacific leading with 125% of target achieved</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card className="pp-metric-card">
          <CardHeader>
            <CardTitle 
              style={{ 
                fontSize: 'var(--pp-font-size-lg)',
                fontWeight: 'var(--pp-font-weight-semibold)',
              }}
            >
              <AlertTriangle className="h-5 w-5 mr-2 inline" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <StatusBadge status="warning" size="sm" showIcon={false} />
                  <div>
                    <p className="font-medium">Large deals at risk</p>
                    <p className="text-muted-foreground text-xs">$2.1M in Phase III deals overdue by 30+ days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <StatusBadge status="neutral" size="sm" showIcon={false} />
                  <div>
                    <p className="font-medium">Resource constraints</p>
                    <p className="text-muted-foreground text-xs">Technical team at 95% capacity for Q4 delivery</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}