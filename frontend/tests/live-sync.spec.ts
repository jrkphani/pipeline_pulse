import { test, expect, Page } from '@playwright/test';

// Mock API responses for testing
const mockSyncStatus = {
  status: 'healthy',
  last_sync_at: new Date().toISOString(),
  is_syncing: false,
  total_records_synced: 1247,
  new_records_today: 23,
  api_calls_today: 156,
  next_sync_in: '12 minutes',
  pending_changes: 0
};

const mockSyncOverview = {
  connection_status: 'connected',
  sync_health: 'healthy',
  data_freshness: '5 minutes ago',
  success_rate_24h: 98.5,
  pending_conflicts: 0,
  active_sync: null,
  recent_activities: [
    {
      timestamp: new Date().toISOString(),
      type: 'incremental_sync',
      message: 'Synced 23 updated records from CRM',
      status: 'completed'
    }
  ]
};

// Helper function to mock API endpoints
async function mockSyncAPIs(page: Page) {
  await page.route('/api/sync/status', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSyncStatus)
    });
  });

  await page.route('/api/sync/overview', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSyncOverview)
    });
  });

  await page.route('/api/sync/activities**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ activities: mockSyncOverview.recent_activities })
    });
  });
}

test.describe('Live Sync Control Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockSyncAPIs(page);
    await page.goto('/live-sync');
  });

  test('should display sync status overview cards', async ({ page }) => {
    // Check for sync status card
    await expect(page.locator('[data-testid="sync-status-card"]')).toBeVisible();
    await expect(page.getByText('healthy')).toBeVisible();
    
    // Check for records synced card
    await expect(page.locator('[data-testid="records-synced-card"]')).toBeVisible();
    await expect(page.getByText('1,247')).toBeVisible();
    
    // Check for API usage card
    await expect(page.locator('[data-testid="api-usage-card"]')).toBeVisible();
    await expect(page.getByText('156')).toBeVisible();
  });

  test('should show correct sync controls', async ({ page }) => {
    // Check for Quick Sync button
    const quickSyncBtn = page.getByRole('button', { name: /quick sync/i });
    await expect(quickSyncBtn).toBeVisible();
    await expect(quickSyncBtn).toBeEnabled();
    
    // Check for Full Sync button
    const fullSyncBtn = page.getByRole('button', { name: /full sync/i });
    await expect(fullSyncBtn).toBeVisible();
    await expect(fullSyncBtn).toBeEnabled();
  });

  test('should trigger incremental sync when Quick Sync is clicked', async ({ page }) => {
    // Mock the sync trigger endpoint
    await page.route('/api/sync/incremental', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Incremental sync initiated',
          session_id: 'test-session-123',
          status: 'started'
        })
      });
    });

    // Click Quick Sync button
    await page.getByRole('button', { name: /quick sync/i }).click();
    
    // Should show success toast
    await expect(page.getByText('Incremental Sync Started')).toBeVisible();
  });

  test('should trigger full sync when Full Sync is clicked', async ({ page }) => {
    // Mock the sync trigger endpoint
    await page.route('/api/sync/full', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Full sync initiated',
          session_id: 'test-session-456',
          status: 'started'
        })
      });
    });

    // Click Full Sync button
    await page.getByRole('button', { name: /full sync/i }).click();
    
    // Should show success toast
    await expect(page.getByText('Full Sync Started')).toBeVisible();
  });

  test('should display sync configuration options', async ({ page }) => {
    // Check for auto sync interval setting
    await expect(page.getByText('Auto Sync Interval')).toBeVisible();
    await expect(page.locator('select[aria-label*="sync interval"]')).toBeVisible();
    
    // Check for sync mode setting
    await expect(page.getByText('Sync Mode')).toBeVisible();
    await expect(page.locator('select[aria-label*="sync mode"]')).toBeVisible();
  });

  test('should show active sync progress when sync is running', async ({ page }) => {
    // Mock active sync session
    const activeSyncSession = {
      session: {
        id: 'active-session-123',
        sync_type: 'incremental',
        status: 'in_progress',
        progress_percentage: 45,
        records_processed: 450,
        records_total: 1000,
        api_calls_made: 12
      },
      recent_activity: [
        {
          timestamp: new Date().toISOString(),
          status: 'processing',
          message: 'Processing batch 5 of 10...',
          record_count: 100
        }
      ]
    };

    await page.route('/api/sync/status/active-session-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeSyncSession)
      });
    });

    // Navigate with active sync
    await page.goto('/live-sync?session=active-session-123');

    // Should show progress card
    await expect(page.getByText('Active Sync Progress')).toBeVisible();
    await expect(page.getByText('45%')).toBeVisible();
    await expect(page.getByText('450 / 1000')).toBeVisible();
  });
});

test.describe('Sync Status Monitor Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockSyncAPIs(page);
    
    // Mock sync health data
    await page.route('/api/analytics/health**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall_health: 'healthy',
          success_rate: 98.5,
          total_records: 1247,
          synced_count: 1240,
          pending_count: 7,
          conflict_count: 0,
          status_breakdown: [
            { status: 'synced', count: 1240, description: 'Records in sync with CRM' },
            { status: 'pending', count: 7, description: 'Changes waiting to sync' }
          ]
        })
      });
    });

    await page.goto('/sync-status');
  });

  test('should display health overview cards', async ({ page }) => {
    // Check for sync health card
    await expect(page.locator('[data-testid="sync-health-card"]')).toBeVisible();
    await expect(page.getByText('healthy')).toBeVisible();
    
    // Check for records in sync card
    await expect(page.locator('[data-testid="records-synced-card"]')).toBeVisible();
    await expect(page.getByText('1,240')).toBeVisible();
    
    // Check for pending changes card
    await expect(page.locator('[data-testid="pending-changes-card"]')).toBeVisible();
    await expect(page.getByText('7')).toBeVisible();
  });

  test('should show tabbed interface', async ({ page }) => {
    // Check for tab buttons
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Conflicts' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible();
  });

  test('should display record sync status breakdown', async ({ page }) => {
    // Should show status breakdown section
    await expect(page.getByText('Record Sync Status')).toBeVisible();
    
    // Should show synced records
    await expect(page.getByText('Synced')).toBeVisible();
    await expect(page.getByText('Records in sync with CRM')).toBeVisible();
    
    // Should show pending records
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText('Changes waiting to sync')).toBeVisible();
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Click on Conflicts tab
    await page.getByRole('tab', { name: 'Conflicts' }).click();
    
    // Should show conflicts content
    await expect(page.getByText('Sync Conflicts')).toBeVisible();
    
    // Click on Performance tab
    await page.getByRole('tab', { name: 'Performance' }).click();
    
    // Should show performance content
    await expect(page.getByText('Sync Performance')).toBeVisible();
  });
});

test.describe('Global Sync Status Component', () => {
  test.beforeEach(async ({ page }) => {
    await mockSyncAPIs(page);
  });

  test('should show sync status in header across all pages', async ({ page }) => {
    // Test on Dashboard
    await page.goto('/');
    await expect(page.locator('[data-testid="global-sync-status"]')).toBeVisible();
    
    // Test on O2R Dashboard
    await page.goto('/o2r');
    await expect(page.locator('[data-testid="global-sync-status"]')).toBeVisible();
    
    // Test on CRM Sync page
    await page.goto('/crm-sync');
    await expect(page.locator('[data-testid="global-sync-status"]')).toBeVisible();
  });

  test('should display connection status correctly', async ({ page }) => {
    await page.goto('/');
    
    // Should show connected status
    const syncStatus = page.locator('[data-testid="global-sync-status"]');
    await expect(syncStatus).toBeVisible();
    await expect(syncStatus.getByText('Connected')).toBeVisible();
  });

  test('should handle disconnected state', async ({ page }) => {
    // Mock disconnected state
    await page.route('/api/sync/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockSyncStatus,
          status: 'offline',
          connection_status: 'disconnected'
        })
      });
    });

    await page.goto('/');
    
    // Should show offline status
    const syncStatus = page.locator('[data-testid="global-sync-status"]');
    await expect(syncStatus.getByText('Offline')).toBeVisible();
  });
});

test.describe('Live Sync Integration', () => {
  test('should integrate sync status in Dashboard', async ({ page }) => {
    await mockSyncAPIs(page);
    await page.goto('/');
    
    // Should show live CRM status card
    await expect(page.getByText('Live CRM Status')).toBeVisible();
    await expect(page.getByText('Last Sync')).toBeVisible();
    await expect(page.getByText('Data Freshness')).toBeVisible();
  });

  test('should show sync controls in O2R pages', async ({ page }) => {
    await mockSyncAPIs(page);
    await page.goto('/o2r');
    
    // Should show sync options
    await expect(page.getByText('Live Sync')).toBeVisible();
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/sync/status', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'CRM connection failed' })
      });
    });

    await page.goto('/live-sync');
    
    // Should show error state
    await expect(page.getByText('Error loading sync status')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12 size

  test('should be responsive on mobile devices', async ({ page }) => {
    await mockSyncAPIs(page);
    await page.goto('/live-sync');
    
    // Should show sync controls in mobile layout
    await expect(page.getByRole('button', { name: /quick sync/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /full sync/i })).toBeVisible();
    
    // Cards should stack vertically on mobile
    const statusCards = page.locator('[data-testid*="card"]');
    await expect(statusCards.first()).toBeVisible();
  });

  test('should show compact sync status in mobile header', async ({ page }) => {
    await mockSyncAPIs(page);
    await page.goto('/');
    
    // Global sync status should be compact on mobile
    const syncStatus = page.locator('[data-testid="global-sync-status"]');
    await expect(syncStatus).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels and keyboard navigation', async ({ page }) => {
    await mockSyncAPIs(page);
    await page.goto('/live-sync');
    
    // Check for ARIA labels on buttons
    const quickSyncBtn = page.getByRole('button', { name: /quick sync/i });
    await expect(quickSyncBtn).toHaveAttribute('aria-label');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(quickSyncBtn).toBeFocused();
  });

  test('should support screen readers', async ({ page }) => {
    await mockSyncAPIs(page);
    await page.goto('/sync-status');
    
    // Check for descriptive text for screen readers
    await expect(page.getByRole('region', { name: /sync health/i })).toBeVisible();
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby');
  });
});