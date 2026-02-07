/*
 * @Author: Lalit Bagga 
 * @Date: 2026-02-07 11:17:55 
 * @Last Modified by: Lalit Bagga
 * @Last Modified time: 2026-02-07 11:20:48
 */

const handler = require('./index').handler;

async function runTests() {
  console.log('🧪 Testing Lambda function locally...\n');

  // Test 1: GET all products
  console.log('Test 1: GET /products');
  const test1 = await handler({
    httpMethod: 'GET',
    pathParameters: null,
    body: null
  });
  console.log('Response:', JSON.parse(test1.body));
  console.log('---\n');

  // Test 2: GET single product
  console.log('Test 2: GET /products/prod_001');
  const test2 = await handler({
    httpMethod: 'GET',
    pathParameters: { id: 'prod_001' },
    body: null
  });
  console.log('Response:', JSON.parse(test2.body));
  console.log('---\n');

  // Test 3: CREATE product
  console.log('Test 3: POST /products');
  const test3 = await handler({
    httpMethod: 'POST',
    pathParameters: null,
    body: JSON.stringify({
      name: 'Apple Watch Ultra',
      price: 899.99,
      stock: 25,
      category: 'Electronics',
      description: 'Titanium case, GPS + Cellular'
    })
  });
  console.log('Response:', JSON.parse(test3.body));
  console.log('---\n');

  // Test 4: GET product that doesn't exist
  console.log('Test 4: GET /products/invalid_id (should fail)');
  const test4 = await handler({
    httpMethod: 'GET',
    pathParameters: { id: 'invalid_id' },
    body: null
  });
  console.log('Response:', JSON.parse(test4.body));
  console.log('---\n');

  console.log('✅ All tests completed!');
}

runTests().catch(console.error);