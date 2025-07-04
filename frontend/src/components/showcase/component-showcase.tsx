import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { MetricCard } from '../ui/metric-card';
import { StatusBadge } from '../ui/status-badge';
import { O2RPhaseIndicator } from '../ui/o2r-phase-indicator';
import { DataTable, type Column } from '../ui/data-table';
import { LoadingSpinner } from '../ui/loading-spinner';
import { EmptyState } from '../ui/empty-state';
import { Button } from '../ui/button';
import { FileX, BarChart3 } from 'lucide-react';

// Sample data for DataTable
interface SampleOpportunity {
  id: string;
  name: string;
  value: string;
  phase: number;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  daysInPhase: number;
}

const sampleOpportunities: SampleOpportunity[] = [
  {
    id: '1',
    name: 'TechCorp Enterprise',
    value: '$125,000',
    phase: 2,
    status: 'warning',
    daysInPhase: 45,
  },
  {
    id: '2',
    name: 'StartupXYZ Growth',
    value: '$75,000',
    phase: 4,
    status: 'success',
    daysInPhase: 15,
  },
  {
    id: '3',
    name: 'BigCorp Solutions',
    value: '$250,000',
    phase: 1,
    status: 'danger',
    daysInPhase: 60,
  },
];

const opportunityColumns: Column<SampleOpportunity>[] = [
  {
    key: 'name',
    header: 'Deal Name',
    accessor: (item) => (
      <span style={{ fontWeight: 'var(--pp-font-weight-medium)' }}>{item.name}</span>
    ),
  },
  {
    key: 'phase',
    header: 'Phase',
    accessor: (item) => `Phase ${item.phase}`,
  },
  {
    key: 'value',
    header: 'Value',
    accessor: (item) => item.value,
  },
  {
    key: 'daysInPhase',
    header: 'Days in Phase',
    accessor: (item) => item.daysInPhase.toString(),
  },
  {
    key: 'status',
    header: 'Status',
    accessor: (item) => <StatusBadge status={item.status} size="sm" />,
  },
];

export const ComponentShowcase: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [currentPhase, setCurrentPhase] = React.useState<1 | 2 | 3 | 4>(2);

  const handleLoadingToggle = () => {
    setLoading(!loading);
  };

  const handlePhaseChange = () => {
    setCurrentPhase((prev) => ((prev % 4) + 1) as 1 | 2 | 3 | 4);
  };

  return (
    <div
      className="space-y-8 p-8"
      style={{
        gap: 'var(--pp-space-8)',
        padding: 'var(--pp-space-8)',
      }}
    >
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 'var(--pp-font-size-3xl)',
            fontWeight: 'var(--pp-font-weight-bold)',
            lineHeight: 'var(--pp-line-height-tight)',
            marginBottom: 'var(--pp-space-2)',
          }}
        >
          Pipeline Pulse Component Showcase
        </h1>
        <p
          style={{
            fontSize: 'var(--pp-font-size-lg)',
            color: 'var(--pp-color-neutral-600)',
          }}
        >
          A comprehensive showcase of all core UI components with Pipeline Pulse design tokens
        </p>
      </div>

      {/* MetricCard Section */}
      <section>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>MetricCard Components</CardTitle>
            <CardDescription>
              Key performance metrics with trend indicators and loading states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Pipeline Value"
                value="1.2M"
                prefix="$"
                change={12}
                trend="up"
                loading={loading}
              />
              <MetricCard
                title="Deals in Progress"
                value="47"
                change={-5}
                trend="down"
                loading={loading}
              />
              <MetricCard
                title="Average Deal Size"
                value="25.5K"
                prefix="$"
                change={8}
                trend="up"
                loading={loading}
              />
              <MetricCard
                title="Win Rate"
                value="68"
                suffix="%"
                trend="neutral"
                loading={loading}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* StatusBadge Section */}
      <section>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>StatusBadge Components</CardTitle>
            <CardDescription>
              Health status indicators with different sizes and variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Different Status Types</h4>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status="success" />
                  <StatusBadge status="warning" />
                  <StatusBadge status="danger" />
                  <StatusBadge status="neutral" />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Different Sizes</h4>
                <div className="flex gap-2 items-center flex-wrap">
                  <StatusBadge status="success" size="sm" />
                  <StatusBadge status="warning" size="md" />
                  <StatusBadge status="danger" size="lg" />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Custom Labels</h4>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status="success" label="Approved" />
                  <StatusBadge status="warning" label="Needs Review" />
                  <StatusBadge status="danger" label="Overdue" />
                  <StatusBadge status="neutral" label="Pending" showIcon={false} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* O2RPhaseIndicator Section */}
      <section>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>O2R Phase Indicator</CardTitle>
            <CardDescription>
              Visual representation of the 4-phase O2R process with current phase highlighting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h4 className="text-sm font-medium">Current Phase: {currentPhase}</h4>
                  <Button size="sm" onClick={handlePhaseChange}>
                    Next Phase
                  </Button>
                </div>
                <O2RPhaseIndicator currentPhase={currentPhase} />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Compact Variant</h4>
                <O2RPhaseIndicator currentPhase={currentPhase} variant="compact" />
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Without Labels</h4>
                <O2RPhaseIndicator currentPhase={currentPhase} showLabels={false} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* DataTable Section */}
      <section>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>DataTable Component</CardTitle>
            <CardDescription>
              Structured data display with Pipeline Pulse styling and loading states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" onClick={handleLoadingToggle}>
                  {loading ? 'Hide Loading' : 'Show Loading'}
                </Button>
              </div>
              
              <DataTable
                data={sampleOpportunities}
                columns={opportunityColumns}
                loading={loading}
                hoverable
                emptyStateMessage="No opportunities found"
                onRowClick={(item) => alert(`Clicked on ${item.name}`)}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* LoadingSpinner Section */}
      <section>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>LoadingSpinner Component</CardTitle>
            <CardDescription>
              Loading indicators with different sizes and variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <h4 className="text-sm font-medium mb-2">Small</h4>
                <LoadingSpinner size="sm" message="Loading..." />
              </div>
              
              <div className="text-center">
                <h4 className="text-sm font-medium mb-2">Medium (Default)</h4>
                <LoadingSpinner size="md" message="Syncing data..." />
              </div>
              
              <div className="text-center">
                <h4 className="text-sm font-medium mb-2">Large</h4>
                <LoadingSpinner size="lg" variant="primary" />
              </div>
              
              <div className="text-center">
                <h4 className="text-sm font-medium mb-2">Extra Large</h4>
                <LoadingSpinner size="xl" variant="muted" message="Processing..." />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* EmptyState Section */}
      <section>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>EmptyState Component</CardTitle>
            <CardDescription>
              Placeholder states for when no data is available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="border rounded-lg p-4">
                <EmptyState
                  icon={<FileX size={48} />}
                  title="No opportunities found"
                  description="Get started by creating your first opportunity or syncing data from your CRM."
                  action={{
                    label: 'Create Opportunity',
                    onClick: () => alert('Create opportunity clicked'),
                  }}
                  size="sm"
                />
              </div>
              
              <div className="border rounded-lg p-4">
                <EmptyState
                  icon={<BarChart3 size={64} />}
                  title="No analytics data"
                  description="Analytics will appear here once you have opportunity data to analyze."
                  action={{
                    label: 'Sync Data',
                    onClick: () => alert('Sync data clicked'),
                    variant: 'outline',
                  }}
                  size="md"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Design Token Examples */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Design Token Examples</CardTitle>
            <CardDescription>
              Visual representation of Pipeline Pulse design tokens in use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Colors */}
              <div>
                <h4 className="text-sm font-medium mb-2">Color Palette</h4>
                <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg mx-auto mb-1"
                      style={{ backgroundColor: 'var(--pp-color-primary-500)' }}
                    />
                    <span className="text-xs">Primary</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg mx-auto mb-1"
                      style={{ backgroundColor: 'var(--pp-color-success-500)' }}
                    />
                    <span className="text-xs">Success</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg mx-auto mb-1"
                      style={{ backgroundColor: 'var(--pp-color-warning-500)' }}
                    />
                    <span className="text-xs">Warning</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg mx-auto mb-1"
                      style={{ backgroundColor: 'var(--pp-color-danger-500)' }}
                    />
                    <span className="text-xs">Danger</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg mx-auto mb-1"
                      style={{ backgroundColor: 'var(--pp-color-neutral-500)' }}
                    />
                    <span className="text-xs">Neutral</span>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div>
                <h4 className="text-sm font-medium mb-2">Typography Scale</h4>
                <div className="space-y-2">
                  <div style={{ fontSize: 'var(--pp-font-size-xs)' }}>Extra Small (12px)</div>
                  <div style={{ fontSize: 'var(--pp-font-size-sm)' }}>Small (14px)</div>
                  <div style={{ fontSize: 'var(--pp-font-size-md)' }}>Medium (16px)</div>
                  <div style={{ fontSize: 'var(--pp-font-size-lg)' }}>Large (18px)</div>
                  <div style={{ fontSize: 'var(--pp-font-size-xl)' }}>Extra Large (20px)</div>
                  <div style={{ fontSize: 'var(--pp-font-size-2xl)' }}>2X Large (24px)</div>
                </div>
              </div>

              {/* Spacing */}
              <div>
                <h4 className="text-sm font-medium mb-2">Spacing Examples</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div
                      className="bg-primary h-4"
                      style={{ width: 'var(--pp-space-2)' }}
                    />
                    <span className="ml-2 text-xs">Space 2 (8px)</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="bg-primary h-4"
                      style={{ width: 'var(--pp-space-4)' }}
                    />
                    <span className="ml-2 text-xs">Space 4 (16px)</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="bg-primary h-4"
                      style={{ width: 'var(--pp-space-8)' }}
                    />
                    <span className="ml-2 text-xs">Space 8 (32px)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};