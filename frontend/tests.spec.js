/**
 * Playwright E2E Tests for Pipeline Pulse Frontend
 * 
 * Run with: npx playwright test playwright-tests.js --headed
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const ANALYSIS_ID = '8a8f72da-dc23-474e-af99-5c5b465b0d49';

test.describe('Pipeline Pulse Frontend Tests', () => {
  
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Pipeline Pulse/);
    
    // Check for navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    console.log('✅ Homepage test passed');
  });

  test('Upload page functionality', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/upload`);
    
    // Check page title and main elements
    await expect(page.locator('h1')).toContainText('Upload Pipeline Data');
    
    // Check for upload area
    await expect(page.locator('[data-testid="upload-area"], .upload-area, input[type="file"]')).toBeVisible();
    
    // Check for file list section
    await expect(page.locator('text=Upload History')).toBeVisible();
    
    console.log('✅ Upload page test passed');
  });

  test('File list displays uploaded files', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/upload`);
    
    // Wait for the file list to load
    await page.waitForTimeout(2000);
    
    // Check if files are displayed
    const fileItems = page.locator('[data-testid="file-item"], .file-item');
    const fileCount = await fileItems.count();
    
    if (fileCount > 0) {
      console.log(`✅ Found ${fileCount} uploaded files`);
      
      // Check for "View Analysis" buttons
      const viewAnalysisButtons = page.locator('text=View Analysis');
      await expect(viewAnalysisButtons.first()).toBeVisible();
      
      console.log('✅ View Analysis buttons are present');
    } else {
      console.log('ℹ️  No files found in upload history');
    }
  });

  test('Analysis page loads with real data', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/analysis/${ANALYSIS_ID}`);
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Pipeline Analysis');
    
    // Check for summary cards
    await expect(page.locator('text=Total Deals')).toBeVisible();
    await expect(page.locator('text=Processing Rate')).toBeVisible();
    await expect(page.locator('text=Total Value')).toBeVisible();
    
    // Check for data table
    await expect(page.locator('text=Deal Details')).toBeVisible();
    
    // Check if actual data is displayed (not just placeholders)
    const dealRows = page.locator('table tbody tr');
    const rowCount = await dealRows.count();
    
    if (rowCount > 0) {
      console.log(`✅ Analysis page shows ${rowCount} deal records`);
      
      // Check for real data in first row
      const firstRow = dealRows.first();
      const opportunityName = await firstRow.locator('td').first().textContent();
      
      if (opportunityName && opportunityName !== 'N/A' && opportunityName.trim() !== '') {
        console.log(`✅ Real data found: "${opportunityName}"`);
      }
    }
    
    console.log('✅ Analysis page test passed');
  });

  test('Navigation between pages works', async ({ page }) => {
    // Start at homepage
    await page.goto(FRONTEND_URL);
    
    // Navigate to upload page
    await page.click('text=Upload');
    await expect(page).toHaveURL(/.*\/upload/);
    
    // If there are files, click "View Analysis" on the first one
    const viewAnalysisButton = page.locator('text=View Analysis').first();
    if (await viewAnalysisButton.isVisible()) {
      await viewAnalysisButton.click();
      await expect(page).toHaveURL(/.*\/analysis\/.+/);
      console.log('✅ Navigation to analysis page works');
    }
    
    console.log('✅ Navigation test passed');
  });

  test('API endpoints respond correctly', async ({ page }) => {
    // Test API endpoints by checking network responses
    await page.goto(`${FRONTEND_URL}/upload`);
    
    // Wait for API calls to complete
    await page.waitForTimeout(2000);
    
    // Check if files API was called successfully
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:8000/api/upload/files');
        return {
          status: res.status,
          ok: res.ok
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    
    console.log('✅ API endpoints test passed');
  });

  test('Analysis data loads correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/analysis/${ANALYSIS_ID}`);
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check for loading state to disappear
    await expect(page.locator('text=Loading analysis data')).not.toBeVisible();
    
    // Check for error messages
    await expect(page.locator('text=Failed to load')).not.toBeVisible();
    
    // Verify specific data elements
    await expect(page.locator('text=273')).toBeVisible(); // Total deals
    await expect(page.locator('text=181')).toBeVisible(); // Processed deals
    await expect(page.locator('text=Opportunities_2025_05_31.csv')).toBeVisible(); // Filename
    
    console.log('✅ Analysis data test passed');
  });

});

// Export for manual running
export {
  FRONTEND_URL,
  ANALYSIS_ID
};
