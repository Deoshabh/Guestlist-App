/**
 * Script to check backend connectivity before starting the app
 * This helps diagnose and fix common development environment issues
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.development');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Define API endpoints to check
const endpoints = [
  { url: 'http://localhost:5000/api/health', name: 'Backend Default (5000)' },
  { url: 'http://localhost:5002/api/health', name: 'Backend Alt (5002)' },
  { url: 'http://localhost:3000/api/health', name: 'Dev Proxy (3000)' }
];

const timeout = 3000; // 3 second timeout

async function checkEndpoint(endpoint) {
  try {
    console.log(`Checking ${endpoint.name}...`);
    const response = await axios.get(endpoint.url, { timeout });
    console.log(`✅ ${endpoint.name}: ${response.status} ${JSON.stringify(response.data)}`);
    return { success: true, endpoint, response };
  } catch (error) {
    console.log(`❌ ${endpoint.name}: ${error.message}`);
    return { success: false, endpoint, error: error.message };
  }
}

async function checkBackendConnectivity() {
  console.log('🔍 Checking backend connectivity...');
  
  const results = await Promise.all(endpoints.map(checkEndpoint));
  const working = results.filter(r => r.success);
  
  if (working.length > 0) {
    console.log('\n✅ Found working backend endpoints:');
    working.forEach(({ endpoint }) => {
      console.log(`- ${endpoint.name}: ${endpoint.url}`);
    });
  } else {
    console.error('\n❌ No backend endpoints are working!');
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the backend server is running');
    console.log('2. Check your CORS configuration in the backend');
    console.log('3. Verify network/firewall settings allow these connections');
    console.log('4. Update .env.development with the correct API_BASE_URL');
  }
  
  console.log('\nYou can modify the frontend to use one of these endpoints by setting:');
  console.log('REACT_APP_API_BASE_URL=http://localhost:XXXX/api in .env.development');
}

checkBackendConnectivity().catch(err => {
  console.error('Error running backend check:', err);
});
