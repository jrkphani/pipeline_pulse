import { Skeleton } from '@/components/ui/skeleton';
import { InsightsPageShell } from '@/components/layout/InsightsPageShell';
import { useReports } from '@/hooks/useReports';
import { ChannelsTab } from '@/pages/reports/tabs/ChannelsTab';

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

export function ChannelsPage() {
  const { data, isLoading } = useReports();

  return (
    <InsightsPageShell title="Channel Performance">
      {isLoading || !data ? (
        <InsightsSkeleton />
      ) : (
        <ChannelsTab data={data.channels} />
      )}
    </InsightsPageShell>
  );
}
