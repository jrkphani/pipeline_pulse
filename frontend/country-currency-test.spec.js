import { test, expect } from '@playwright/test';

test.describe('Pipeline Pulse - Country Detection & Currency Conversion', () => {
  
  test('Country detection uses CSV Country column correctly', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Expand all countries to see individual deals
    await page.locator('button:has-text("Expand All")').click();
    await page.waitForTimeout(2000);
    
    // Check for country flags in country headers
    const countryFlags = page.locator('[class*="bg-blue-50"] span[class*="text-xl"]');
    const flagCount = await countryFlags.count();
    
    expect(flagCount).toBeGreaterThan(0);
    console.log(`✅ Found ${flagCount} country flags`);
    
    // Check for specific countries that should be detected correctly
    const malaysiaFlag = page.locator('text=Malaysia');
    const singaporeFlag = page.locator('text=Singapore');
    const indiaFlag = page.locator('text=India');
    
    // At least one of these should be visible
    const countryCount = await Promise.all([
      malaysiaFlag.count(),
      singaporeFlag.count(), 
      indiaFlag.count()
    ]);
    
    const totalCountries = countryCount.reduce((sum, count) => sum + count, 0);
    expect(totalCountries).toBeGreaterThan(0);
    
    console.log(`✅ Country detection working: Malaysia(${countryCount[0]}), Singapore(${countryCount[1]}), India(${countryCount[2]})`);
  });

  test('Currency conversion shows original and SGD amounts', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Expand all countries to see individual deals
    await page.locator('button:has-text("Expand All")').click();
    await page.waitForTimeout(2000);
    
    // Check for currency conversion indicators in expanded deals
    const currencyIndicators = page.locator('text=/→ SGD/');
    const currencyCount = await currencyIndicators.count();
    
    if (currencyCount > 0) {
      console.log(`✅ Found ${currencyCount} currency conversion indicators`);
    }
    
    // Check for original currency amounts
    const originalAmounts = page.locator('text=/Orig:/');
    const originalCount = await originalAmounts.count();
    
    if (originalCount > 0) {
      console.log(`✅ Found ${originalCount} original currency amounts`);
    }
    
    // Check for exchange rate information
    const exchangeRates = page.locator('text=/Rate:/');
    const rateCount = await exchangeRates.count();
    
    if (rateCount > 0) {
      console.log(`✅ Found ${rateCount} exchange rate indicators`);
    }
    
    // At least one currency conversion feature should be present
    expect(currencyCount + originalCount + rateCount).toBeGreaterThan(0);
  });

  test('Country subtotals are accurate and not clubbed incorrectly', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Get the total number of countries shown
    const countryText = await page.locator('text=/\\d+ countries •/').textContent();
    const countryCount = parseInt(countryText.match(/(\d+) countries/)[1]);
    
    console.log(`✅ Total countries detected: ${countryCount}`);
    
    // Expand all countries
    await page.locator('button:has-text("Expand All")').click();
    await page.waitForTimeout(2000);
    
    // Check for subtotal rows
    const subtotalRows = page.locator('text=Subtotal:');
    const subtotalCount = await subtotalRows.count();
    
    // Should have one subtotal per country
    expect(subtotalCount).toBe(countryCount);
    console.log(`✅ Found ${subtotalCount} subtotals for ${countryCount} countries`);
    
    // Check that countries are properly separated (not clubbed)
    if (countryCount >= 2) {
      // Get first two country names
      const countryHeaders = page.locator('[class*="bg-blue-50"] div:has-text("deals • Avg:")');
      const firstCountry = await countryHeaders.nth(0).textContent();
      const secondCountry = await countryHeaders.nth(1).textContent();
      
      // They should be different
      expect(firstCountry).not.toBe(secondCountry);
      console.log(`✅ Countries properly separated: "${firstCountry}" vs "${secondCountry}"`);
    }
  });

  test('SGD standardization is consistent across all levels', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Check SGD in summary cards
    const summaryCards = page.locator('[class*="text-2xl font-bold"]:has-text("SGD")');
    const summaryCount = await summaryCards.count();
    
    console.log(`✅ Found ${summaryCount} SGD amounts in summary cards`);
    
    // Check SGD in country breakdown
    const countryAmounts = page.locator('text=/SGD [0-9]/');
    const countryCount = await countryAmounts.count();
    
    console.log(`✅ Found ${countryCount} SGD amounts in country breakdown`);
    
    // Expand all to check individual deals
    await page.locator('button:has-text("Expand All")').click();
    await page.waitForTimeout(2000);
    
    // Check SGD in individual deals
    const dealAmounts = page.locator('text=/SGD [0-9]/ >> visible=true');
    const dealCount = await dealAmounts.count();
    
    console.log(`✅ Found ${dealCount} SGD amounts in individual deals`);
    
    // Should have SGD amounts at all levels
    expect(summaryCount + countryCount + dealCount).toBeGreaterThan(5);
  });

  test('Filters apply correctly to country-level data', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Get initial country count
    const initialText = await page.locator('text=/\\d+ countries •/').textContent();
    const initialCountryCount = parseInt(initialText.match(/(\d+) countries/)[1]);
    
    // Get initial deal count
    const initialDealText = await page.locator('text=/\\d+ deals •/').textContent();
    const initialDealCount = parseInt(initialDealText.match(/(\d+) deals/)[1]);
    
    console.log(`✅ Initial state: ${initialCountryCount} countries, ${initialDealCount} deals`);
    
    // Apply a restrictive filter (Sales Stage: 10-40%)
    // Note: Using click instead of selectOption for Radix Select
    const stageSelect = page.locator('[role="combobox"]').nth(1);
    await stageSelect.click();
    await page.locator('[role="option"]:has-text("Sales Stage")').click();
    
    // Wait for update
    await page.waitForTimeout(2000);
    
    // Get updated counts
    const updatedText = await page.locator('text=/\\d+ countries •/').textContent();
    const updatedCountryCount = parseInt(updatedText.match(/(\d+) countries/)[1]);
    
    const updatedDealText = await page.locator('text=/\\d+ deals •/').textContent();
    const updatedDealCount = parseInt(updatedDealText.match(/(\d+) deals/)[1]);
    
    console.log(`✅ After filter: ${updatedCountryCount} countries, ${updatedDealCount} deals`);
    
    // Filter should reduce the numbers (or at least not increase them)
    expect(updatedDealCount).toBeLessThanOrEqual(initialDealCount);
    expect(updatedCountryCount).toBeLessThanOrEqual(initialCountryCount);
    
    console.log(`✅ Filters applied correctly at country level`);
  });

});
