# React Query Hooks Documentation

This directory contains comprehensive React Query hooks for the Pipeline Pulse frontend application. All hooks are built with TypeScript, include proper error handling, loading states, and toast notifications.

## Hook Categories

### 1. Authentication Hooks (`useAuth.ts`)

#### `useLogin()`
- **Purpose**: Handles user login with credentials
- **Returns**: Mutation object with login function
- **Features**: 
  - Automatic token management
  - Auth store synchronization
  - Success/error toast notifications
  - Cache invalidation on success

#### `useRegister()`
- **Purpose**: Handles new user registration
- **Returns**: Mutation object with registration function
- **Features**: 
  - User creation and immediate login
  - Token storage and management
  - Welcome toast notification

#### `useLogout()`
- **Purpose**: Handles user logout
- **Returns**: Mutation object with logout function
- **Features**: 
  - Complete cache clearing
  - Token cleanup
  - Graceful error handling

#### `useCurrentUser()`
- **Purpose**: Fetches current authenticated user data
- **Returns**: Query object with user data
- **Features**: 
  - Automatic auth state sync
  - 10-minute stale time
  - No retry on auth failures

#### `useMyProfile()`
- **Purpose**: Fetches detailed user profile
- **Returns**: Query object with profile data
- **Features**: 
  - 5-minute stale time
  - Enabled only when authenticated

#### `useUpdateProfile()`
- **Purpose**: Updates user profile information
- **Returns**: Mutation object with update function
- **Features**: 
  - Optimistic updates
  - Cache synchronization
  - Success/error notifications

### 2. Dashboard Data Hooks (`useDashboardData.ts`)

#### `useDashboardMetrics(params?: ChartQueryParams)`
- **Purpose**: Fetches dashboard metrics with optional filtering
- **Parameters**: Date range, territory, phase filters
- **Returns**: Query object with metrics data
- **Features**: 
  - 5-minute stale time
  - Automatic retry with auth check
  - Comprehensive error handling

#### `usePipelineChartData(params?: ChartQueryParams)`
- **Purpose**: Fetches pipeline chart data for visualizations
- **Parameters**: Date range, territory, groupBy filters
- **Returns**: Query object with chart data
- **Features**: 
  - 3-minute stale time
  - Optimized for chart rendering
  - Background refetch support

#### `useO2RPhaseChartData(params?: ChartQueryParams)`
- **Purpose**: Fetches O2R (Opportunity-to-Revenue) phase distribution data
- **Parameters**: Date range and territory filters
- **Returns**: Query object with phase data
- **Features**: 
  - Phase-specific metrics
  - Revenue tracking
  - Performance monitoring

#### `useHealthChartData(params?: ChartQueryParams)`
- **Purpose**: Fetches health status distribution data
- **Parameters**: Date range and territory filters
- **Returns**: Query object with health metrics
- **Features**: 
  - Color-coded health states
  - Attention-required tracking
  - Risk assessment data

#### `useAttentionRequired(params?: { limit?: number; territoryId?: number })`
- **Purpose**: Fetches opportunities requiring immediate attention
- **Parameters**: Limit and territory filters
- **Returns**: Query object with critical opportunities
- **Features**: 
  - 2-minute stale time (frequent updates)
  - Priority-based filtering
  - Critical issue tracking

#### `useSyncDashboardData(enabled?: boolean)`
- **Purpose**: Syncs dashboard data with real-time polling
- **Parameters**: Enable/disable polling
- **Returns**: Query object with sync status
- **Features**: 
  - 30-second polling interval
  - Background sync support
  - Automatic invalidation

#### `useDashboardData(params?: ChartQueryParams)`
- **Purpose**: Combined hook for all dashboard data
- **Parameters**: Global dashboard filters
- **Returns**: Object with all dashboard queries
- **Features**: 
  - Consolidated loading states
  - Unified error handling
  - Optimized batch loading

#### `usePrefetchDashboardData(params?: ChartQueryParams)`
- **Purpose**: Prefetches dashboard data for performance optimization
- **Parameters**: Prefetch parameters
- **Returns**: Prefetch functions
- **Features**: 
  - Route transition optimization
  - Background data loading
  - Performance enhancement

### 3. Opportunity Hooks (`useOpportunityData.ts`)

#### `useOpportunities(filters?: OpportunityFilters)`
- **Purpose**: Fetches paginated opportunities with filtering
- **Parameters**: Pagination, search, and filter options
- **Returns**: Query object with opportunities data
- **Features**: 
  - Server-side pagination
  - Advanced filtering
  - Search capabilities

#### `useOpportunity(id: number)`
- **Purpose**: Fetches single opportunity by ID
- **Parameters**: Opportunity ID
- **Returns**: Query object with opportunity data
- **Features**: 
  - Individual opportunity details
  - Automatic cache management
  - Optimistic updates support

#### `useCreateOpportunity()`
- **Purpose**: Creates new opportunities
- **Returns**: Mutation object with create function
- **Features**: 
  - Form validation integration
  - Success notifications
  - Cache invalidation

#### `useUpdateOpportunity()`
- **Purpose**: Updates existing opportunities
- **Returns**: Mutation object with update function
- **Features**: 
  - Partial updates support
  - Optimistic UI updates
  - Conflict resolution

#### `useDeleteOpportunity()`
- **Purpose**: Deletes opportunities
- **Returns**: Mutation object with delete function
- **Features**: 
  - Confirmation dialogs
  - Cascade cache cleanup
  - Undo functionality support

#### `useBulkUpdateHealthStatus()`
- **Purpose**: Bulk updates health status for multiple opportunities
- **Parameters**: Opportunity IDs and new health status
- **Returns**: Mutation object with bulk update function
- **Features**: 
  - Batch processing
  - Progress tracking
  - Rollback on failure

#### `useOpportunityOperations()`
- **Purpose**: Combined hook for all opportunity operations
- **Returns**: Object with all opportunity mutations
- **Features**: 
  - Unified loading states
  - Consolidated error handling
  - Operation queuing

### 4. Sync Hooks (`useSync.ts`)

#### `useSyncStatus()`
- **Purpose**: Monitors sync operation status
- **Returns**: Query object with sync status
- **Features**: 
  - Real-time polling (5s active, 30s idle)
  - Progress tracking
  - Status notifications

#### `useSyncHistory(params?: SyncHistoryParams)`
- **Purpose**: Fetches sync operation history
- **Parameters**: Pagination and filtering options
- **Returns**: Query object with sync history
- **Features**: 
  - Paginated results
  - Status filtering
  - Type-based filtering

#### `useTriggerFullSync()`
- **Purpose**: Initiates full data synchronization
- **Returns**: Mutation object with sync function
- **Features**: 
  - Progress notifications
  - Comprehensive cache invalidation
  - Error recovery

#### `useTriggerIncrementalSync()`
- **Purpose**: Initiates incremental data synchronization
- **Returns**: Mutation object with sync function
- **Features**: 
  - Fast updates
  - Minimal cache invalidation
  - Background processing

#### `useSyncSession(sessionId: string)`
- **Purpose**: Fetches specific sync session details
- **Parameters**: Session ID
- **Returns**: Query object with session data
- **Features**: 
  - Session monitoring
  - Progress tracking
  - Error details

#### `useCancelSync()`
- **Purpose**: Cancels running sync operations
- **Returns**: Mutation object with cancel function
- **Features**: 
  - Graceful cancellation
  - Status notifications
  - Cleanup operations

#### `useRetrySync()`
- **Purpose**: Retries failed sync operations
- **Returns**: Mutation object with retry function
- **Features**: 
  - Failure recovery
  - Progressive backoff
  - Status tracking

#### `useSyncOperations()`
- **Purpose**: Combined hook for all sync operations
- **Returns**: Object with all sync queries and mutations
- **Features**: 
  - Unified interface
  - Comprehensive state management
  - Operation coordination

## Common Features

### Error Handling
- All hooks include proper error handling with type-safe error objects
- 401 errors automatically prevent retries to avoid auth loops
- User-friendly error messages with toast notifications
- Comprehensive error logging for debugging

### Loading States
- Consistent loading state management across all hooks
- Proper pending/loading indicators
- Background refetch support
- Optimistic updates where appropriate

### Caching Strategy
- Intelligent stale times based on data importance
- Garbage collection times for memory optimization
- Automatic cache invalidation on mutations
- Background updates for real-time data

### Authentication Integration
- All hooks respect authentication state
- Automatic disabling when not authenticated
- Proper token management and refresh
- Seamless auth state synchronization

### Toast Notifications
- Success notifications for positive actions
- Error notifications with actionable messages
- Progress notifications for long-running operations
- Consistent notification styling and timing

## Usage Examples

### Authentication
```typescript
import { useLogin, useCurrentUser } from '../hooks';

const LoginComponent = () => {
  const login = useLogin();
  const { data: user, isLoading } = useCurrentUser();
  
  const handleLogin = async (credentials) => {
    try {
      await login.mutateAsync(credentials);
    } catch (error) {
      // Error handling is automatic via toast
    }
  };
};
```

### Dashboard Data
```typescript
import { useDashboardData } from '../hooks';

const DashboardComponent = () => {
  const {
    metrics,
    pipelineChart,
    o2rChart,
    healthChart,
    attentionRequired,
    isLoading,
    isError
  } = useDashboardData({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    territoryId: 1
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;
  
  return <DashboardContent data={{ metrics, pipelineChart, o2rChart, healthChart, attentionRequired }} />;
};
```

### Sync Operations
```typescript
import { useSyncOperations } from '../hooks';

const SyncComponent = () => {
  const {
    syncStatus,
    syncHistory,
    triggerFullSync,
    triggerIncrementalSync,
    isLoading
  } = useSyncOperations();
  
  const handleFullSync = () => {
    triggerFullSync.mutate();
  };
  
  return (
    <div>
      <SyncStatus status={syncStatus.data} />
      <SyncHistory history={syncHistory.data} />
      <Button onClick={handleFullSync} disabled={isLoading}>
        Full Sync
      </Button>
    </div>
  );
};
```

## Performance Considerations

### Stale Time Configuration
- Critical data (attention required): 2 minutes
- Chart data: 3 minutes
- Metrics: 5 minutes
- User data: 10 minutes

### Polling Strategies
- Sync status: 5 seconds when active, 30 seconds when idle
- Real-time dashboard: 30 seconds
- Background sync: Configurable intervals

### Cache Management
- Automatic garbage collection
- Memory-efficient storage
- Intelligent invalidation
- Background updates

## Error Recovery

### Retry Logic
- Exponential backoff for network errors
- No retry for authentication errors
- Configurable retry counts
- Graceful degradation

### Offline Support
- Cached data availability
- Optimistic updates
- Sync on reconnection
- Offline indicators

## Testing

All hooks are designed to be easily testable with:
- Mock API responses
- Controlled authentication states
- Simulated network conditions
- Isolated mutation testing

## Migration Guide

When upgrading from individual API calls to these hooks:

1. Replace direct API calls with appropriate hooks
2. Update error handling to use toast notifications
3. Remove manual loading state management
4. Implement proper cache invalidation
5. Add authentication state dependencies
6. Update TypeScript types for better type safety

## Future Enhancements

- WebSocket integration for real-time updates
- Offline-first caching strategies
- Advanced prefetching algorithms
- Machine learning-based cache optimization
- Performance monitoring integration