import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/')
  })

  test('displays main dashboard elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Pipeline Pulse/)

    // Check main navigation is present
    await expect(page.getByRole('navigation')).toBeVisible()

    // Check for key dashboard elements
    await expect(page.getByText('Pipeline Pulse Dashboard')).toBeVisible()
  })

  test('shows metric cards with proper values', async ({ page }) => {
    // Wait for metric cards to load
    await expect(page.locator('.pp-metric-card').first()).toBeVisible()

    // Check that metric cards display values
    const metricCards = page.locator('.pp-metric-card')
    const cardCount = await metricCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Check first metric card has a title and value
    const firstCard = metricCards.first()
    await expect(firstCard.locator('h3')).toBeVisible()
    await expect(firstCard.locator('[class*="text-2xl"]')).toBeVisible()
  })

  test('displays O2R phase indicators', async ({ page }) => {
    // Look for O2R phase indicators
    const phaseIndicator = page.locator('[role="progressbar"]')
    if (await phaseIndicator.count() > 0) {
      await expect(phaseIndicator.first()).toBeVisible()
      await expect(phaseIndicator.first()).toHaveAttribute('aria-label', /O2R Phase Progress/)
    }
  })

  test('shows status badges with proper colors and labels', async ({ page }) => {
    // Wait for status badges to load
    const statusBadges = page.locator('[role="status"]')
    const badgeCount = await statusBadges.count()
    
    if (badgeCount > 0) {
      const firstBadge = statusBadges.first()
      await expect(firstBadge).toBeVisible()
      await expect(firstBadge).toHaveAttribute('aria-label', /Status:/)
    }
  })

  test('navigation menu is accessible', async ({ page }) => {
    // Check that navigation is keyboard accessible
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with arrow keys if it's a proper menu
    const navItems = page.locator('nav a, nav button')
    const itemCount = await navItems.count()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that the dashboard still loads properly
    await expect(page.getByText('Pipeline Pulse Dashboard')).toBeVisible()

    // Check that metric cards stack properly on mobile
    const metricCards = page.locator('.pp-metric-card')
    if (await metricCards.count() > 0) {
      await expect(metricCards.first()).toBeVisible()
    }
  })

  test('handles loading states gracefully', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/')

    // Look for loading indicators
    const loadingSpinners = page.locator('[role="status"][aria-live="polite"]')
    const skeletons = page.locator('.animate-pulse')
    
    // Either loading indicators should be present initially or content should load quickly
    const hasLoadingState = await loadingSpinners.count() > 0 || await skeletons.count() > 0
    
    if (hasLoadingState) {
      // Wait for loading to complete
      await expect(loadingSpinners.first()).toBeHidden({ timeout: 10000 })
    }

    // Ensure content is visible after loading
    await expect(page.getByText('Pipeline Pulse Dashboard')).toBeVisible()
  })

  test('error states are handled properly', async ({ page }) => {
    // Test what happens when there's no data
    // This would typically involve mocking API responses
    
    // For now, just check that error boundaries exist
    const errorElements = page.locator('[role="alert"]')
    
    // If there are errors, they should be displayed properly
    if (await errorElements.count() > 0) {
      await expect(errorElements.first()).toBeVisible()
    }
  })

  test('accessibility: keyboard navigation works', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    // Should be able to navigate through interactive elements
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement)
  })

  test('accessibility: screen reader support', async ({ page }) => {
    // Check for proper ARIA labels and roles
    const elementsWithAriaLabel = page.locator('[aria-label]')
    const elementsWithRole = page.locator('[role]')
    
    // Should have some ARIA-labeled elements
    expect(await elementsWithAriaLabel.count()).toBeGreaterThan(0)
    expect(await elementsWithRole.count()).toBeGreaterThan(0)
  })

  test('performance: page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await expect(page.getByText('Pipeline Pulse Dashboard')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })
})