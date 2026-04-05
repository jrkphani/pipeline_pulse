import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { DealDetailShell } from '@/components/deal-detail/DealDetailShell';
import type { DealDetail } from '@/types/deal-detail';

/**
 * DealDetailPage — full-page deal detail view.
 * Route: /pipeline/$dealId
 *
 * Fetches deal detail from API, delegates all rendering to DealDetailShell.
 */
export function DealDetailPage() {
  const { dealId } = useParams({ from: '/_authenticated/pipeline/$dealId' });
  const navigate = useNavigate();

  const { data: deal, isLoading, error } = useQuery<DealDetail>({
    queryKey: ['deal-detail', dealId],
    queryFn: () => apiClient.get<DealDetail>(`/deals/${dealId}`),
  });

  const handleBack = useCallback(() => {
    navigate({ to: '/pipeline' });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none" />
        <Skeleton className="h-16 w-full rounded-none" />
        <Skeleton className="h-8 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">Deal not found</p>
        <p className="text-sm mt-1">ID: {dealId}</p>
        <button
          type="button"
          className="mt-4 px-3 py-1.5 text-sm border rounded hover:bg-muted transition-colors"
          onClick={handleBack}
        >
          Back to Pipeline
        </button>
      </div>
    );
  }

  return <DealDetailShell deal={deal} onBack={handleBack} />;
}
