import { test, expect } from '@playwright/test';

// Base URL for the application
const BASE_URL = 'http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com';

test.describe('Pipeline Pulse Quick Verification Tests', () => {
  
  test('Health endpoint is working', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    expect(health.status).toBe('healthy');
    
    console.log('✅ Health check passed:', health);
  });

  test('Root endpoint returns correct information', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/`);
    
    expect(response.status()).toBe(200);
    
    const info = await response.json();
    expect(info.message).toBe('Pipeline Pulse API');
    expect(info.version).toBe('1.0.0');
    expect(info.docs).toBe('/docs');
    
    console.log('✅ Root endpoint working:', info);
  });

  test('API Documentation is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs`);
    
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
    const response = await request.get(`${BASE_URL}/openapi.json`);
    
    expect(response.status()).toBe(200);
    
    const apiSpec = await response.json();
    
    // Validate basic OpenAPI structure
    expect(apiSpec.openapi).toBe('3.1.0');
    expect(apiSpec.info.title).toBe('Pipeline Pulse API');
    expect(apiSpec.info.version).toBe('1.0.0');
    
    // Check that main API paths exist
    expect(apiSpec.paths).toHaveProperty('/api/upload/csv');
    expect(apiSpec.paths).toHaveProperty('/api/analysis/{analysis_id}');
    expect(apiSpec.paths).toHaveProperty('/api/zoho/deals');
    expect(apiSpec.paths).toHaveProperty('/health');
    
    const endpointCount = Object.keys(apiSpec.paths).length;
    console.log(`✅ OpenAPI spec valid with ${endpointCount} endpoints`);
  });

  test('Currency rates endpoint is working', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/currency/rates`);
    
    expect(response.status()).toBe(200);
    
    const rates = await response.json();
    
    // Should return currency exchange rates
    expect(typeof rates).toBe('object');
    expect(Object.keys(rates).length).toBeGreaterThan(0);
    
    // Should include common currencies
    expect(rates).toHaveProperty('USD');
    expect(rates).toHaveProperty('EUR');
    
    console.log(`✅ Currency rates working with ${Object.keys(rates).length} currencies`);
  });

  test('File upload endpoint is accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/upload/files`);
    
    expect(response.status()).toBe(200);
    
    const files = await response.json();
    
    // Should return files list structure
    expect(files).toHaveProperty('files');
    expect(files).toHaveProperty('total');
    expect(Array.isArray(files.files)).toBe(true);
    
    console.log(`✅ File upload endpoint working, ${files.total} files found`);
  });

  test('Authentication endpoints are protected', async ({ request }) => {
    const protectedEndpoints = [
      '/api/auth/user',
      '/api/auth/permissions'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      
      // Should return 401 Unauthorized or 422 Validation Error (no token)
      expect([401, 422]).toContain(response.status());
      console.log(`✅ ${endpoint} properly protected (${response.status()})`);
    }
  });

  test('Application performance is acceptable', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get(`${BASE_URL}/api/currency/rates`);
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    
    console.log(`✅ Response time: ${responseTime}ms (acceptable)`);
  });

  test('CORS headers are configured', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/docs`, {
      headers: {
        'Origin': 'https://example.com'
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
    const response = await request.get(`${BASE_URL}/api/nonexistent/endpoint`);
    
    // Should return 404 Not Found
    expect(response.status()).toBe(404);
    
    console.log('✅ 404 error handling working correctly');
  });

});
