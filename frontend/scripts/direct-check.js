/**
 * Standalone script to check backend connectivity
 * This doesn't require any dependencies and can be run directly with Node.js
 */
const http = require('http');
const https = require('https');

console.log('🔍 Direct API connectivity check - No dependencies required');

// Define endpoints to check
const endpoints = [
  { url: 'http://localhost:5000/api/health', name: 'Backend Default (5000)' },
  { url: 'http://localhost:5002/api/health', name: 'Backend Alt (5002)' },
  { url: 'http://localhost:3000/api/health', name: 'Dev Proxy (3000)' }
];

// Simple HTTP request function using native Node.js modules
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const requestOptions = new URL(url);
    
    const req = client.get(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Try to parse as JSON, but fallback to string if it fails
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = data;
          }
          
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          reject(new Error(`Error parsing response: ${e.message}`));
        }
      });
    });
    
    // Set a timeout of 3 seconds
    req.setTimeout(3000, () => {
      req.abort();
      reject(new Error('Request timed out'));
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Check each endpoint
async function checkEndpoints() {
  console.log('Testing API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nChecking ${endpoint.name} (${endpoint.url})...`);
      const response = await makeRequest(endpoint.url);
      console.log(`✅ ${endpoint.name}: Status ${response.statusCode}`);
      console.log(`Response: ${typeof response.data === 'object' ? JSON.stringify(response.data) : response.data}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Check complete!');
  console.log('\nIf some endpoints are available, update your .env.development file with:');
  console.log('REACT_APP_API_BASE_URL=http://localhost:XXXX/api');
  console.log('where XXXX is the port of the working endpoint.');
}

// Run the check
checkEndpoints().catch(error => {
  console.error('Error in connectivity check:', error);
});

console.log('\n💡 If you still see connectivity issues in the browser:');
console.log('1. Open browser console (F12)');
console.log('2. Run this command: localStorage.setItem("forceOfflineMode", "false")');
console.log('3. Refresh the page');
