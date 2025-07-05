import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type OpportunityFilters, type ApiError } from '../lib/apiClient';
import type { OpportunityCreate, HealthStatus } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { useToast } from './useToast';

export const useOpportunities = (filters: OpportunityFilters = {}) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => apiClient.getOpportunities(filters),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

export const useOpportunity = (id: number) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => apiClient.getOpportunity(id),
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: OpportunityCreate) => apiClient.createOpportunity(data),
    onSuccess: (newOpportunity) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['attention-required'] });
      
      toast({
        title: 'Opportunity created',
        description: `"${newOpportunity.name}" has been created successfully.`,
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Create opportunity failed:', error);
      toast({
        title: 'Create failed',
        description: error.message || 'Failed to create opportunity. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OpportunityCreate> }) =>
      apiClient.updateOpportunity(id, data),
    onSuccess: (updatedOpportunity) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['attention-required'] });
      queryClient.setQueryData(['opportunity', updatedOpportunity.id], updatedOpportunity);
      
      toast({
        title: 'Opportunity updated',
        description: `"${updatedOpportunity.name}" has been updated successfully.`,
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Update opportunity failed:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update opportunity. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteOpportunity(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['attention-required'] });
      queryClient.removeQueries({ queryKey: ['opportunity', deletedId] });
      
      toast({
        title: 'Opportunity deleted',
        description: 'The opportunity has been deleted successfully.',
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Delete opportunity failed:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete opportunity. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useBulkUpdateHealthStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ opportunityIds, healthStatus }: { opportunityIds: number[]; healthStatus: HealthStatus }) =>
      apiClient.bulkUpdateHealthStatus(opportunityIds, healthStatus),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['attention-required'] });
      queryClient.invalidateQueries({ queryKey: ['health-chart-data'] });
      
      toast({
        title: 'Bulk update completed',
        description: `Successfully updated ${result.updated} opportunities.`,
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Bulk update failed:', error);
      toast({
        title: 'Bulk update failed',
        description: error.message || 'Failed to update opportunities. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Combined hook for opportunity operations with comprehensive state management
 */
export const useOpportunityOperations = () => {
  const createOpportunity = useCreateOpportunity();
  const updateOpportunity = useUpdateOpportunity();
  const deleteOpportunity = useDeleteOpportunity();
  const bulkUpdateHealthStatus = useBulkUpdateHealthStatus();

  return {
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    bulkUpdateHealthStatus,
    isLoading: createOpportunity.isPending || updateOpportunity.isPending || 
               deleteOpportunity.isPending || bulkUpdateHealthStatus.isPending,
    isError: createOpportunity.isError || updateOpportunity.isError || 
             deleteOpportunity.isError || bulkUpdateHealthStatus.isError,
    error: createOpportunity.error || updateOpportunity.error || 
           deleteOpportunity.error || bulkUpdateHealthStatus.error,
  };
};