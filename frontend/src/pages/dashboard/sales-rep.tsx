import * as React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { O2RPhaseIndicator } from '@/components/ui/o2r-phase-indicator';
import { PipelineValueChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  User, 
  Target, 
  Calendar, 
  TrendingUp,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import type { PipelineValueDataPoint } from '@/components/charts';

// Sales Rep specific data interfaces
export interface SalesRepMetrics {
  quota: number;
  actual: number;
  attainment: number;
  myDeals: number;
  avgDealSize: number;
  salesCycle: number;
  activitiesThisWeek: number;
  meetingsScheduled: number;
}

export interface MyOpportunity {
  id: string;
  name: string;
  accountName: string;
  value: number;
  phase: 1 | 2 | 3 | 4;
  probability: number;
  expectedCloseDate: string;
  daysInPhase: number;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

export interface UpcomingActivity {
  id: string;
  type: 'call' | 'meeting' | 'email' | 'proposal';
  title: string;
  opportunityName: string;
  scheduledFor: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SalesRepDashboardData {
  metrics: SalesRepMetrics | null;
  myOpportunities: MyOpportunity[];
  upcomingActivities: UpcomingActivity[];
  pipelineValueData: PipelineValueDataPoint[];
  loading: boolean;
  lastUpdated: string | null;
}

// Hook for sales rep dashboard data
function useSalesRepDashboardData(): SalesRepDashboardData {
  const [data, setData] = React.useState<SalesRepDashboardData>({
    metrics: null,
    myOpportunities: [],
    upcomingActivities: [],
    pipelineValueData: [],
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

export default function SalesRepDashboardPage() {
  const {
    metrics,
    myOpportunities,
    upcomingActivities,
    pipelineValueData,
    loading,
    lastUpdated
  } = useSalesRepDashboardData();

  const handleRefresh = () => {
    window.location.reload();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'proposal': return <FileText className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
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
              My Sales Dashboard
            </h1>
            <Badge variant="outline" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              Personal View
            </Badge>
          </div>
          <p 
            style={{ 
              fontSize: 'var(--pp-font-size-md)',
              color: 'var(--pp-color-neutral-600)',
              marginTop: 'var(--pp-space-1)',
            }}
          >
            Track your opportunities and stay on top of your goals
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
          Refresh
        </Button>
      </div>

      {/* Quota Progress */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: 'var(--pp-font-size-lg)',
              fontWeight: 'var(--pp-font-weight-semibold)',
            }}
          >
            <Target className="h-5 w-5 mr-2 inline" />
            My Quota Achievement
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
                    color: (metrics?.attainment || 0) >= 100 ? 'var(--pp-color-success-500)' : 'var(--pp-color-warning-500)',
                  }}
                >
                  {metrics?.attainment || 0}%
                </span>
                <div className="text-sm text-muted-foreground">
                  <p>${metrics?.actual?.toLocaleString() || 0} of ${metrics?.quota?.toLocaleString() || 0}</p>
                  <p>Quarterly quota</p>
                </div>
              </div>
              <Progress value={metrics?.attainment || 0} className="h-3" />
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
          title="My Active Deals"
          value={metrics?.myDeals || 0}
          change={metrics ? 3 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Avg Deal Size (SGD)"
          value={metrics?.avgDealSize ? `${(metrics.avgDealSize / 1000).toFixed(0)}K` : '0'}
          prefix="$"
          change={metrics ? 15 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Sales Cycle Length"
          value={metrics?.salesCycle || 0}
          suffix=" days"
          change={metrics ? -10 : undefined}
          trend="up"
          loading={loading}
        />
        <MetricCard
          title="Activities This Week"
          value={metrics?.activitiesThisWeek || 0}
          change={metrics ? 25 : undefined}
          trend="up"
          loading={loading}
        />
      </div>

      {/* Pipeline Chart */}
      <PipelineValueChart 
        data={pipelineValueData} 
        loading={loading} 
      />

      {/* Two Column Layout */}
      <div 
        className="grid gap-6 lg:grid-cols-2"
        style={{ gap: 'var(--pp-space-6)' }}
      >
        {/* My Opportunities */}
        <Card className="pp-metric-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle 
                style={{ 
                  fontSize: 'var(--pp-font-size-lg)',
                  fontWeight: 'var(--pp-font-weight-semibold)',
                }}
              >
                My Active Opportunities
              </CardTitle>
              <Badge variant="outline">
                {myOpportunities.length} deals
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : myOpportunities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No active opportunities</p>
                <p className="text-xs">New opportunities will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOpportunities.slice(0, 5).map((opportunity) => (
                  <div key={opportunity.id} className="border-b last:border-b-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{opportunity.name}</p>
                        <p className="text-xs text-muted-foreground">{opportunity.accountName}</p>
                      </div>
                      <StatusBadge status={opportunity.status} size="sm" />
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>${opportunity.value.toLocaleString()}</span>
                      <span>Phase {opportunity.phase}</span>
                      <span>{opportunity.probability}% prob.</span>
                    </div>
                    <div className="mt-1">
                      <O2RPhaseIndicator 
                        currentPhase={opportunity.phase} 
                        variant="compact" 
                        showLabels={false} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
        <Card className="pp-metric-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle 
                style={{ 
                  fontSize: 'var(--pp-font-size-lg)',
                  fontWeight: 'var(--pp-font-weight-semibold)',
                }}
              >
                Upcoming Activities
              </CardTitle>
              <Badge variant="outline">
                {upcomingActivities.length} scheduled
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : upcomingActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No upcoming activities</p>
                <p className="text-xs">Schedule activities to stay engaged with prospects</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingActivities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 ${getPriorityColor(activity.priority)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.opportunityName}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.scheduledFor).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">New Opportunity</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Schedule Meeting</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Phone className="h-5 w-5" />
              <span className="text-xs">Log Call</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <FileText className="h-5 w-5" />
              <span className="text-xs">Send Proposal</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}