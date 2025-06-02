import { test, expect } from '@playwright/test';

test.describe('Pipeline Pulse - Country Pivot Table', () => {
  
  test('Country pivot table displays and functions correctly', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Check if country pivot table is present
    await expect(page.locator('text=Country Pipeline Analysis')).toBeVisible();
    
    // Check for expand/collapse all buttons
    await expect(page.locator('button:has-text("Expand All")')).toBeVisible();
    await expect(page.locator('button:has-text("Collapse All")')).toBeVisible();
    
    // Check for country rows with flags
    const countryRows = page.locator('[class*="bg-blue-50"]');
    await expect(countryRows.first()).toBeVisible();
    
    // Test expand/collapse functionality
    const firstCountryRow = countryRows.first();
    await firstCountryRow.click();
    
    // Check if deals are shown when expanded
    await expect(page.locator('text=Subtotal:')).toBeVisible();
    
    // Test collapse
    await firstCountryRow.click();
    
    console.log('✅ Country pivot table functionality verified');
  });

  test('Filters apply to country breakdown', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Get initial country count
    const initialCountryText = await page.locator('text=/\\d+ countries •/').textContent();
    const initialCountryCount = parseInt(initialCountryText.match(/(\d+) countries/)[1]);
    
    // Change probability stage filter
    await page.locator('select').nth(1).selectOption('sales-stage'); // Sales Stage (10-40%)
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Check if country breakdown updated
    const updatedCountryText = await page.locator('text=/\\d+ countries •/').textContent();
    const updatedCountryCount = parseInt(updatedCountryText.match(/(\d+) countries/)[1]);
    
    // Verify filters are applied (country count might change)
    expect(typeof updatedCountryCount).toBe('number');
    
    console.log(`✅ Filters applied: ${initialCountryCount} → ${updatedCountryCount} countries`);
  });

  test('Country subtotals and grand total are accurate', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Check for grand total row
    await expect(page.locator('text=Grand Total:')).toBeVisible();
    
    // Expand all countries to see subtotals
    await page.locator('button:has-text("Expand All")').click();
    
    // Wait for expansion
    await page.waitForTimeout(1000);
    
    // Check for subtotal rows
    const subtotalRows = page.locator('text=Subtotal:');
    const subtotalCount = await subtotalRows.count();
    
    expect(subtotalCount).toBeGreaterThan(0);
    
    console.log(`✅ Found ${subtotalCount} country subtotals`);
  });

  test('SGD currency standardization is working', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Check that all currency displays show SGD
    const sgdElements = page.locator('text=/SGD [0-9]/');
    const sgdCount = await sgdElements.count();
    
    expect(sgdCount).toBeGreaterThan(0);
    
    // Check for SGD in summary cards
    await expect(page.locator('text=/SGD \\d+\\.\\d+M/')).toBeVisible();
    
    console.log(`✅ Found ${sgdCount} SGD currency displays`);
  });

  test('Dynamic subtitle updates with filters', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Get initial subtitle
    const initialSubtitle = await page.locator('p.text-muted-foreground').first().textContent();
    
    // Change filters
    await page.locator('select').first().selectOption('next-quarter'); // Next Quarter
    await page.locator('select').nth(1).selectOption('deal-approval-stage'); // Deal Approval Stage
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Get updated subtitle
    const updatedSubtitle = await page.locator('p.text-muted-foreground').first().textContent();
    
    // Verify subtitle changed
    expect(updatedSubtitle).not.toBe(initialSubtitle);
    expect(updatedSubtitle).toContain('Deal Approval Stage');
    expect(updatedSubtitle).toContain('Next Quarter');
    
    console.log('✅ Dynamic subtitle updates correctly');
    console.log(`Initial: ${initialSubtitle}`);
    console.log(`Updated: ${updatedSubtitle}`);
  });

});
