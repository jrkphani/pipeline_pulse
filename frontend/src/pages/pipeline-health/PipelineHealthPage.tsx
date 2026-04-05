import { Skeleton } from '@/components/ui/skeleton';
import { InsightsPageShell } from '@/components/layout/InsightsPageShell';
import { useReports } from '@/hooks/useReports';
import { HealthTab } from '@/pages/reports/tabs/HealthTab';

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

export function PipelineHealthPage() {
  const { data, isLoading } = useReports();

  return (
    <InsightsPageShell title="Pipeline Health">
      {isLoading || !data ? (
        <InsightsSkeleton />
      ) : (
        <HealthTab data={data.health} />
      )}
    </InsightsPageShell>
  );
}
