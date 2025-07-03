import { test, expect } from '@playwright/test';

test.describe('Navigation Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication to bypass login
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token');
    });

    // Mock sync status APIs
    await page.route('/api/sync/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'healthy',
          last_sync_at: new Date().toISOString(),
          is_syncing: false,
          connection_status: 'connected'
        })
      });
    });
  });

  test('should have updated navigation menu with live sync options', async ({ page }) => {
    await page.goto('/');
    
    // Open navigation menu (assuming it's in a sidebar or dropdown)
    await page.click('[data-testid="navigation-menu"]');
    
    // Check for Live Data Management section
    await expect(page.getByText('Live Data Management')).toBeVisible();
    
    // Check for new navigation items
    await expect(page.getByRole('link', { name: /live sync control/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sync status monitor/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /crm integration/i })).toBeVisible();
  });

  test('should navigate to live sync pages correctly', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Live Sync Control
    await page.click('a[href="/live-sync"]');
    await expect(page).toHaveURL('/live-sync');
    await expect(page.getByText('Live Sync Control')).toBeVisible();
    
    // Navigate to Sync Status Monitor
    await page.goto('/');
    await page.click('a[href="/sync-status"]');
    await expect(page).toHaveURL('/sync-status');
    await expect(page.getByText('Sync Status Monitor')).toBeVisible();
  });

  test('should show no upload/import options in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Open navigation
    await page.click('[data-testid="navigation-menu"]');
    
    // Should NOT see upload center or import options
    await expect(page.getByText('Upload Center')).not.toBeVisible();
    await expect(page.getByText('Import CSV')).not.toBeVisible();
    await expect(page.getByText('File Upload')).not.toBeVisible();
  });

  test('should have command palette with new sync actions', async ({ page }) => {
    await page.goto('/');
    
    // Open command palette (Cmd+K or Ctrl+K)
    await page.keyboard.press('Meta+K');
    
    // Should show sync-related commands
    await page.type('[data-testid="command-input"]', 'sync');
    
    await expect(page.getByText('Full CRM Sync')).toBeVisible();
    await expect(page.getByText('Check Sync Status')).toBeVisible();
  });

  test('should navigate from command palette to sync pages', async ({ page }) => {
    await page.goto('/');
    
    // Open command palette
    await page.keyboard.press('Meta+K');
    
    // Search for sync status
    await page.type('[data-testid="command-input"]', 'sync status');
    await page.click('[data-testid="command-item-sync-status"]');
    
    // Should navigate to sync status page
    await expect(page).toHaveURL('/sync-status');
  });
});

test.describe('Breadcrumb Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token');
    });
  });

  test('should show correct breadcrumbs for live sync pages', async ({ page }) => {
    await page.goto('/live-sync');
    
    // Check breadcrumb structure
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toContainText('Home');
    await expect(breadcrumbs).toContainText('Live Data Management');
    await expect(breadcrumbs).toContainText('Live Sync Control');
  });

  test('should show correct breadcrumbs for sync status page', async ({ page }) => {
    await page.goto('/sync-status');
    
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toContainText('Home');
    await expect(breadcrumbs).toContainText('Live Data Management');
    await expect(breadcrumbs).toContainText('Sync Status Monitor');
  });

  test('should navigate back using breadcrumbs', async ({ page }) => {
    await page.goto('/sync-status');
    
    // Click on "Live Data Management" in breadcrumbs
    await page.click('[data-testid="breadcrumb-live-data-management"]');
    
    // Should show section overview or navigate to main data management page
    await expect(page).toHaveURL('/live-sync'); // or appropriate section page
  });
});

test.describe('Route Guards and Access Control', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    // Clear any existing auth
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/live-sync');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should protect sync status page from unauthenticated access', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/sync-status');
    
    await expect(page).toHaveURL('/login');
  });

  test('should allow access to sync pages when authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'valid-token');
    });

    // Mock auth validation
    await page.route('/api/auth/validate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true, user: { id: 1, name: 'Test User' } })
      });
    });

    await page.goto('/live-sync');
    
    await expect(page).toHaveURL('/live-sync');
    await expect(page.getByText('Live Sync Control')).toBeVisible();
  });
});

test.describe('URL Routing and Deep Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token');
    });
  });

  test('should handle direct URL access to sync pages', async ({ page }) => {
    // Direct access to live sync page
    await page.goto('/live-sync');
    await expect(page).toHaveURL('/live-sync');
    await expect(page.getByText('Live Sync Control')).toBeVisible();
    
    // Direct access to sync status page
    await page.goto('/sync-status');
    await expect(page).toHaveURL('/sync-status');
    await expect(page.getByText('Sync Status Monitor')).toBeVisible();
  });

  test('should handle URL parameters for sync sessions', async ({ page }) => {
    // Mock active sync session
    await page.route('/api/sync/status/session-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 'session-123',
            status: 'in_progress',
            sync_type: 'full',
            progress_percentage: 45
          }
        })
      });
    });

    await page.goto('/live-sync?session=session-123');
    
    // Should load the specific session
    await expect(page.getByText('Active Sync Progress')).toBeVisible();
    await expect(page.getByText('45%')).toBeVisible();
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/non-existent-sync-page');
    
    // Should show 404 page or redirect to default route
    // Adjust based on your 404 handling implementation
    await expect(page).toHaveURL('/'); // or '/404'
  });
});

test.describe('Cross-Page State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token');
    });

    // Mock sync status API
    await page.route('/api/sync/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'healthy',
          last_sync_at: new Date().toISOString(),
          is_syncing: false
        })
      });
    });
  });

  test('should maintain sync status across page navigation', async ({ page }) => {
    // Start on dashboard
    await page.goto('/');
    
    // Should show sync status in header
    await expect(page.locator('[data-testid="global-sync-status"]')).toBeVisible();
    
    // Navigate to O2R page
    await page.goto('/o2r');
    
    // Should still show sync status
    await expect(page.locator('[data-testid="global-sync-status"]')).toBeVisible();
    
    // Navigate to live sync page
    await page.goto('/live-sync');
    
    // Should show consistent sync status
    await expect(page.getByText('healthy')).toBeVisible();
  });

  test('should trigger sync from one page and see status update on another', async ({ page }) => {
    // Mock sync trigger
    let syncTriggered = false;
    await page.route('/api/sync/incremental', async route => {
      syncTriggered = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Sync initiated',
          session_id: 'new-session-123'
        })
      });
    });

    // Start sync from dashboard
    await page.goto('/');
    await page.click('[data-testid="quick-sync-button"]');
    
    // Navigate to sync status page
    await page.goto('/sync-status');
    
    // Should show the new sync session
    await expect(page.getByText('new-session-123')).toBeVisible();
  });
});

test.describe('Navigation Performance', () => {
  test('should load sync pages quickly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token');
    });

    const startTime = Date.now();
    
    await page.goto('/live-sync');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Should show main content
    await expect(page.getByText('Live Sync Control')).toBeVisible();
  });

  test('should handle rapid navigation between sync pages', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-token');
    });

    // Rapidly navigate between pages
    await page.goto('/live-sync');
    await expect(page.getByText('Live Sync Control')).toBeVisible();
    
    await page.goto('/sync-status');
    await expect(page.getByText('Sync Status Monitor')).toBeVisible();
    
    await page.goto('/crm-sync');
    await expect(page.getByText('CRM Integration')).toBeVisible();
    
    // All navigations should complete successfully
  });
});