import { useQuery } from '@tanstack/react-query';
import { 
  apiClient, 
  type ChartQueryParams,
  type ApiError 
} from '../lib/apiClient';
import type { DashboardMetrics } from '../types';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Hook to fetch dashboard metrics with caching and error handling
 */
export const useDashboardMetrics = (params?: ChartQueryParams) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['dashboard-metrics', params],
    queryFn: () => apiClient.getDashboardMetrics(params),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Hook to fetch pipeline chart data with parameters
 */
export const usePipelineChartData = (params?: ChartQueryParams) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['pipeline-chart-data', params],
    queryFn: () => apiClient.getPipelineChartData(params),
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Hook to fetch O2R phase chart data
 */
export const useO2RPhaseChartData = (params?: ChartQueryParams) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['o2r-chart-data', params],
    queryFn: () => apiClient.getO2RChartData(params),
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Hook to fetch health status chart data with parameters
 */
export const useHealthChartData = (params?: ChartQueryParams) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['health-chart-data', params],
    queryFn: () => apiClient.getHealthChartData(params),
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Hook to fetch opportunities requiring attention
 */
export const useAttentionRequired = (params?: { limit?: number; territoryId?: number }) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['attention-required', params],
    queryFn: () => apiClient.getAttentionRequired(params),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for critical items)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if ((error as any)?.statusCode === 401) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Hook to sync dashboard data with polling for real-time updates
 */
export const useSyncDashboardData = (enabled: boolean = true) => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['sync-dashboard-data'],
    queryFn: () => apiClient.syncDashboardData(),
    enabled: isAuthenticated && enabled,
    staleTime: 0, // Always fresh for sync operations
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: enabled ? 30 * 1000 : false, // Poll every 30 seconds when enabled
    refetchIntervalInBackground: false, // Don't poll in background
    retry: (failureCount, error) => {
      if ((error as ApiError)?.statusCode === 401) return false;
      return failureCount < 2; // Fewer retries for sync operations
    },
  });
};

/**
 * Combined hook for dashboard data with optimized caching
 */
export const useDashboardData = (params?: ChartQueryParams) => {
  const metrics = useDashboardMetrics(params);
  const pipelineChart = usePipelineChartData(params);
  const o2rChart = useO2RPhaseChartData(params);
  const healthChart = useHealthChartData(params);
  const attentionRequired = useAttentionRequired({ 
    limit: 5, 
    territoryId: params?.territoryId 
  });

  return {
    metrics,
    pipelineChart,
    o2rChart,
    healthChart,
    attentionRequired,
    isLoading: metrics.isLoading || pipelineChart.isLoading || o2rChart.isLoading || 
               healthChart.isLoading || attentionRequired.isLoading,
    isError: metrics.isError || pipelineChart.isError || o2rChart.isError || 
             healthChart.isError || attentionRequired.isError,
    error: metrics.error || pipelineChart.error || o2rChart.error || 
           healthChart.error || attentionRequired.error,
  };
};

/**
 * Hook to prefetch dashboard data for better performance
 */
export const usePrefetchDashboardData = (params?: ChartQueryParams) => {
  const { isAuthenticated } = useAuthStore();

  // This can be used to prefetch data on route transitions
  return {
    prefetchMetrics: () => apiClient.getDashboardMetrics(params),
    prefetchPipelineChart: () => apiClient.getPipelineChartData(params),
    prefetchO2RChart: () => apiClient.getO2RChartData(params),
    prefetchHealthChart: () => apiClient.getHealthChartData(params),
    prefetchAttentionRequired: () => apiClient.getAttentionRequired({ territoryId: params?.territoryId }),
    enabled: isAuthenticated,
  };
};