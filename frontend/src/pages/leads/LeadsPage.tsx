import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadsGrid } from '@/components/leads/LeadsGrid';
import { toast } from '@/components/ui/use-toast';
import type { Lead, LeadsStats } from '@/types/leads';

interface LeadsResponse {
  leads: Lead[];
  stats: LeadsStats;
}

export function LeadsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<LeadsResponse>({
    queryKey: ['leads'],
    queryFn: () => apiClient.get<LeadsResponse>('/leads'),
  });

  const updateLead = useMutation({
    mutationFn: ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) =>
      apiClient.patch<Lead>(`/leads/${leadId}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => {
      toast({ description: 'Failed to update lead', variant: 'destructive' });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-px overflow-hidden p-0">
        <Skeleton className="h-10 w-full rounded-none" />
        <Skeleton className="h-9 w-full rounded-none" />
        <Skeleton className="h-9 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
        <Skeleton className="h-12 w-full rounded-none" />
      </div>
    );
  }

  return (
    <div className="h-full flex-col overflow-hidden flex">
      <LeadsGrid
        leads={data.leads}
        stats={data.stats}
        onLeadUpdate={(leadId, updates) => updateLead.mutate({ leadId, updates })}
      />
    </div>
  );
}
