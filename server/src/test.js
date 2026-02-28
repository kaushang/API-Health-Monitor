const assert = require('assert');
const request = require('supertest');
const app = require('./index'); // Import the app without starting it

async function runTests() {
  console.log('Running test: GET / health check endpoint');
  
  try {
    const res = await request(app).get('/');
    
    // Assert 200 OK status
    assert.strictEqual(res.statusCode, 200, 'Expected status code 200');
    
    // Assert JSON response { status: "ok" }
    assert.deepStrictEqual(res.body, { status: 'ok' }, 'Expected body to equal { status: "ok" }');
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
