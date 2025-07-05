import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiError } from '../lib/apiClient';
import type { SyncStatus } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { useToast } from './useToast';

export const useSyncStatus = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['sync-status'],
    queryFn: () => apiClient.getSyncStatus(),
    enabled: isAuthenticated,
    refetchInterval: (data) => {
      // Poll every 5 seconds when sync is active, 30 seconds when idle
      return data?.data?.isRunning ? 5000 : 30000;
    },
    staleTime: 0, // Always fresh for real-time status
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 2;
    },
  });
};

export const useSyncHistory = (params?: {
  page?: number;
  limit?: number;
  status?: SyncStatus;
  type?: 'full' | 'incremental';
}) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['sync-history', params],
    queryFn: () => apiClient.getSyncHistory(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

export const useTriggerFullSync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => apiClient.triggerFullSync(),
    onSuccess: (syncSession) => {
      // Invalidate sync-related queries
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      // Invalidate opportunity data as it will be updated
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['o2r-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['health-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['attention-required'] });
      
      toast({
        title: 'Full sync started',
        description: `Sync session ${syncSession.id} has been initiated. This may take several minutes.`,
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Full sync failed:', error);
      toast({
        title: 'Full sync failed',
        description: error.message || 'Failed to start full sync. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useTriggerIncrementalSync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => apiClient.triggerIncrementalSync(),
    onSuccess: (syncSession) => {
      // Invalidate sync-related queries
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      // Invalidate opportunity data as it will be updated
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['o2r-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['health-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['attention-required'] });
      
      toast({
        title: 'Incremental sync started',
        description: `Sync session ${syncSession.id} has been initiated. This should complete shortly.`,
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Incremental sync failed:', error);
      toast({
        title: 'Incremental sync failed',
        description: error.message || 'Failed to start incremental sync. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to get a specific sync session
 */
export const useSyncSession = (sessionId: string) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['sync-session', sessionId],
    queryFn: () => apiClient.getSyncSession(sessionId),
    enabled: isAuthenticated && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Hook to cancel a sync session
 */
export const useCancelSync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => apiClient.cancelSync(sessionId),
    onSuccess: (result, sessionId) => {
      // Invalidate sync-related queries
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['sync-session', sessionId] });
      
      toast({
        title: 'Sync cancelled',
        description: result.message || 'Sync session has been cancelled successfully.',
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Cancel sync failed:', error);
      toast({
        title: 'Cancel sync failed',
        description: error.message || 'Failed to cancel sync session. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to retry a failed sync session
 */
export const useRetrySync = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => apiClient.retryFailedSync(sessionId),
    onSuccess: (syncSession, sessionId) => {
      // Invalidate sync-related queries
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['sync-session', sessionId] });
      
      toast({
        title: 'Sync retry started',
        description: `Retry for sync session ${syncSession.id} has been initiated.`,
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      console.error('Retry sync failed:', error);
      toast({
        title: 'Retry sync failed',
        description: error.message || 'Failed to retry sync session. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Combined hook for sync operations with comprehensive state management
 */
export const useSyncOperations = () => {
  const syncStatus = useSyncStatus();
  const syncHistory = useSyncHistory({ limit: 10 });
  const triggerFullSync = useTriggerFullSync();
  const triggerIncrementalSync = useTriggerIncrementalSync();
  const cancelSync = useCancelSync();
  const retrySync = useRetrySync();

  return {
    syncStatus,
    syncHistory,
    triggerFullSync,
    triggerIncrementalSync,
    cancelSync,
    retrySync,
    isLoading: syncStatus.isLoading || syncHistory.isLoading,
    isError: syncStatus.isError || syncHistory.isError,
    error: syncStatus.error || syncHistory.error,
  };
};