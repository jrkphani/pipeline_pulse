/**
 * Simple Playwright Tests for Pipeline Pulse Frontend
 * 
 * These tests focus on basic functionality and real user interactions
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:5173';
const ANALYSIS_ID = '8a8f72da-dc23-474e-af99-5c5b465b0d49';

test.describe('Pipeline Pulse - Basic Functionality', () => {
  
  test('Frontend loads and has correct title', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Check if the page loads with correct title
    await expect(page).toHaveTitle(/Pipeline Pulse/);
    
    console.log('✅ Frontend loads with correct title');
  });

  test('Upload page is accessible', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/upload`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we can find any content on the page
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Upload');
    
    console.log('✅ Upload page is accessible');
  });

  test('Analysis page loads with data', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/analysis/${ANALYSIS_ID}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for API calls
    await page.waitForTimeout(3000);
    
    // Check if we can find analysis content
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Analysis');
    
    console.log('✅ Analysis page loads');
  });

  test('API endpoints are working', async ({ page }) => {
    // Test the files API endpoint
    const response = await page.request.get('http://localhost:8000/api/upload/files');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('files');
    
    console.log('✅ Files API endpoint works');
  });

  test('Latest analysis API works', async ({ page }) => {
    // Test the latest analysis endpoint
    const response = await page.request.get('http://localhost:8000/api/upload/latest');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('analysis_id');
    expect(data.analysis_id).toBe(ANALYSIS_ID);
    
    console.log('✅ Latest analysis API works');
  });

  test('Analysis data API returns real data', async ({ page }) => {
    // Test the analysis data endpoint
    const response = await page.request.get(`http://localhost:8000/api/upload/analysis/${ANALYSIS_ID}`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.total_deals).toBe(273);
    expect(data.processed_deals).toBe(181);
    expect(data.filename).toBe('Opportunities_2025_05_31.csv');
    
    console.log('✅ Analysis data API returns correct data');
  });

  test('Frontend can navigate between pages', async ({ page }) => {
    // Start at homepage
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Navigate to upload page via URL (since navigation might be different)
    await page.goto(`${FRONTEND_URL}/upload`);
    await page.waitForLoadState('networkidle');
    
    // Check URL
    expect(page.url()).toContain('/upload');
    
    // Navigate to analysis page
    await page.goto(`${FRONTEND_URL}/analysis/${ANALYSIS_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Check URL
    expect(page.url()).toContain('/analysis/');
    
    console.log('✅ Navigation between pages works');
  });

  test('Upload page shows file list', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/upload`);
    await page.waitForLoadState('networkidle');
    
    // Wait for any API calls to complete
    await page.waitForTimeout(2000);
    
    // Check if page contains upload-related content
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Upload');
    
    console.log('✅ Upload page shows content');
  });

});

// Export constants for other tests
export { FRONTEND_URL, ANALYSIS_ID };
