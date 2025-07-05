import React from 'react';
import { 
  useLogin, 
  useLogout, 
  useCurrentUser,
  useDashboardData,
  useOpportunities,
  useSyncOperations,
  useCreateOpportunity
} from './index';

/**
 * Example: Authentication Flow
 */
export const AuthExample = () => {
  const login = useLogin();
  const logout = useLogout();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  const handleLogin = async () => {
    try {
      await login.mutateAsync({
        email: 'user@example.com',
        password: 'password'
      });
      // Success toast is automatically shown
    } catch (error) {
      // Error toast is automatically shown
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    logout.mutate();
    // Success/error toasts are automatically shown
  };

  if (userLoading) return <div>Loading user...</div>;

  return (
    <div>
      {currentUser ? (
        <div>
          <p>Welcome, {currentUser.firstName}!</p>
          <button onClick={handleLogout} disabled={logout.isPending}>
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      ) : (
        <button onClick={handleLogin} disabled={login.isPending}>
          {login.isPending ? 'Logging in...' : 'Login'}
        </button>
      )}
    </div>
  );
};

/**
 * Example: Dashboard Data with Filtering
 */
export const DashboardExample = () => {
  const [dateRange, setDateRange] = React.useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  const {
    metrics,
    pipelineChart,
    o2rChart,
    healthChart,
    attentionRequired,
    isLoading,
    isError
  } = useDashboardData(dateRange);

  if (isLoading) return <div>Loading dashboard...</div>;
  if (isError) return <div>Error loading dashboard data</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      
      {/* Date Range Selector */}
      <div>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
        />
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </div>

      {/* Metrics */}
      {metrics.data && (
        <div>
          <h3>Key Metrics</h3>
          <p>Total Pipeline Value: ${metrics.data.totalPipelineValue?.toLocaleString()}</p>
          <p>Total Revenue: ${metrics.data.totalRevenue?.toLocaleString()}</p>
          <p>Deals in Progress: {metrics.data.dealsInProgress}</p>
          <p>Win Rate: {metrics.data.winRate}%</p>
        </div>
      )}

      {/* Attention Required */}
      {attentionRequired.data && (
        <div>
          <h3>Requires Attention ({attentionRequired.data.length})</h3>
          {attentionRequired.data.map(opportunity => (
            <div key={opportunity.id}>
              <p>{opportunity.name} - {opportunity.healthStatus}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart Data */}
      {o2rChart.data && (
        <div>
          <h3>O2R Phase Distribution</h3>
          <p>Phase 1 (Opportunity): ${o2rChart.data.phase1?.toLocaleString()}</p>
          <p>Phase 2 (Qualified): ${o2rChart.data.phase2?.toLocaleString()}</p>
          <p>Phase 3 (Proposal): ${o2rChart.data.phase3?.toLocaleString()}</p>
          <p>Phase 4 (Revenue): ${o2rChart.data.phase4?.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Example: Opportunities Management
 */
export const OpportunitiesExample = () => {
  const [filters, setFilters] = React.useState({
    page: 1,
    pageSize: 10,
    healthStatus: undefined as any
  });

  const { data: opportunities, isLoading, error } = useOpportunities(filters);
  const createOpportunity = useCreateOpportunity();

  const handleCreateOpportunity = async () => {
    try {
      await createOpportunity.mutateAsync({
        name: 'New Opportunity',
        amountLocal: 50000,
        localCurrency: 'USD',
        probability: 75,
        phase: 2,
        territoryId: 1,
        accountId: 1
      });
      // Success toast is automatically shown
    } catch (error) {
      // Error toast is automatically shown
      console.error('Create failed:', error);
    }
  };

  if (isLoading) return <div>Loading opportunities...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Opportunities</h2>
      
      {/* Filters */}
      <div>
        <select
          value={filters.healthStatus || ''}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            healthStatus: e.target.value || undefined 
          }))}
        >
          <option value="">All Health Status</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="danger">Danger</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      {/* Create Button */}
      <button 
        onClick={handleCreateOpportunity}
        disabled={createOpportunity.isPending}
      >
        {createOpportunity.isPending ? 'Creating...' : 'Create Opportunity'}
      </button>

      {/* Opportunities List */}
      {opportunities?.data.map(opportunity => (
        <div key={opportunity.id} style={{ border: '1px solid #ccc', margin: '8px', padding: '8px' }}>
          <h4>{opportunity.name}</h4>
          <p>Amount: ${opportunity.amountSgd?.toLocaleString()} SGD</p>
          <p>Phase: {opportunity.phase}</p>
          <p>Health: {opportunity.healthStatus}</p>
          <p>Probability: {opportunity.probability}%</p>
        </div>
      ))}

      {/* Pagination */}
      {opportunities?.pagination && (
        <div>
          <button
            disabled={filters.page <= 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span> Page {opportunities.pagination.page} of {opportunities.pagination.totalPages} </span>
          <button
            disabled={filters.page >= opportunities.pagination.totalPages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Example: Sync Operations
 */
export const SyncExample = () => {
  const {
    syncStatus,
    syncHistory,
    triggerFullSync,
    triggerIncrementalSync,
    cancelSync,
    isLoading
  } = useSyncOperations();

  const handleFullSync = () => {
    triggerFullSync.mutate();
    // Success/error toasts are automatically shown
  };

  const handleIncrementalSync = () => {
    triggerIncrementalSync.mutate();
    // Success/error toasts are automatically shown
  };

  const handleCancelSync = () => {
    if (syncStatus.data?.currentSession?.id) {
      cancelSync.mutate(syncStatus.data.currentSession.id);
    }
  };

  if (isLoading) return <div>Loading sync data...</div>;

  return (
    <div>
      <h2>Sync Operations</h2>
      
      {/* Current Status */}
      {syncStatus.data && (
        <div>
          <h3>Current Status</h3>
          <p>Is Running: {syncStatus.data.isRunning ? 'Yes' : 'No'}</p>
          <p>Last Full Sync: {syncStatus.data.lastFullSync || 'Never'}</p>
          <p>Last Incremental Sync: {syncStatus.data.lastIncrementalSync || 'Never'}</p>
          
          {syncStatus.data.currentSession && (
            <div>
              <h4>Current Session</h4>
              <p>ID: {syncStatus.data.currentSession.id}</p>
              <p>Type: {syncStatus.data.currentSession.type}</p>
              <p>Status: {syncStatus.data.currentSession.status}</p>
              <p>Progress: {syncStatus.data.currentSession.recordsProcessed} processed</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div>
        <button 
          onClick={handleFullSync}
          disabled={triggerFullSync.isPending || syncStatus.data?.isRunning}
        >
          {triggerFullSync.isPending ? 'Starting...' : 'Full Sync'}
        </button>
        
        <button 
          onClick={handleIncrementalSync}
          disabled={triggerIncrementalSync.isPending || syncStatus.data?.isRunning}
        >
          {triggerIncrementalSync.isPending ? 'Starting...' : 'Incremental Sync'}
        </button>
        
        {syncStatus.data?.isRunning && (
          <button 
            onClick={handleCancelSync}
            disabled={cancelSync.isPending}
          >
            {cancelSync.isPending ? 'Cancelling...' : 'Cancel Sync'}
          </button>
        )}
      </div>

      {/* Sync History */}
      {syncHistory.data && (
        <div>
          <h3>Recent Sync Sessions</h3>
          {syncHistory.data.sessions?.map(session => (
            <div key={session.id} style={{ border: '1px solid #ccc', margin: '4px', padding: '8px' }}>
              <p><strong>{session.type}</strong> - {session.status}</p>
              <p>Started: {new Date(session.startedAt).toLocaleString()}</p>
              {session.completedAt && (
                <p>Completed: {new Date(session.completedAt).toLocaleString()}</p>
              )}
              <p>Records: {session.recordsSuccessful}/{session.recordsProcessed}</p>
              {session.errorMessage && (
                <p style={{ color: 'red' }}>Error: {session.errorMessage}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Example: Combined Usage in a Real Component
 */
export const ComprehensiveExample = () => {
  const { data: currentUser } = useCurrentUser();
  const dashboardData = useDashboardData({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });
  const syncOps = useSyncOperations();

  // Show loading state
  if (dashboardData.isLoading) {
    return <div>Loading...</div>;
  }

  // Show error state
  if (dashboardData.isError) {
    return <div>Error loading data</div>;
  }

  return (
    <div>
      <header>
        <h1>Pipeline Pulse Dashboard</h1>
        {currentUser && <p>Welcome, {currentUser.firstName}!</p>}
      </header>

      {/* Sync Status Banner */}
      {syncOps.syncStatus.data?.isRunning && (
        <div style={{ background: '#f0f8ff', padding: '8px', marginBottom: '16px' }}>
          <p>🔄 Sync in progress... {syncOps.syncStatus.data.currentSession?.recordsProcessed} records processed</p>
        </div>
      )}

      {/* Key Metrics */}
      <section>
        <h2>Key Metrics</h2>
        {dashboardData.metrics.data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <h3>Pipeline Value</h3>
              <p>${dashboardData.metrics.data.totalPipelineValue?.toLocaleString()}</p>
            </div>
            <div>
              <h3>Revenue</h3>
              <p>${dashboardData.metrics.data.totalRevenue?.toLocaleString()}</p>
            </div>
            <div>
              <h3>Win Rate</h3>
              <p>{dashboardData.metrics.data.winRate}%</p>
            </div>
            <div>
              <h3>Deals in Progress</h3>
              <p>{dashboardData.metrics.data.dealsInProgress}</p>
            </div>
          </div>
        )}
      </section>

      {/* Attention Required */}
      <section>
        <h2>Requires Attention</h2>
        {dashboardData.attentionRequired.data && dashboardData.attentionRequired.data.length > 0 ? (
          <div>
            {dashboardData.attentionRequired.data.map(opportunity => (
              <div key={opportunity.id} style={{ 
                background: opportunity.healthStatus === 'danger' ? '#ffe6e6' : '#fff3cd',
                padding: '8px',
                margin: '4px',
                borderRadius: '4px'
              }}>
                <h4>{opportunity.name}</h4>
                <p>Status: {opportunity.healthStatus}</p>
                <p>Value: ${opportunity.amountSgd?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No opportunities require attention</p>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => syncOps.triggerIncrementalSync.mutate()}
            disabled={syncOps.triggerIncrementalSync.isPending || syncOps.syncStatus.data?.isRunning}
          >
            {syncOps.triggerIncrementalSync.isPending ? 'Starting...' : 'Sync Now'}
          </button>
          
          <button
            onClick={() => dashboardData.metrics.refetch()}
            disabled={dashboardData.metrics.isFetching}
          >
            {dashboardData.metrics.isFetching ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </section>
    </div>
  );
};