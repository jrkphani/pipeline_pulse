import { test, expect } from '@playwright/test'

test.describe('Pipeline Pulse - Direct Access Mode', () => {
  const baseURL = 'https://1chsalesreports.com'
  const apiURL = 'https://api.1chsalesreports.com'

  test('should load application without authentication', async ({ page }) => {
    // Navigate directly to the application
    await page.goto(baseURL)
    
    // Should not see any login forms or authentication prompts
    await expect(page.locator('input[type="email"]')).not.toBeVisible()
    await expect(page.locator('input[type="password"]')).not.toBeVisible()
    await expect(page.locator('text=Login')).not.toBeVisible()
    await expect(page.locator('text=Sign In')).not.toBeVisible()
    
    // Should see the main application interface
    await expect(page.locator('text=Pipeline Pulse')).toBeVisible()
    await expect(page.locator('text=System Administrator')).toBeVisible()
    
    console.log('✅ Application loads without authentication')
  })

  test('should have direct access to all modules', async ({ page }) => {
    await page.goto(baseURL)
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle')
    
    // Check navigation menu is accessible
    const navigation = [
      { text: 'Dashboard', path: '/' },
      { text: 'Upload', path: '/upload' },
      { text: 'CRM Sync', path: '/crm-sync' },
      { text: 'O2R Tracker', path: '/o2r' },
      { text: 'Bulk Update', path: '/bulk-update' }
    ]
    
    for (const nav of navigation) {
      // Click on navigation item
      await page.click(`text=${nav.text}`)
      
      // Wait for navigation
      await page.waitForURL(`${baseURL}${nav.path}`)
      
      // Should not see any authentication errors
      await expect(page.locator('text=Unauthorized')).not.toBeVisible()
      await expect(page.locator('text=Access Denied')).not.toBeVisible()
      await expect(page.locator('text=Please login')).not.toBeVisible()
      
      console.log(`✅ ${nav.text} module accessible`)
    }
  })

  test('should show System Administrator as current user', async ({ page }) => {
    await page.goto(baseURL)
    
    // Should show System Administrator as the current user
    await expect(page.locator('text=System Administrator')).toBeVisible()
    
    // Should show admin email
    await expect(page.locator('text=admin@1cloudhub.com')).toBeVisible()
    
    console.log('✅ System Administrator user displayed')
  })

  test('API endpoints should work without authentication', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get(`${apiURL}/health`)
    expect(healthResponse.ok()).toBeTruthy()
    
    const healthData = await healthResponse.json()
    expect(healthData.status).toBe('healthy')
    
    // Test API documentation
    const docsResponse = await request.get(`${apiURL}/docs`)
    expect(docsResponse.ok()).toBeTruthy()
    
    // Test analysis endpoint (should return empty list, not auth error)
    const analysisResponse = await request.get(`${apiURL}/api/analysis/`)
    expect(analysisResponse.ok()).toBeTruthy()
    
    const analysisData = await analysisResponse.json()
    expect(analysisData).toHaveProperty('analyses')
    
    // Test currency endpoint
    const currencyResponse = await request.get(`${apiURL}/api/currency/rates`)
    expect(currencyResponse.ok()).toBeTruthy()
    
    const currencyData = await currencyResponse.json()
    expect(currencyData).toHaveProperty('rates')
    expect(currencyData).toHaveProperty('base_currency', 'SGD')
    
    console.log('✅ API endpoints accessible without authentication')
  })

  test('should not have authentication-related endpoints', async ({ request }) => {
    // These endpoints should not exist anymore
    const authEndpoints = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/verify-token',
      '/api/auth/saml/login',
      '/api/auth/saml/callback',
      '/api/auth/user'
    ]
    
    for (const endpoint of authEndpoints) {
      const response = await request.get(`${apiURL}${endpoint}`)
      expect(response.status()).toBe(404)
      console.log(`✅ ${endpoint} properly removed (404)`)
    }
  })

  test('upload functionality should work without authentication', async ({ page }) => {
    await page.goto(`${baseURL}/upload`)
    
    // Should see upload interface
    await expect(page.locator('text=Upload')).toBeVisible()
    await expect(page.locator('input[type="file"]')).toBeVisible()
    
    // Should not see authentication errors
    await expect(page.locator('text=Please login to upload')).not.toBeVisible()
    await expect(page.locator('text=Authentication required')).not.toBeVisible()
    
    console.log('✅ Upload functionality accessible')
  })

  test('CRM sync should work without authentication', async ({ page }) => {
    await page.goto(`${baseURL}/crm-sync`)
    
    // Should see CRM sync interface
    await expect(page.locator('text=CRM')).toBeVisible()
    
    // Should not see authentication errors
    await expect(page.locator('text=Please authenticate with Zoho')).not.toBeVisible()
    await expect(page.locator('text=Login required')).not.toBeVisible()
    
    console.log('✅ CRM sync accessible')
  })

  test('O2R tracker should work without authentication', async ({ page }) => {
    await page.goto(`${baseURL}/o2r`)
    
    // Should see O2R interface
    await expect(page.locator('text=O2R')).toBeVisible()
    
    // Should not see authentication errors
    await expect(page.locator('text=Access denied')).not.toBeVisible()
    
    console.log('✅ O2R tracker accessible')
  })

  test('bulk update should work without authentication', async ({ page }) => {
    await page.goto(`${baseURL}/bulk-update`)
    
    // Should see bulk update interface
    await expect(page.locator('text=Bulk Update')).toBeVisible()
    
    // Should not see authentication errors
    await expect(page.locator('text=Permission denied')).not.toBeVisible()
    
    console.log('✅ Bulk update accessible')
  })

  test('performance should be improved without authentication', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(baseURL)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load faster without authentication overhead
    expect(loadTime).toBeLessThan(5000) // 5 seconds max
    
    console.log(`✅ Application loaded in ${loadTime}ms`)
  })
})

test.describe('API Documentation Access', () => {
  const apiURL = 'https://api.1chsalesreports.com'

  test('API docs should be accessible without authentication', async ({ page }) => {
    await page.goto(`${apiURL}/docs`)
    
    // Should see Swagger UI
    await expect(page.locator('text=Pipeline Pulse API')).toBeVisible()
    await expect(page.locator('.swagger-ui')).toBeVisible()
    
    // Should not see authentication requirements
    await expect(page.locator('text=Authorize')).not.toBeVisible()
    await expect(page.locator('text=Authentication required')).not.toBeVisible()
    
    console.log('✅ API documentation accessible')
  })

  test('ReDoc should be accessible without authentication', async ({ page }) => {
    await page.goto(`${apiURL}/redoc`)
    
    // Should see ReDoc interface
    await expect(page.locator('text=Pipeline Pulse API')).toBeVisible()
    
    console.log('✅ ReDoc documentation accessible')
  })
})
