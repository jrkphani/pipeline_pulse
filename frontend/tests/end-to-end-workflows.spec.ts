import { test, expect } from '@playwright/test';

test.describe('End-to-End Live CRM Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'e2e-test-token');
    });

    // Mock base sync status
    await page.route('/api/sync/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'healthy',
          last_sync_at: new Date().toISOString(),
          is_syncing: false,
          connection_status: 'connected',
          total_records_synced: 1247,
          api_calls_today: 156
        })
      });
    });
  });

  test.describe('Complete Sync Management Workflow', () => {
    test('should complete full sync workflow from dashboard to completion', async ({ page }) => {
      const sessionId = 'e2e-full-sync-session';
      let syncProgress = 0;

      // Mock sync trigger
      await page.route('/api/sync/full', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Full sync initiated',
            session_id: sessionId,
            status: 'started'
          })
        });
      });

      // Mock progressive sync status
      await page.route(`/api/sync/status/${sessionId}`, async route => {
        syncProgress += 20;
        const isComplete = syncProgress >= 100;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              id: sessionId,
              sync_type: 'full_sync',
              status: isComplete ? 'completed' : 'in_progress',
              progress_percentage: Math.min(syncProgress, 100),
              records_processed: Math.min(syncProgress * 10, 1000),
              records_total: 1000,
              api_calls_made: Math.floor(syncProgress / 10),
              started_at: new Date(Date.now() - 60000).toISOString(),
              completed_at: isComplete ? new Date().toISOString() : null
            },
            recent_activity: [
              {
                timestamp: new Date().toISOString(),
                status: isComplete ? 'completed' : 'processing',
                message: isComplete ? 'Sync completed successfully' : `Processing batch ${Math.floor(syncProgress / 20)} of 5`,
                record_count: syncProgress * 10
              }
            ]
          })
        });
      });

      // Step 1: Start from Dashboard
      await page.goto('/');
      await expect(page.getByText('Pipeline Pulse')).toBeVisible();

      // Step 2: Navigate to Live Sync
      await page.click('a[href="/live-sync"]');
      await expect(page).toHaveURL('/live-sync');

      // Step 3: Check initial status
      await expect(page.getByText('Live Sync Control')).toBeVisible();
      await expect(page.getByText('healthy')).toBeVisible();

      // Step 4: Trigger Full Sync
      await page.click('button:has-text("Full Sync")');
      await expect(page.getByText('Full Sync Started')).toBeVisible();

      // Step 5: Monitor Progress
      await expect(page.getByText('Active Sync Progress')).toBeVisible();
      
      // Wait for progress updates
      await page.waitForTimeout(1000);
      await expect(page.getByText('20%')).toBeVisible();

      await page.waitForTimeout(1000);
      await expect(page.getByText('40%')).toBeVisible();

      // Step 6: Navigate to Sync Status for detailed monitoring
      await page.click('a[href="/sync-status"]');
      await expect(page).toHaveURL('/sync-status');

      // Step 7: Verify completion
      await page.waitForTimeout(2000);
      await expect(page.getByText('100%')).toBeVisible();
      await expect(page.getByText('completed')).toBeVisible();

      // Step 8: Verify updated stats
      await expect(page.getByText('1,000')).toBeVisible(); // Records processed
    });

    test('should handle sync conflict resolution workflow', async ({ page }) => {
      const conflictId = 'e2e-conflict-123';

      // Mock conflicts API
      await page.route('/api/analytics/conflicts', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            conflicts: [
              {
                id: conflictId,
                zoho_record_id: 'zoho-456',
                record_name: 'E2E Test Opportunity',
                conflict_fields: ['Business_Region'],
                local_modified_at: new Date(Date.now() - 3600000).toISOString(),
                crm_modified_at: new Date().toISOString(),
                local_value: 'North America',
                crm_value: 'Southeast Asia',
                error_details: 'Field value mismatch detected during sync'
              }
            ],
            total_conflicts: 1,
            has_more: false
          })
        });
      });

      // Mock conflict resolution
      await page.route(`/api/analytics/conflicts/${conflictId}/resolve`, async route => {
        const resolution = await route.request().postDataJSON();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: `Conflict resolved using '${resolution.action}' strategy`,
            conflict_id: conflictId,
            new_status: 'synced',
            resolved_at: new Date().toISOString()
          })
        });
      });

      // Mock updated conflicts list (empty after resolution)
      let conflictResolved = false;
      await page.route('/api/analytics/conflicts', async route => {
        if (conflictResolved) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              conflicts: [],
              total_conflicts: 0
            })
          });
        } else {
          await route.continue();
        }
      });

      // Step 1: Navigate to Sync Status
      await page.goto('/sync-status');
      await expect(page.getByText('Sync Status Monitor')).toBeVisible();

      // Step 2: Check for conflicts
      await page.click('tab:has-text("Conflicts")');
      await expect(page.getByText('Sync Conflicts')).toBeVisible();

      // Step 3: Verify conflict details
      await expect(page.getByText('E2E Test Opportunity')).toBeVisible();
      await expect(page.getByText('North America')).toBeVisible(); // Local value
      await expect(page.getByText('Southeast Asia')).toBeVisible(); // CRM value

      // Step 4: Resolve conflict (use CRM value)
      await page.click('button:has-text("Use CRM")');

      // Step 5: Verify resolution
      await expect(page.getByText('Conflict resolved')).toBeVisible();
      
      // Mark as resolved for next API call
      conflictResolved = true;

      // Step 6: Refresh and verify no conflicts remain
      await page.reload();
      await page.click('tab:has-text("Conflicts")');
      await expect(page.getByText('No conflicts detected')).toBeVisible();
    });
  });

  test.describe('Dashboard to O2R Integration Workflow', () => {
    test('should navigate from dashboard to O2R with live sync status', async ({ page }) => {
      // Mock O2R data
      await page.route('/api/o2r/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            opportunities: [
              {
                id: 'o2r-opp-1',
                opportunity_name: 'Live Sync Test Opportunity',
                phase: 'phase_2',
                health_score: 85,
                proposal_date: '2024-01-15',
                po_date: null,
                kickoff_date: null,
                invoice_date: null,
                payment_date: null,
                revenue_date: null,
                sync_status: 'synced',
                last_sync_at: new Date().toISOString()
              }
            ],
            summary: {
              total_opportunities: 1,
              phase_breakdown: {
                phase_1: 0,
                phase_2: 1,
                phase_3: 0,
                phase_4: 0
              },
              health_summary: {
                healthy: 1,
                at_risk: 0,
                critical: 0
              }
            }
          })
        });
      });

      // Step 1: Start from Dashboard
      await page.goto('/');
      await expect(page.getByText('Pipeline Pulse')).toBeVisible();

      // Step 2: Verify live sync status in header
      await expect(page.locator('[data-testid="global-sync-status"]')).toBeVisible();
      await expect(page.getByText('Connected')).toBeVisible();

      // Step 3: Navigate to O2R Dashboard
      await page.click('a[href="/o2r"]');
      await expect(page).toHaveURL('/o2r');

      // Step 4: Verify O2R page shows live data indicators
      await expect(page.getByText('O2R Dashboard')).toBeVisible();
      await expect(page.getByText('Live Sync Test Opportunity')).toBeVisible();

      // Step 5: Check sync status indicators
      await expect(page.getByText('synced')).toBeVisible();
      
      // Step 6: Navigate to O2R Opportunities
      await page.click('a[href="/o2r/opportunities"]');
      await expect(page).toHaveURL('/o2r/opportunities');

      // Step 7: Verify opportunities page with live sync
      await expect(page.getByText('O2R Opportunities')).toBeVisible();
      await expect(page.getByText('Live Sync Test Opportunity')).toBeVisible();
    });

    test('should trigger sync from O2R page and see updates', async ({ page }) => {
      // Mock O2R sync trigger
      await page.route('/api/o2r/sync', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'O2R sync initiated',
            session_id: 'o2r-sync-session-789',
            records_affected: 15
          })
        });
      });

      // Mock updated O2R data after sync
      let syncTriggered = false;
      await page.route('/api/o2r/**', async route => {
        const updatedCount = syncTriggered ? 2 : 1;
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            opportunities: [
              {
                id: 'o2r-opp-1',
                opportunity_name: 'Existing O2R Opportunity',
                phase: 'phase_2',
                health_score: 85,
                sync_status: 'synced'
              },
              ...(syncTriggered ? [{
                id: 'o2r-opp-2',
                opportunity_name: 'New O2R Opportunity from Sync',
                phase: 'phase_1',
                health_score: 92,
                sync_status: 'synced'
              }] : [])
            ],
            summary: {
              total_opportunities: updatedCount,
              phase_breakdown: {
                phase_1: syncTriggered ? 1 : 0,
                phase_2: 1,
                phase_3: 0,
                phase_4: 0
              }
            }
          })
        });
      });

      // Step 1: Navigate to O2R
      await page.goto('/o2r');

      // Step 2: Verify initial state
      await expect(page.getByText('Existing O2R Opportunity')).toBeVisible();
      await expect(page.getByText('Total: 1')).toBeVisible();

      // Step 3: Trigger O2R sync
      await page.click('button:has-text("Sync O2R")');
      
      // Mark sync as triggered
      syncTriggered = true;

      // Step 4: Verify sync initiated
      await expect(page.getByText('O2R sync initiated')).toBeVisible();

      // Step 5: Wait for data refresh and verify new opportunity
      await page.waitForTimeout(2000);
      await expect(page.getByText('New O2R Opportunity from Sync')).toBeVisible();
      await expect(page.getByText('Total: 2')).toBeVisible();
    });
  });

  test.describe('Search and Record Management Workflow', () => {
    test('should search, view, and sync individual records', async ({ page }) => {
      const recordId = 'search-record-123';

      // Mock search results
      await page.route('/api/search**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: recordId,
                Opportunity_Name: 'Searchable Test Opportunity',
                Account_Name: 'Test Account Inc',
                Stage: 'Qualification',
                Business_Region: 'Southeast Asia',
                Solution_Type: 'Cloud Migration',
                Modified_Time: new Date().toISOString()
              }
            ],
            total_found: 1,
            query: 'test opportunity'
          })
        });
      });

      // Mock record details
      await page.route(`/api/search/record/${recordId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            record: {
              id: recordId,
              Opportunity_Name: 'Searchable Test Opportunity',
              Account_Name: 'Test Account Inc',
              Stage: 'Qualification',
              Business_Region: 'Southeast Asia',
              Solution_Type: 'Cloud Migration',
              OCH_Revenue: 75000,
              Currency: 'USD',
              Probability: 60,
              Closing_Date: '2024-03-15',
              Modified_Time: new Date().toISOString()
            },
            sync_metadata: {
              local_sync_status: 'synced',
              last_synced: new Date().toISOString(),
              crm_modified: new Date().toISOString(),
              has_conflicts: false
            }
          })
        });
      });

      // Mock record sync
      await page.route(`/api/search/record/${recordId}/sync`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: `Record ${recordId} synced successfully`,
            direction: 'bidirectional',
            sync_result: {
              action_taken: 'updated_local_from_crm',
              conflicts_detected: false
            },
            timestamp: new Date().toISOString()
          })
        });
      });

      // Step 1: Navigate to search page
      await page.goto('/search');

      // Step 2: Perform search
      await page.fill('input[placeholder*="search"]', 'test opportunity');
      await page.click('button:has-text("Search")');

      // Step 3: Verify search results
      await expect(page.getByText('Searchable Test Opportunity')).toBeVisible();
      await expect(page.getByText('Test Account Inc')).toBeVisible();
      await expect(page.getByText('1 result found')).toBeVisible();

      // Step 4: Click on record to view details
      await page.click('text=Searchable Test Opportunity');
      await expect(page).toHaveURL(`/search/record/${recordId}`);

      // Step 5: Verify record details
      await expect(page.getByText('Searchable Test Opportunity')).toBeVisible();
      await expect(page.getByText('$75,000')).toBeVisible();
      await expect(page.getByText('60%')).toBeVisible(); // Probability
      await expect(page.getByText('Southeast Asia')).toBeVisible();

      // Step 6: Check sync status
      await expect(page.getByText('Synced')).toBeVisible();
      await expect(page.getByText('No conflicts')).toBeVisible();

      // Step 7: Force sync the record
      await page.click('button:has-text("Force Sync")');

      // Step 8: Verify sync completion
      await expect(page.getByText('Record synced successfully')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery Workflows', () => {
    test('should handle CRM disconnection and recovery', async ({ page }) => {
      let isConnected = true;

      // Mock connection status that can change
      await page.route('/api/sync/status', async route => {
        await route.fulfill({
          status: isConnected ? 200 : 503,
          contentType: 'application/json',
          body: JSON.stringify(isConnected ? {
            status: 'healthy',
            connection_status: 'connected',
            last_sync_at: new Date().toISOString(),
            is_syncing: false
          } : {
            status: 'offline',
            connection_status: 'disconnected',
            error: 'CRM connection timeout',
            last_sync_at: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
          })
        });
      });

      // Step 1: Start with connected state
      await page.goto('/');
      await expect(page.getByText('Connected')).toBeVisible();

      // Step 2: Simulate disconnection
      isConnected = false;
      await page.reload();

      // Step 3: Verify disconnected state shown
      await expect(page.getByText('Offline')).toBeVisible();

      // Step 4: Navigate to Live Sync page
      await page.goto('/live-sync');

      // Step 5: Verify error state in sync controls
      await expect(page.getByText('offline')).toBeVisible();

      // Step 6: Attempt sync (should fail)
      await page.click('button:has-text("Quick Sync")');
      await expect(page.getByText('Sync Failed')).toBeVisible();

      // Step 7: Simulate reconnection
      isConnected = true;

      // Step 8: Refresh and verify recovery
      await page.reload();
      await expect(page.getByText('healthy')).toBeVisible();

      // Step 9: Verify sync works again
      await page.route('/api/sync/incremental', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Incremental sync initiated',
            session_id: 'recovery-sync-session'
          })
        });
      });

      await page.click('button:has-text("Quick Sync")');
      await expect(page.getByText('Incremental Sync Started')).toBeVisible();
    });

    test('should handle API rate limiting gracefully', async ({ page }) => {
      // Mock rate limiting
      await page.route('/api/sync/full', async route => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            detail: 'API rate limit exceeded. Please try again in 60 seconds.',
            retry_after: 60
          })
        });
      });

      // Step 1: Navigate to Live Sync
      await page.goto('/live-sync');

      // Step 2: Attempt sync that hits rate limit
      await page.click('button:has-text("Full Sync")');

      // Step 3: Verify rate limit error handling
      await expect(page.getByText('Rate limit exceeded')).toBeVisible();
      await expect(page.getByText('Please try again in 60 seconds')).toBeVisible();

      // Step 4: Verify buttons are disabled during cooldown
      const fullSyncButton = page.getByRole('button', { name: /full sync/i });
      await expect(fullSyncButton).toBeDisabled();
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle large dataset sync efficiently', async ({ page }) => {
      const sessionId = 'large-dataset-sync';
      let recordsProcessed = 0;
      const totalRecords = 50000;

      // Mock large dataset sync
      await page.route('/api/sync/full', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Large dataset sync initiated',
            session_id: sessionId,
            status: 'started',
            estimated_records: totalRecords
          })
        });
      });

      // Mock progressive updates for large dataset
      await page.route(`/api/sync/status/${sessionId}`, async route => {
        recordsProcessed = Math.min(recordsProcessed + 5000, totalRecords);
        const isComplete = recordsProcessed >= totalRecords;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              id: sessionId,
              sync_type: 'full_sync',
              status: isComplete ? 'completed' : 'in_progress',
              progress_percentage: (recordsProcessed / totalRecords) * 100,
              records_processed: recordsProcessed,
              records_total: totalRecords,
              api_calls_made: Math.floor(recordsProcessed / 200),
              started_at: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
            }
          })
        });
      });

      // Step 1: Navigate to Live Sync
      await page.goto('/live-sync');

      // Step 2: Trigger large dataset sync
      await page.click('button:has-text("Full Sync")');
      await expect(page.getByText('Large dataset sync initiated')).toBeVisible();

      // Step 3: Monitor progress efficiently
      await expect(page.getByText('Active Sync Progress')).toBeVisible();

      // Step 4: Verify progress updates without overwhelming the UI
      await page.waitForTimeout(2000);
      await expect(page.getByText('10%')).toBeVisible();

      await page.waitForTimeout(2000);
      await expect(page.getByText('20%')).toBeVisible();

      // Step 5: Verify completion handling for large datasets
      await page.waitForTimeout(5000);
      await expect(page.getByText('100%')).toBeVisible();
      await expect(page.getByText('50,000')).toBeVisible(); // Total records processed
    });
  });
});