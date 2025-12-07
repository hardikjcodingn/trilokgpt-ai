#!/usr/bin/env node

/**
 * API Endpoint Tester
 * Tests TrilokGPT endpoints
 */

import http from 'http';

const tests = [
  {
    name: 'Health Check (No Auth)',
    method: 'GET',
    path: '/health',
    headers: {},
    expectStatus: 200
  },
  {
    name: 'Config Endpoint (No Auth)',
    method: 'GET',
    path: '/config',
    headers: {},
    expectStatus: 200
  },
  {
    name: 'Query without API Key (Should fail)',
    method: 'POST',
    path: '/api/query',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Test' }),
    expectStatus: 401
  },
  {
    name: 'Query with invalid API Key (Should fail)',
    method: 'POST',
    path: '/api/query',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid_key'
    },
    body: JSON.stringify({ query: 'Test' }),
    expectStatus: 403
  },
  {
    name: 'Query with valid API Key (Should work)',
    method: 'POST',
    path: '/api/query',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk_e42818e12f6c097434e86e6c707ad4e14363abc58c2900d86c3ddc6c19cbe'
    },
    body: JSON.stringify({ query: 'Test query' }),
    expectStatus: 200
  }
];

async function runTests() {
  console.log('\n🧪 Testing TrilokGPT API Endpoints...\n');
  console.log('═'.repeat(70));
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const status = await makeRequest(test);
      
      if (status === test.expectStatus) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${status} (expected ${test.expectStatus})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Status: ${status} (expected ${test.expectStatus})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log('═'.repeat(70));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
  }
}

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: test.path,
      method: test.method,
      headers: test.headers,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(res.statusCode));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (test.body) {
      req.write(test.body);
    }
    req.end();
  });
}

runTests().catch(console.error);
