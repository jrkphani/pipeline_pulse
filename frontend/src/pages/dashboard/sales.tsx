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
import type { 
  PipelineValueDataPoint, 
  O2RPhaseDataPoint, 
  HealthStatusDataPoint 
} from '@/components/charts';

// Sales Manager specific data interfaces
export interface SalesManagerMetrics {
  teamQuota: number;
  teamActual: number;
  avgDealSize: number;
  salesCycle: number;
  teamVelocity: number;
  activeDeals: number;
}

export interface TeamMember {
  id: string;
  name: string;
  quota: number;
  actual: number;
  attainment: number;
  deals: number;
}

export interface SalesManagerDashboardData {
  metrics: SalesManagerMetrics | null;
  teamMembers: TeamMember[];
  pipelineValueData: PipelineValueDataPoint[];
  o2rPhaseData: O2RPhaseDataPoint[];
  healthStatusData: HealthStatusDataPoint[];
  loading: boolean;
  lastUpdated: string | null;
}

// Hook for sales manager dashboard data
function useSalesManagerDashboardData(): SalesManagerDashboardData {
  const [data, setData] = React.useState<SalesManagerDashboardData>({
    metrics: null,
    teamMembers: [],
    pipelineValueData: [],
    o2rPhaseData: [],
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

export default function SalesManagerDashboardPage() {
  const {
    metrics,
    teamMembers,
    pipelineValueData,
    o2rPhaseData,
    healthStatusData,
    loading,
    lastUpdated
  } = useSalesManagerDashboardData();

  const handleRefresh = () => {
    window.location.reload();
  };

  const quotaAttainment = metrics ? Math.round((metrics.teamActual / metrics.teamQuota) * 100) : 0;

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
          {loading ? (
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
                  <p>${metrics?.teamActual?.toLocaleString() || 0} of ${metrics?.teamQuota?.toLocaleString() || 0}</p>
                  <p>Team quota achievement</p>
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
          value={metrics?.avgDealSize ? `${(metrics.avgDealSize / 1000).toFixed(0)}K` : '0'}
          prefix="$"
          change={metrics ? 12 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Sales Cycle Length"
          value={metrics?.salesCycle || 0}
          suffix=" days"
          change={metrics ? -8 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Team Velocity"
          value={metrics?.teamVelocity || 0}
          suffix=" deals/month"
          change={metrics ? 15 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Active Deals"
          value={metrics?.activeDeals || 0}
          change={metrics ? 7 : undefined}
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

      {/* Health Status Chart */}
      <HealthStatusChart 
        data={healthStatusData} 
        loading={loading} 
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
          {loading ? (
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
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No team members data available</p>
              <p className="text-xs">Team performance will appear once data is synced</p>
            </div>
          ) : (
            <div className="space-y-6">
              {teamMembers.map((member) => (
                <div key={member.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${member.actual.toLocaleString()} of ${member.quota.toLocaleString()} 
                        <span className="ml-2">• {member.deals} deals</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{member.attainment}%</p>
                      <StatusBadge 
                        status={member.attainment >= 100 ? 'success' : member.attainment >= 80 ? 'warning' : 'danger'} 
                        size="sm" 
                      />
                    </div>
                  </div>
                  <Progress value={member.attainment} className="h-2" />
                </div>
              ))}
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
    </div>
  );
}