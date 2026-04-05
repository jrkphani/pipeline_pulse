import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationQueueGrid } from '@/components/leads/GraduationQueueGrid';
import { toast } from '@/components/ui/use-toast';
import type { Lead } from '@/types/leads';

interface GraduationResponse {
  leads: Lead[];
  count: number;
}

export function GraduationQueuePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<GraduationResponse>({
    queryKey: ['graduation-queue'],
    queryFn: () => apiClient.get<GraduationResponse>('/graduation-queue'),
  });

  const approveMQL = useMutation({
    mutationFn: (vars: { leadId: string; ae_assigned: string; pc_assigned: string }) =>
      apiClient.post<Lead>(`/leads/${vars.leadId}/approve-mql`, {
        ae_assigned: vars.ae_assigned,
        pc_assigned: vars.pc_assigned,
      }),
    onSuccess: (lead) => {
      toast({
        description: `Deal ${lead.deal_id} created · ${lead.company_name}`,
      });
      qc.invalidateQueries({ queryKey: ['graduation-queue'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => {
      toast({ description: 'Failed to approve MQL', variant: 'destructive' });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-px overflow-hidden p-0">
        <Skeleton className="h-9 w-full rounded-none" />
        <Skeleton className="h-9 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
      </div>
    );
  }

  return (
    <div className="h-full flex-col flex overflow-hidden">
      <GraduationQueueGrid
        leads={data.leads}
        onApprove={(vars) => approveMQL.mutate(vars)}
      />
    </div>
  );
}
