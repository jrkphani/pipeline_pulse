// Authentication hooks
export {
  useLogin,
  useRegister,
  useLogout,
  useCurrentUser,
  useMyProfile,
  useUpdateProfile,
} from './useAuth';

// Dashboard data hooks
export {
  useDashboardMetrics,
  usePipelineChartData,
  useO2RPhaseChartData,
  useHealthChartData,
  useAttentionRequired,
  useSyncDashboardData,
  useDashboardData,
  usePrefetchDashboardData,
} from './useDashboardData';

// Opportunity hooks
export {
  useOpportunities,
  useOpportunity,
  useCreateOpportunity,
  useUpdateOpportunity,
  useDeleteOpportunity,
  useBulkUpdateHealthStatus,
  useOpportunityOperations,
} from './useOpportunityData';

// Sync hooks
export {
  useSyncStatus,
  useSyncHistory,
  useTriggerFullSync,
  useTriggerIncrementalSync,
  useSyncSession,
  useCancelSync,
  useRetrySync,
  useSyncOperations,
} from './useSync';

// Utility hooks
export { useToast, toast } from './useToast';

// Other hooks
export { useRealTimeSync } from './useRealTimeSync';