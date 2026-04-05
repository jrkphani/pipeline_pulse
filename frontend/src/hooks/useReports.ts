import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ReportsData } from '@/mocks/mock-reports';
import { useReportsStore } from '@/stores/reports.store';

export function useReports() {
  const { gtm, timeframe } = useReportsStore();

  return useQuery({
    queryKey: ['reports', { gtm, timeframe }] as const,
    queryFn: () => {
      const params = new URLSearchParams();
      if (gtm !== 'All GTM') {
        params.set('gtm', gtm);
      }
      if (timeframe) {
        params.set('timeframe', timeframe);
      }
      const qs = params.toString();
      return apiClient.get<ReportsData>(qs ? `/reports?${qs}` : '/reports');
    },
    staleTime: 60_000,
  });
}
