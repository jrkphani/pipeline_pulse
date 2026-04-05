import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadDetailShell } from '@/components/leads/LeadDetailShell';
import { toast } from '@/components/ui/use-toast';
import type { Lead, LeadActivity } from '@/types/leads';

interface LeadDetailPageProps {
  leadId: string;
}

export function LeadDetailPage({ leadId }: LeadDetailPageProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ['lead-detail', leadId],
    queryFn: () => apiClient.get<Lead>(`/leads/${leadId}`),
  });

  const { data: activities } = useQuery<LeadActivity[]>({
    queryKey: ['lead-activities', leadId],
    queryFn: () => apiClient.get<LeadActivity[]>(`/leads/${leadId}/activities`),
    enabled: !!lead,
  });

  const updateLead = useMutation({
    mutationFn: (updates: Partial<Lead>) =>
      apiClient.patch<Lead>(`/leads/${leadId}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-detail', leadId] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => {
      toast({ description: 'Failed to update lead', variant: 'destructive' });
    },
  });

  const fromParam = useMemo(
    () => new URLSearchParams(window.location.search).get('from'),
    [],
  );

  const backRoute = fromParam === 'lead-to-close' ? '/lead-to-close' : '/demand-gen/leads';

  const handleBack = useCallback(() => {
    navigate({ to: backRoute as '/lead-to-close' | '/demand-gen/leads' });
  }, [navigate, backRoute]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">Lead not found</p>
        <p className="text-sm mt-1">ID: {leadId}</p>
        <button
          type="button"
          className="mt-4 px-3 py-1.5 text-sm border rounded hover:bg-muted transition-colors"
          onClick={handleBack}
        >
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <LeadDetailShell
      lead={lead}
      activities={activities ?? []}
      onBack={handleBack}
      onUpdate={(updates) => updateLead.mutate(updates)}
    />
  );
}
