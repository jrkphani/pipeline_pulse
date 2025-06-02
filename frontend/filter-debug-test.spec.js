import { test, expect } from '@playwright/test';

test.describe('Pipeline Pulse - Filter Debug', () => {
  
  test('Debug filter functionality step by step', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    console.log('✅ Page loaded');
    
    // Get initial state
    const initialCountryText = await page.locator('text=/\\d+ countries •/').first().textContent();
    const initialCountryCount = parseInt(initialCountryText.match(/(\d+) countries/)[1]);
    
    const initialDealsText = await page.locator('text=/\\d+ deals •/').first().textContent();
    const initialDealsCount = parseInt(initialDealsText.match(/(\d+) deals/)[1]);
    
    const initialValueText = await page.locator('text=/SGD [0-9]/').first().textContent();
    
    console.log(`📊 Initial State:`);
    console.log(`   Countries: ${initialCountryCount}`);
    console.log(`   Deals: ${initialDealsCount}`);
    console.log(`   Value: ${initialValueText}`);
    
    // Check current filter values
    const dateFilter = await page.locator('[role="combobox"]').first().textContent();
    const stageFilter = await page.locator('[role="combobox"]').nth(1).textContent();
    
    console.log(`🔍 Current Filters:`);
    console.log(`   Date: ${dateFilter}`);
    console.log(`   Stage: ${stageFilter}`);
    
    // Try changing the probability stage filter
    console.log(`🔄 Changing probability stage filter...`);
    
    const stageSelect = page.locator('[role="combobox"]').nth(1);
    await stageSelect.click();
    await page.waitForTimeout(500);
    
    // Check available options
    const options = await page.locator('[role="option"]').allTextContents();
    console.log(`📋 Available stage options: ${options.join(', ')}`);
    
    // Select "Sales Stage (10-40%)"
    await page.locator('[role="option"]:has-text("Sales Stage")').click();
    await page.waitForTimeout(2000);
    
    // Get updated state
    const updatedCountryText = await page.locator('text=/\\d+ countries •/').first().textContent();
    const updatedCountryCount = parseInt(updatedCountryText.match(/(\d+) countries/)[1]);
    
    const updatedDealsText = await page.locator('text=/\\d+ deals •/').first().textContent();
    const updatedDealsCount = parseInt(updatedDealsText.match(/(\d+) deals/)[1]);
    
    const updatedValueText = await page.locator('text=/SGD [0-9]/').first().textContent();
    
    console.log(`📊 After Sales Stage Filter:`);
    console.log(`   Countries: ${initialCountryCount} → ${updatedCountryCount}`);
    console.log(`   Deals: ${initialDealsCount} → ${updatedDealsCount}`);
    console.log(`   Value: ${initialValueText} → ${updatedValueText}`);
    
    // Check if filter actually changed
    const newStageFilter = await page.locator('[role="combobox"]').nth(1).textContent();
    console.log(`🔍 New Stage Filter: ${newStageFilter}`);
    
    // Verify the change
    if (updatedDealsCount !== initialDealsCount || updatedCountryCount !== initialCountryCount) {
      console.log('✅ FILTER IS WORKING - Numbers changed!');
    } else {
      console.log('❌ FILTER NOT WORKING - Numbers stayed the same');
    }
    
    // Try changing date filter too
    console.log(`🔄 Changing date filter...`);
    
    const dateSelect = page.locator('[role="combobox"]').first();
    await dateSelect.click();
    await page.waitForTimeout(500);
    
    // Check available date options
    const dateOptions = await page.locator('[role="option"]').allTextContents();
    console.log(`📋 Available date options: ${dateOptions.join(', ')}`);
    
    // Select "Next Quarter"
    await page.locator('[role="option"]:has-text("Next Quarter")').click();
    await page.waitForTimeout(2000);
    
    // Get final state
    const finalCountryText = await page.locator('text=/\\d+ countries •/').first().textContent();
    const finalCountryCount = parseInt(finalCountryText.match(/(\d+) countries/)[1]);
    
    const finalDealsText = await page.locator('text=/\\d+ deals •/').first().textContent();
    const finalDealsCount = parseInt(finalDealsText.match(/(\d+) deals/)[1]);
    
    const finalValueText = await page.locator('text=/SGD [0-9]/').first().textContent();
    
    console.log(`📊 After Date Filter:`);
    console.log(`   Countries: ${updatedCountryCount} → ${finalCountryCount}`);
    console.log(`   Deals: ${updatedDealsCount} → ${finalDealsCount}`);
    console.log(`   Value: ${updatedValueText} → ${finalValueText}`);
    
    // Check final filter state
    const finalDateFilter = await page.locator('[role="combobox"]').first().textContent();
    const finalStageFilter = await page.locator('[role="combobox"]').nth(1).textContent();
    
    console.log(`🔍 Final Filters:`);
    console.log(`   Date: ${finalDateFilter}`);
    console.log(`   Stage: ${finalStageFilter}`);
    
    // Summary
    console.log(`📈 SUMMARY:`);
    console.log(`   Initial: ${initialCountryCount} countries, ${initialDealsCount} deals`);
    console.log(`   After Stage Filter: ${updatedCountryCount} countries, ${updatedDealsCount} deals`);
    console.log(`   After Date Filter: ${finalCountryCount} countries, ${finalDealsCount} deals`);
    
    if (finalDealsCount !== initialDealsCount) {
      console.log('✅ FILTERS ARE WORKING CORRECTLY!');
    } else {
      console.log('❌ FILTERS MAY NOT BE WORKING - investigate further');
    }
  });

  test('Check if country breakdown updates with filters', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('http://localhost:5173/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("1CloudHub Deals Analysis")', { timeout: 10000 });
    
    // Expand all countries to see details
    await page.locator('button:has-text("Expand All")').click();
    await page.waitForTimeout(1000);
    
    // Count initial deals in country breakdown
    const initialDealRows = await page.locator('[class*="hover:bg-gray-50 border-b"]').count();
    console.log(`📊 Initial deal rows in country breakdown: ${initialDealRows}`);
    
    // Apply restrictive filter
    const stageSelect = page.locator('[role="combobox"]').nth(1);
    await stageSelect.click();
    await page.locator('[role="option"]:has-text("Deal Approval")').click();
    await page.waitForTimeout(2000);
    
    // Count deals after filter
    const filteredDealRows = await page.locator('[class*="hover:bg-gray-50 border-b"]').count();
    console.log(`📊 Deal rows after filter: ${filteredDealRows}`);
    
    // Check if country subtotals changed
    const subtotalElements = await page.locator('text=Subtotal:').allTextContents();
    console.log(`📊 Country subtotals: ${subtotalElements.length} countries`);
    
    if (filteredDealRows !== initialDealRows) {
      console.log('✅ Country breakdown IS updating with filters!');
    } else {
      console.log('❌ Country breakdown NOT updating with filters');
    }
  });

});
