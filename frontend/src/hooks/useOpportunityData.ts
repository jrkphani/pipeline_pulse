import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OpportunityService } from '../services/opportunityService';
import type { OpportunityCreate } from '../types';

export const useOpportunities = (params: {
  page?: number;
  limit?: number;
  healthStatus?: string;
  territoryId?: number;
  phase?: number;
} = {}) => {
  return useQuery({
    queryKey: ['opportunities', params],
    queryFn: () => OpportunityService.getOpportunities(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOpportunity = (id: number) => {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => OpportunityService.getOpportunity(id),
    enabled: !!id,
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OpportunityCreate) => OpportunityService.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OpportunityCreate> }) =>
      OpportunityService.updateOpportunity(id, data),
    onSuccess: (updatedOpportunity) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.setQueryData(['opportunity', updatedOpportunity.id], updatedOpportunity);
    },
  });
};

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => OpportunityService.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
};

export const useBulkUpdateHealthStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ opportunityIds, healthStatus }: { opportunityIds: number[]; healthStatus: string }) =>
      OpportunityService.bulkUpdateHealthStatus(opportunityIds, healthStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
};