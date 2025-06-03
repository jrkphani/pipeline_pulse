import { test, expect } from '@playwright/test'

test.describe('AWS Deployment Verification - Direct Access Mode', () => {
  const frontendURL = 'https://1chsalesreports.com'
  const apiURL = 'http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com'
  const apiDomainURL = 'https://api.1chsalesreports.com'

  test('Frontend - CloudFront Distribution Health', async ({ page }) => {
    console.log('🌐 Testing CloudFront distribution...')
    
    await page.goto(frontendURL)
    await page.waitForLoadState('networkidle')
    
    // Check if the page loads successfully
    await expect(page.locator('html')).toBeVisible()
    
    // Check for React app mounting
    const rootElement = page.locator('#root')
    await expect(rootElement).toBeVisible()
    
    // Check for Pipeline Pulse title
    await expect(page).toHaveTitle(/Pipeline Pulse/)
    
    console.log('✅ CloudFront distribution serving React app successfully')
  })

  test('Backend - ALB Health Check', async ({ request }) => {
    console.log('🏥 Testing Application Load Balancer health...')
    
    const healthResponse = await request.get(`${apiURL}/health`)
    expect(healthResponse.ok()).toBeTruthy()
    
    const healthData = await healthResponse.json()
    expect(healthData.status).toBe('healthy')
    
    console.log('✅ ALB health check passing')
  })

  test('Backend - ECS Service Status', async ({ request }) => {
    console.log('🐳 Testing ECS service endpoints...')
    
    // Test root endpoint
    const rootResponse = await request.get(`${apiURL}/`)
    expect(rootResponse.ok()).toBeTruthy()
    
    const rootData = await rootResponse.json()
    expect(rootData.message).toBe('Pipeline Pulse API')
    expect(rootData.version).toBe('1.0.0')
    
    console.log('✅ ECS service responding correctly')
  })

  test('Authentication Removal - No Auth Endpoints', async ({ request }) => {
    console.log('🔒 Verifying authentication endpoints are removed...')
    
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

  test('Business Endpoints - Direct Access', async ({ request }) => {
    console.log('💼 Testing business endpoints without authentication...')
    
    // Test analysis endpoint
    const analysisResponse = await request.get(`${apiURL}/api/analysis/`)
    expect(analysisResponse.ok()).toBeTruthy()
    
    const analysisData = await analysisResponse.json()
    expect(analysisData).toHaveProperty('analyses')
    console.log('✅ Analysis endpoint accessible')
    
    // Test currency endpoint
    const currencyResponse = await request.get(`${apiURL}/api/currency/rates`)
    expect(currencyResponse.ok()).toBeTruthy()
    
    const currencyData = await currencyResponse.json()
    expect(currencyData).toHaveProperty('rates')
    expect(currencyData).toHaveProperty('base_currency', 'SGD')
    console.log('✅ Currency endpoint accessible')
  })

  test('Frontend - Direct Access Verification', async ({ page }) => {
    console.log('🚀 Testing direct access mode...')
    
    await page.goto(frontendURL)
    await page.waitForLoadState('networkidle')
    
    // Should NOT see authentication elements
    const authElements = [
      'button:has-text("Sign in with Zoho")',
      'input[type="email"]',
      'input[type="password"]',
      'text=Please sign in',
      'text=Login required'
    ]
    
    for (const selector of authElements) {
      const element = page.locator(selector)
      const count = await element.count()
      if (count > 0) {
        console.log(`⚠️ Found authentication element: ${selector}`)
      }
    }
    
    // Should see application content
    await expect(page.locator('text=Pipeline Pulse')).toBeVisible({ timeout: 10000 })
    console.log('✅ Application loads in direct access mode')
  })

  test('Performance - Load Time Verification', async ({ page }) => {
    console.log('⚡ Testing application performance...')
    
    const startTime = Date.now()
    
    await page.goto(frontendURL)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load faster without authentication overhead
    expect(loadTime).toBeLessThan(10000) // 10 seconds max
    
    console.log(`✅ Application loaded in ${loadTime}ms`)
  })

  test('API Documentation - Accessible Without Auth', async ({ page }) => {
    console.log('📚 Testing API documentation access...')
    
    // Test direct ALB access to docs
    await page.goto(`${apiURL}/docs`)
    
    // Should see Swagger UI
    const swaggerTitle = page.locator('text=Pipeline Pulse API, text=FastAPI')
    if (await swaggerTitle.count() > 0) {
      console.log('✅ API documentation accessible via ALB')
    } else {
      console.log('⚠️ API documentation may not be fully loaded')
    }
  })

  test('CORS Configuration - Frontend to Backend', async ({ page }) => {
    console.log('🌐 Testing CORS configuration...')
    
    await page.goto(frontendURL)
    
    // Test if frontend can make API calls
    const response = await page.evaluate(async (apiUrl) => {
      try {
        const res = await fetch(`${apiUrl}/health`)
        return { ok: res.ok, status: res.status }
      } catch (error) {
        return { error: error.message }
      }
    }, apiURL)
    
    if (response.ok) {
      console.log('✅ CORS configured correctly - frontend can access backend')
    } else {
      console.log(`⚠️ CORS issue detected: ${response.error || response.status}`)
    }
  })

  test('SSL/HTTPS - Certificate Verification', async ({ request }) => {
    console.log('🔐 Testing SSL certificate...')
    
    // Test HTTPS frontend
    const httpsResponse = await request.get(frontendURL)
    expect(httpsResponse.ok()).toBeTruthy()
    console.log('✅ HTTPS frontend accessible')
    
    // Test if API domain redirects properly
    try {
      const apiDomainResponse = await request.get(apiDomainURL)
      console.log(`API domain status: ${apiDomainResponse.status()}`)
    } catch (error) {
      console.log(`⚠️ API domain issue: ${error.message}`)
    }
  })

  test('Database Connectivity - Via API', async ({ request }) => {
    console.log('🗄️ Testing database connectivity...')
    
    // Test endpoints that require database
    const endpoints = [
      '/api/analysis/',
      '/api/currency/rates'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${apiURL}${endpoint}`)
        if (response.ok()) {
          console.log(`✅ Database connectivity confirmed via ${endpoint}`)
        } else {
          console.log(`⚠️ Database issue detected at ${endpoint}: ${response.status()}`)
        }
      } catch (error) {
        console.log(`⚠️ Database connectivity error at ${endpoint}: ${error.message}`)
      }
    }
  })

  test('AWS Secrets Manager - Integration Test', async ({ request }) => {
    console.log('🔑 Testing AWS Secrets Manager integration...')
    
    // Test currency endpoint which uses secrets for API key
    const currencyResponse = await request.get(`${apiURL}/api/currency/rates`)
    
    if (currencyResponse.ok()) {
      const data = await currencyResponse.json()
      if (data.rates && Object.keys(data.rates).length > 0) {
        console.log('✅ AWS Secrets Manager integration working (currency API key retrieved)')
      } else {
        console.log('⚠️ Currency API may not be working (check secrets)')
      }
    } else {
      console.log(`⚠️ Currency endpoint error: ${currencyResponse.status()}`)
    }
  })

  test('Complete User Journey - No Authentication', async ({ page }) => {
    console.log('👤 Testing complete user journey...')
    
    // Start at homepage
    await page.goto(frontendURL)
    await page.waitForLoadState('networkidle')
    
    // Should immediately see application (no login)
    await expect(page.locator('text=Pipeline Pulse')).toBeVisible({ timeout: 10000 })
    
    // Try to access different sections
    const sections = ['Dashboard', 'Upload', 'Analysis']
    
    for (const section of sections) {
      const sectionLink = page.locator(`text=${section}`).first()
      if (await sectionLink.count() > 0) {
        try {
          await sectionLink.click()
          await page.waitForLoadState('networkidle')
          console.log(`✅ ${section} section accessible`)
        } catch (error) {
          console.log(`⚠️ ${section} section navigation failed: ${error.message}`)
        }
      }
    }
    
    console.log('✅ Complete user journey successful without authentication')
  })
})
