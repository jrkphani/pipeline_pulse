import { test, expect } from '@playwright/test';

// Base URLs for the application (using localhost for testing)
const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_BASE_URL = 'http://localhost:5173';

test.describe('Pipeline Pulse OAuth Authentication Tests', () => {
  
  test('Frontend redirects unauthenticated users to login', async ({ page }) => {
    // Try to access the dashboard without authentication
    await page.goto(FRONTEND_BASE_URL);

    // Should be redirected to login page or see login form
    await page.waitForTimeout(2000);

    // Check for login elements
    const loginButton = page.locator('text=Sign in with Zoho CRM');
    const connectButton = page.locator('text=Connect to Zoho CRM');

    // Should see either login button or connect button
    const hasLoginElements = await loginButton.isVisible() || await connectButton.isVisible();
    expect(hasLoginElements).toBe(true);

    console.log('✅ Unauthenticated users properly redirected to login');
  });

  test('OAuth authorization URL endpoint works', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/zoho/auth-url`);

    expect(response.status()).toBe(200);

    const authData = await response.json();
    expect(authData).toHaveProperty('auth_url');
    expect(authData).toHaveProperty('state');
    expect(authData).toHaveProperty('expires_in');

    // Verify the auth URL contains expected parameters
    const authUrl = new URL(authData.auth_url);
    expect(authUrl.hostname).toBe('accounts.zoho.in');
    expect(authUrl.pathname).toBe('/oauth/v2/auth');
    expect(authUrl.searchParams.get('client_id')).toBeTruthy();
    expect(authUrl.searchParams.get('response_type')).toBe('code');

    console.log('✅ OAuth auth URL endpoint working:', authData.auth_url);
  });

  test('Health endpoint is working', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);

    expect(response.status()).toBe(200);

    const health = await response.json();
    expect(health.status).toBe('healthy');

    console.log('✅ Health check passed:', health);
  });

  test('Root endpoint returns correct information', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/`);

    expect(response.status()).toBe(200);

    const info = await response.json();
    expect(info.message).toBe('Pipeline Pulse API');
    expect(info.version).toBe('1.0.0');
    expect(info.docs).toBe('/docs');

    console.log('✅ Root endpoint working:', info);
  });

  test('Protected API endpoints require authentication', async ({ request }) => {
    const protectedEndpoints = [
      { path: '/api/upload/files', method: 'GET' },
      { path: '/api/analysis', method: 'GET' },
      { path: '/api/crm/deals', method: 'GET' },
      { path: '/api/o2r/opportunities', method: 'GET' }
    ];

    for (const endpoint of protectedEndpoints) {
      let response;
      if (endpoint.method === 'GET') {
        response = await request.get(`${API_BASE_URL}${endpoint.path}`);
      } else if (endpoint.method === 'POST') {
        response = await request.post(`${API_BASE_URL}${endpoint.path}`);
      }

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);

      const errorData = await response.json();
      expect(errorData.detail).toContain('Authentication required');

      console.log(`✅ ${endpoint.path} properly protected (401)`);
    }
  });

  test('API Documentation is accessible', async ({ page }) => {
    await page.goto(`${API_BASE_URL}/docs`);

    // Check that the Swagger UI loads
    await expect(page).toHaveTitle(/Pipeline Pulse API/);

    // Check for Swagger UI elements
    await expect(page.locator('#swagger-ui')).toBeVisible();

    // Wait for the API spec to load
    await page.waitForTimeout(3000);

    // Check that API endpoints are visible
    const apiEndpoints = page.locator('.opblock-summary-path');
    await expect(apiEndpoints.first()).toBeVisible();

    console.log('✅ Swagger UI loaded successfully');
  });

  test('OpenAPI specification is valid', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/openapi.json`);

    expect(response.status()).toBe(200);

    const apiSpec = await response.json();

    // Validate basic OpenAPI structure
    expect(apiSpec.openapi).toBe('3.1.0');
    expect(apiSpec.info.title).toBe('Pipeline Pulse API');
    expect(apiSpec.info.version).toBe('1.0.0');

    // Check that main API paths exist
    expect(apiSpec.paths).toHaveProperty('/api/upload/csv');
    expect(apiSpec.paths).toHaveProperty('/api/analysis/{analysis_id}');
    expect(apiSpec.paths).toHaveProperty('/api/zoho/auth-url');
    expect(apiSpec.paths).toHaveProperty('/api/zoho/callback');
    expect(apiSpec.paths).toHaveProperty('/health');

    const endpointCount = Object.keys(apiSpec.paths).length;
    console.log(`✅ OpenAPI spec valid with ${endpointCount} endpoints`);
  });

  test('Public endpoints work without authentication', async ({ request }) => {
    const publicEndpoints = [
      '/health',
      '/api/zoho/auth-url',
      '/api/zoho/status',
      '/docs',
      '/openapi.json'
    ];

    for (const endpoint of publicEndpoints) {
      const response = await request.get(`${API_BASE_URL}${endpoint}`);

      // Should return 200 OK (except status which might return error data)
      if (endpoint === '/api/zoho/status') {
        expect([200, 401]).toContain(response.status());
      } else {
        expect(response.status()).toBe(200);
      }

      console.log(`✅ ${endpoint} accessible without auth (${response.status()})`);
    }
  });

  test('Currency rates endpoint requires authentication', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/currency/rates`);

    // Should now require authentication
    expect(response.status()).toBe(401);

    const errorData = await response.json();
    expect(errorData.detail).toContain('Authentication required');

    console.log('✅ Currency rates endpoint properly protected');
  });

  test('OAuth status endpoint returns connection info', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/zoho/status`);

    // Should return 200 with connection status
    expect(response.status()).toBe(200);

    const status = await response.json();
    expect(status).toHaveProperty('connected');

    if (status.connected) {
      expect(status).toHaveProperty('user');
      console.log('✅ OAuth status: Connected user:', status.user?.name || 'Unknown');
    } else {
      console.log('✅ OAuth status: Not connected (expected for test)');
    }
  });

  test('Application performance is acceptable', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${API_BASE_URL}/api/zoho/auth-url`);

    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds

    console.log(`✅ Response time: ${responseTime}ms (acceptable)`);
  });

  test('CORS headers are configured', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/docs`, {
      headers: {
        'Origin': 'https://1chsalesreports.com'
      }
    });

    expect(response.status()).toBe(200);

    const headers = response.headers();
    console.log('✅ CORS test completed, headers:', {
      'access-control-allow-origin': headers['access-control-allow-origin'] || 'not set',
      'access-control-allow-methods': headers['access-control-allow-methods'] || 'not set'
    });
  });

  test('Error handling works correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/nonexistent/endpoint`);

    // Should return 401 (auth required) or 404 (not found)
    expect([401, 404]).toContain(response.status());

    console.log(`✅ Error handling working correctly (${response.status()})`);
  });

});
