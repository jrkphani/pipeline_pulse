/**
 * Frontend Testing Script for Pipeline Pulse
 * 
 * This script tests the key functionality of the frontend application
 * Run with: node test-frontend.js
 */

const API_BASE = 'http://localhost:8000/api';
const FRONTEND_BASE = 'http://localhost:5173';

// Test utilities
async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testFrontend(path) {
  try {
    const response = await fetch(`${FRONTEND_BASE}${path}`);
    return {
      success: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test cases
async function runTests() {
  console.log('🧪 Starting Frontend Tests for Pipeline Pulse\n');
  
  const tests = [
    {
      name: 'Frontend Homepage',
      test: () => testFrontend('/'),
      expected: { success: true, status: 200 }
    },
    {
      name: 'Frontend Upload Page',
      test: () => testFrontend('/upload'),
      expected: { success: true, status: 200 }
    },
    {
      name: 'API Health Check',
      test: () => testAPI('/upload/files'),
      expected: { success: true, status: 200 }
    },
    {
      name: 'Get Latest Analysis',
      test: () => testAPI('/upload/latest'),
      expected: { success: true, status: 200 }
    },
    {
      name: 'Get Analysis Data',
      test: () => testAPI('/upload/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49'),
      expected: { success: true, status: 200 }
    },
    {
      name: 'Frontend Analysis Page',
      test: () => testFrontend('/analysis/8a8f72da-dc23-474e-af99-5c5b465b0d49'),
      expected: { success: true, status: 200 }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of tests) {
    try {
      console.log(`Testing: ${testCase.name}...`);
      const result = await testCase.test();
      
      if (result.success && result.status === testCase.expected.status) {
        console.log(`✅ ${testCase.name} - PASSED`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name} - FAILED`);
        console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`   Got: ${JSON.stringify(result)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Frontend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
  }
}

// Run the tests
runTests().catch(console.error);
