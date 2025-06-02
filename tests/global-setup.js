// Global setup for Playwright tests
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting Pipeline Pulse Application Tests');
  console.log('📍 Testing against:', 'http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com');
  
  // Verify the application is accessible before running tests
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 Checking application availability...');
    
    // Test basic connectivity
    const response = await page.request.get('http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com/docs');
    
    if (response.status() === 200) {
      console.log('✅ Application is accessible and ready for testing');
    } else {
      console.log(`⚠️  Application returned status ${response.status()}, but continuing with tests`);
    }
    
    // Log application info
    const apiSpec = await page.request.get('http://pipeline-pulse-alb-1144051995.ap-southeast-1.elb.amazonaws.com/openapi.json');
    if (apiSpec.status() === 200) {
      const spec = await apiSpec.json();
      console.log(`📋 API Title: ${spec.info.title}`);
      console.log(`📋 API Version: ${spec.info.version}`);
      console.log(`📋 Available Endpoints: ${Object.keys(spec.paths).length}`);
    }
    
  } catch (error) {
    console.log('⚠️  Could not verify application status:', error.message);
    console.log('🔄 Continuing with tests anyway...');
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('🎯 Starting test execution...\n');
}

module.exports = globalSetup;
