import { test, expect } from '@playwright/test'

test.describe('Auth Store JWT Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/session/store', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })

    await page.route('**/api/session/retrieve', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsInJlZ2lvbiI6InVzLWVhc3QtMSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjpbImFkbWluIl0sImV4cCI6MTcwNzU2MTI0MywiaWF0IjoxNzA3NTU3NjQzfQ.fake-signature'
        })
      })
    })

    await page.route('**/api/session/clear', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })

    await page.route('**/api/state/update', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })
  })

  test('should properly decode JWT and extract user information', async ({ page }) => {
    await page.goto('/login')
    
    // Create a valid JWT token with test data
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsInJlZ2lvbiI6InVzLWVhc3QtMSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjpbImFkbWluIl0sImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzA3NTU3NjQzfQ.fake-signature'

    // Simulate successful login with JWT
    await page.evaluate((token) => {
      // Access the auth store and call handleLoginSuccess
      const authStore = (window as any).useAuthStore?.getState?.()
      if (authStore) {
        authStore.handleLoginSuccess(token)
      }
    }, testToken)

    // Wait for authentication to complete
    await page.waitForTimeout(1000)

    // Verify user information is correctly extracted
    const userInfo = await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState?.()
      return authStore?.user
    })

    expect(userInfo).toMatchObject({
      id: '123',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      display_name: 'John Doe',
      full_name: 'John Doe',
      region: 'us-east-1',
      roles: ['admin']
    })
  })

  test('should validate JWT expiration and reject expired tokens', async ({ page }) => {
    await page.goto('/login')
    
    // Create an expired JWT token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsInJlZ2lvbiI6InVzLWVhc3QtMSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjpbImFkbWluIl0sImV4cCI6MTAwMDAwMDAwMCwiaWF0IjoxNzA3NTU3NjQzfQ.fake-signature'

    // Simulate login with expired token
    const error = await page.evaluate(async (token) => {
      try {
        const authStore = (window as any).useAuthStore?.getState?.()
        if (authStore) {
          await authStore.handleLoginSuccess(token)
        }
        return null
      } catch (e) {
        return e.message
      }
    }, expiredToken)

    expect(error).toBe('Token is expired')

    // Verify user is not authenticated
    const isAuthenticated = await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState?.()
      return authStore?.isAuthenticated
    })

    expect(isAuthenticated).toBe(false)
  })

  test('should store session information in database instead of localStorage', async ({ page }) => {
    let sessionStoreRequests = 0
    
    await page.route('**/api/session/store', (route) => {
      sessionStoreRequests++
      const request = route.request()
      const postData = JSON.parse(request.postData() || '{}')
      
      expect(postData.token).toBeDefined()
      
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/login')
    
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsInJlZ2lvbiI6InVzLWVhc3QtMSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjpbImFkbWluIl0sImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzA3NTU3NjQzfQ.fake-signature'

    await page.evaluate((token) => {
      const authStore = (window as any).useAuthStore?.getState?.()
      if (authStore) {
        authStore.handleLoginSuccess(token)
      }
    }, testToken)

    await page.waitForTimeout(1000)

    // Verify session was stored in database
    expect(sessionStoreRequests).toBeGreaterThan(0)

    // Verify token is NOT stored in localStorage
    const localStorageToken = await page.evaluate(() => {
      return localStorage.getItem('jwt_token')
    })

    expect(localStorageToken).toBe(null)
  })

  test('should retrieve session from database on page refresh', async ({ page }) => {
    let sessionRetrieveRequests = 0
    
    await page.route('**/api/session/retrieve', (route) => {
      sessionRetrieveRequests++
      route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsInJlZ2lvbiI6InVzLWVhc3QtMSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjpbImFkbWluIl0sImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzA3NTU3NjQzfQ.fake-signature'
        })
      })
    })

    await page.goto('/dashboard')
    
    // Simulate page refresh by calling checkAuthStatus
    await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState?.()
      if (authStore) {
        authStore.checkAuthStatus()
      }
    })

    await page.waitForTimeout(1000)

    // Verify session was retrieved from database
    expect(sessionRetrieveRequests).toBeGreaterThan(0)

    // Verify user is authenticated after "refresh"
    const isAuthenticated = await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState?.()
      return authStore?.isAuthenticated
    })

    expect(isAuthenticated).toBe(true)
  })

  test('should clear session from database on logout', async ({ page }) => {
    let sessionClearRequests = 0
    
    await page.route('**/api/session/clear', (route) => {
      sessionClearRequests++
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })

    await page.route('**/api/zoho/disconnect', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/dashboard')
    
    // Simulate logout
    await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState?.()
      if (authStore) {
        authStore.logout()
      }
    })

    await page.waitForTimeout(1000)

    // Verify session was cleared from database
    expect(sessionClearRequests).toBeGreaterThan(0)

    // Verify user is not authenticated after logout
    const isAuthenticated = await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState?.()
      return authStore?.isAuthenticated
    })

    expect(isAuthenticated).toBe(false)
  })

  test('should handle session expiry calculation from JWT', async ({ page }) => {
    await page.goto('/login')
    
    // Create a token with specific expiry time
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const tokenWithExpiry = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsInJlZ2lvbiI6InVzLWVhc3QtMSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjpbImFkbWluIl0sImV4cCI6${futureExpiry}LCJpYXQiOjE3MDc1NTc2NDN9.fake-signature`

    await page.evaluate((token) => {
      const authStore = (window as any).useAuthStore?.getState?.()
      if (authStore) {
        authStore.handleLoginSuccess(token)
      }
    }, tokenWithExpiry)

    await page.waitForTimeout(1000)

    // Verify session expiry is calculated correctly
    const sessionExpiry = await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState?.()
      return authStore?.sessionExpiry
    })

    const expectedExpiry = new Date(futureExpiry * 1000)
    const actualExpiry = new Date(sessionExpiry)
    
    expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(1000)
  })

  test('should sync authentication state to database', async ({ page }) => {
    let stateSyncRequests = 0
    
    await page.route('**/api/state/update', (route) => {
      stateSyncRequests++
      const request = route.request()
      const postData = JSON.parse(request.postData() || '{}')
      
      expect(postData.auth).toBeDefined()
      expect(postData.auth.isAuthenticated).toBeDefined()
      expect(postData.auth.userId).toBeDefined()
      
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/login')
    
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6IjEyMyIsInJlZ2lvbiI6InVzLWVhc3QtMSIsIm5hbWUiOiJKb2huIERvZSIsInJvbGVzIjpbImFkbWluIl0sImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzA3NTU3NjQzfQ.fake-signature'

    await page.evaluate((token) => {
      const authStore = (window as any).useAuthStore?.getState?.()
      if (authStore) {
        authStore.handleLoginSuccess(token)
      }
    }, testToken)

    await page.waitForTimeout(1000)

    // Verify state was synced to database
    expect(stateSyncRequests).toBeGreaterThan(0)
  })
})
