import { test, expect } from '@playwright/test';

test.describe('Live Sync API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test.describe('Sync Control API Integration', () => {
    test('should trigger full sync and monitor progress', async ({ page }) => {
      let syncSessionId = 'full-sync-session-123';
      let progressSteps = [
        { percentage: 0, status: 'starting' },
        { percentage: 25, status: 'fetching_metadata' },
        { percentage: 50, status: 'downloading_data' },
        { percentage: 75, status: 'processing_records' },
        { percentage: 100, status: 'completed' }
      ];
      let currentStep = 0;

      // Mock full sync trigger
      await page.route('/api/sync/full', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Full sync initiated',
            session_id: syncSessionId,
            status: 'started'
          })
        });
      });

      // Mock progressive sync status
      await page.route(`/api/sync/status/${syncSessionId}`, async route => {
        const step = progressSteps[Math.min(currentStep, progressSteps.length - 1)];
        currentStep++;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              id: syncSessionId,
              sync_type: 'full_sync',
              status: step.status === 'completed' ? 'completed' : 'in_progress',
              progress_percentage: step.percentage,
              records_processed: step.percentage * 10,
              records_total: 1000,
              api_calls_made: Math.floor(step.percentage / 10),
              started_at: new Date().toISOString(),
              completed_at: step.status === 'completed' ? new Date().toISOString() : null
            },
            recent_activity: [
              {
                timestamp: new Date().toISOString(),
                status: step.status,
                message: `Sync progress: ${step.percentage}%`,
                record_count: step.percentage * 10
              }
            ]
          })
        });
      });

      await page.goto('/live-sync');

      // Trigger full sync
      await page.click('button:has-text("Full Sync")');

      // Should show success toast
      await expect(page.getByText('Full Sync Started')).toBeVisible();

      // Should show progress card
      await expect(page.getByText('Active Sync Progress')).toBeVisible();

      // Wait for progress updates
      await page.waitForTimeout(1000);
      await expect(page.getByText('25%')).toBeVisible();

      // Progress should eventually reach 100%
      await page.waitForTimeout(2000);
      await expect(page.getByText('100%')).toBeVisible();
    });

    test('should handle sync API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('/api/sync/full', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'CRM connection timeout',
            detail: 'Unable to connect to Zoho CRM API'
          })
        });
      });

      await page.goto('/live-sync');

      // Trigger sync that will fail
      await page.click('button:has-text("Full Sync")');

      // Should show error toast
      await expect(page.getByText('Sync Failed')).toBeVisible();
      await expect(page.getByText('CRM connection timeout')).toBeVisible();
    });

    test('should cancel active sync session', async ({ page }) => {
      const sessionId = 'cancellable-session-456';

      // Mock active sync
      await page.route(`/api/sync/status/${sessionId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              id: sessionId,
              status: 'in_progress',
              progress_percentage: 30,
              records_processed: 300,
              records_total: 1000
            }
          })
        });
      });

      // Mock cancel endpoint
      await page.route(`/api/sync/session/${sessionId}`, async route => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Sync session cancelled',
              session_id: sessionId
            })
          });
        }
      });

      await page.goto(`/live-sync?session=${sessionId}`);

      // Should show cancel button
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();

      // Click cancel
      await page.click('button:has-text("Cancel")');

      // Should show cancellation confirmation
      await expect(page.getByText('Sync cancelled')).toBeVisible();
    });
  });

  test.describe('Search API Integration', () => {
    test('should search records and display results', async ({ page }) => {
      // Mock search API
      await page.route('/api/search**', async route => {
        const url = new URL(route.request().url());
        const query = url.searchParams.get('query');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [
              {
                id: '123456789',
                Opportunity_Name: `Test Opportunity matching ${query}`,
                Account_Name: 'Test Account',
                Stage: 'Qualification',
                Business_Region: 'Southeast Asia',
                Modified_Time: new Date().toISOString()
              },
              {
                id: '987654321',
                Opportunity_Name: `Another ${query} result`,
                Account_Name: 'Another Account',
                Stage: 'Proposal',
                Business_Region: 'North America',
                Modified_Time: new Date().toISOString()
              }
            ],
            total_found: 2,
            query: query,
            fields_searched: ['Opportunity_Name', 'Account_Name']
          })
        });
      });

      await page.goto('/search');

      // Perform search
      await page.fill('input[placeholder*="search"]', 'opportunity');
      await page.click('button:has-text("Search")');

      // Should show results
      await expect(page.getByText('Test Opportunity matching opportunity')).toBeVisible();
      await expect(page.getByText('Another opportunity result')).toBeVisible();
      await expect(page.getByText('2 results found')).toBeVisible();
    });

    test('should handle record details API', async ({ page }) => {
      const recordId = '123456789';

      // Mock record details API
      await page.route(`/api/search/record/${recordId}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            record: {
              id: recordId,
              Opportunity_Name: 'Detailed Opportunity',
              Account_Name: 'Detailed Account',
              Stage: 'Negotiation',
              Business_Region: 'Europe',
              Solution_Type: 'Cloud Migration',
              OCH_Revenue: 150000,
              Currency: 'USD',
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

      await page.goto(`/search/record/${recordId}`);

      // Should show record details
      await expect(page.getByText('Detailed Opportunity')).toBeVisible();
      await expect(page.getByText('Detailed Account')).toBeVisible();
      await expect(page.getByText('Negotiation')).toBeVisible();
      await expect(page.getByText('$150,000')).toBeVisible();

      // Should show sync metadata
      await expect(page.getByText('Synced')).toBeVisible();
      await expect(page.getByText('No conflicts')).toBeVisible();
    });

    test('should force sync individual record', async ({ page }) => {
      const recordId = '123456789';

      // Mock force sync API
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

      await page.goto(`/search/record/${recordId}`);

      // Click force sync button
      await page.click('button:has-text("Force Sync")');

      // Should show success message
      await expect(page.getByText('Record synced successfully')).toBeVisible();
    });
  });

  test.describe('Bulk Operations API Integration', () => {
    test('should handle small batch updates', async ({ page }) => {
      // Mock batch update API
      await page.route('/api/bulk/small-batch', async route => {
        const requestBody = await route.request().postDataJSON();
        const updateCount = requestBody.length;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Batch update completed',
            total_records: updateCount,
            successful_updates: updateCount - 1,
            failed_updates: 1,
            details: [
              ...Array(updateCount - 1).fill({ status: 'success' }),
              { status: 'error', message: 'Field validation failed' }
            ]
          })
        });
      });

      await page.goto('/bulk-operations');

      // Select records for batch update
      await page.check('input[type="checkbox"][data-record-id="123"]');
      await page.check('input[type="checkbox"][data-record-id="456"]');
      await page.check('input[type="checkbox"][data-record-id="789"]');

      // Trigger batch update
      await page.click('button:has-text("Update Selected")');

      // Should show results
      await expect(page.getByText('Batch update completed')).toBeVisible();
      await expect(page.getByText('2 successful, 1 failed')).toBeVisible();
    });

    test('should monitor mass update operation', async ({ page }) => {
      const sessionId = 'mass-update-session-789';

      // Mock mass update trigger
      await page.route('/api/bulk/mass-update', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Mass update initiated',
            session_id: sessionId,
            total_records: 5000,
            status: 'started'
          })
        });
      });

      // Mock progress monitoring
      await page.route(`/api/bulk/operation/${sessionId}/status`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              id: sessionId,
              operation_type: 'mass_update',
              status: 'in_progress',
              records_total: 5000,
              records_processed: 2500,
              progress_percentage: 50
            },
            zoho_job_status: {
              state: 'IN_PROGRESS',
              operation: 'UPDATE',
              created_time: new Date().toISOString()
            }
          })
        });
      });

      await page.goto('/bulk-operations');

      // Trigger mass update
      await page.click('button:has-text("Mass Update")');

      // Should show progress
      await expect(page.getByText('Mass update initiated')).toBeVisible();
      await expect(page.getByText('50%')).toBeVisible();
      await expect(page.getByText('2,500 / 5,000')).toBeVisible();
    });
  });

  test.describe('Analytics API Integration', () => {
    test('should load sync health analytics', async ({ page }) => {
      // Mock analytics API
      await page.route('/api/analytics/health**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            time_range: '24h',
            overall_health: 'healthy',
            success_rate: 97.5,
            sync_statistics: {
              total_sessions: 48,
              successful_sessions: 47,
              failed_sessions: 1,
              avg_sync_time: '12.3s',
              records_per_minute: 245.8
            },
            record_status: {
              total_records: 12470,
              synced_records: 12450,
              pending_records: 15,
              conflict_records: 3,
              error_records: 2,
              sync_percentage: 99.8
            },
            api_usage: {
              calls_today: 1247,
              daily_limit: 10000,
              usage_percentage: 12.47,
              calls_remaining: 8753
            }
          })
        });
      });

      await page.goto('/sync-status');

      // Should show health metrics
      await expect(page.getByText('97.5%')).toBeVisible(); // Success rate
      await expect(page.getByText('12,450')).toBeVisible(); // Synced records
      await expect(page.getByText('1,247')).toBeVisible(); // API calls today
      await expect(page.getByText('245.8')).toBeVisible(); // Records per minute
    });

    test('should load and resolve conflicts', async ({ page }) => {
      const conflictId = 'conflict-123';

      // Mock conflicts API
      await page.route('/api/analytics/conflicts', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            conflicts: [
              {
                id: conflictId,
                zoho_record_id: 'zoho-record-456',
                record_name: 'Conflicted Opportunity',
                conflict_fields: ['Business_Region', 'Stage'],
                local_modified_at: new Date(Date.now() - 3600000).toISOString(),
                crm_modified_at: new Date().toISOString(),
                local_value: 'North America',
                crm_value: 'Southeast Asia'
              }
            ],
            total_conflicts: 1
          })
        });
      });

      // Mock conflict resolution API
      await page.route(`/api/analytics/conflicts/${conflictId}/resolve`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Conflict resolved using \'use_crm\' strategy',
            conflict_id: conflictId,
            new_status: 'synced',
            resolved_at: new Date().toISOString()
          })
        });
      });

      await page.goto('/sync-status');

      // Go to conflicts tab
      await page.click('tab:has-text("Conflicts")');

      // Should show conflict
      await expect(page.getByText('Conflicted Opportunity')).toBeVisible();
      await expect(page.getByText('North America')).toBeVisible(); // Local value
      await expect(page.getByText('Southeast Asia')).toBeVisible(); // CRM value

      // Resolve conflict
      await page.click('button:has-text("Use CRM")');

      // Should show resolution success
      await expect(page.getByText('Conflict resolved')).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should poll for sync status updates', async ({ page }) => {
      let pollCount = 0;
      const maxPolls = 3;

      await page.route('/api/sync/status', async route => {
        pollCount++;
        const status = pollCount <= 2 ? 'syncing' : 'healthy';
        const percentage = Math.min(pollCount * 33, 100);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: status,
            last_sync_at: new Date().toISOString(),
            is_syncing: status === 'syncing',
            progress_percentage: status === 'syncing' ? percentage : 100
          })
        });
      });

      await page.goto('/live-sync');

      // Should initially show syncing status
      await expect(page.getByText('syncing')).toBeVisible();

      // Wait for polling to update
      await page.waitForTimeout(3000);

      // Should eventually show healthy status
      await expect(page.getByText('healthy')).toBeVisible();

      // Verify multiple API calls were made
      expect(pollCount).toBeGreaterThan(1);
    });

    test('should handle network errors in polling', async ({ page }) => {
      let requestCount = 0;

      await page.route('/api/sync/status', async route => {
        requestCount++;
        
        if (requestCount <= 2) {
          // First two requests fail
          await route.abort('failed');
        } else {
          // Third request succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              status: 'healthy',
              last_sync_at: new Date().toISOString(),
              is_syncing: false
            })
          });
        }
      });

      await page.goto('/live-sync');

      // Should show error state initially
      await expect(page.getByText('Error loading sync status')).toBeVisible();

      // Wait for retry and recovery
      await page.waitForTimeout(4000);

      // Should eventually recover and show status
      await expect(page.getByText('healthy')).toBeVisible();
    });
  });
});