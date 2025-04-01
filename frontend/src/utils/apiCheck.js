/**
 * Utility to check API connectivity and manage offline mode
 */
import axios from 'axios';

// Use environment variable with fallback to different ports for dev/prod
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
                    (process.env.NODE_ENV === 'development' ? 
                      'http://localhost:5002/api' : '/api');

const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '5000', 10);

/**
 * Check if the API is reachable
 * @returns {Promise<boolean>} True if API is reachable
 */
export const checkApiConnectivity = async () => {
  try {
    console.log(`Checking API connectivity at: ${API_BASE_URL}/health...`);
    
    // Make a simple request to the API health endpoint
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: API_TIMEOUT,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // If we get a successful response, API is online
    if (response.status === 200) {
      // Disable forced offline mode
      localStorage.setItem('forceOfflineMode', 'false');
      
      // Hide the warning banner
      const warningElement = document.getElementById('cors-warning');
      if (warningElement) {
        warningElement.style.display = 'none';
      }
      
      console.log('✅ API connection successful:', response.data);
      return true;
    }
    
    console.warn('❌ API returned non-200 status:', response.status);
    return false;
  } catch (error) {
    console.warn('❌ API connectivity check failed:', error.message);
    
    // Check if this is a CORS error
    if (error.message.includes('Network Error') || error.message.includes('CORS')) {
      console.error('🔴 CORS error detected - API server may be running but CORS is blocking access');
      
      // Show detailed debugging info in development
      if (process.env.REACT_APP_DEBUG_MODE === 'true') {
        console.info('Debug info:', {
          apiUrl: API_BASE_URL,
          errorType: error.name,
          errorMessage: error.message,
          browserOrigin: window.location.origin
        });
      }
    }
    
    return false;
  }
};

/**
 * Disable forced offline mode
 */
export const disableOfflineMode = () => {
  localStorage.setItem('forceOfflineMode', 'false');
  // Hide the warning if it's visible
  const warningElement = document.getElementById('cors-warning');
  if (warningElement) {
    warningElement.style.display = 'none';
  }
  // Refresh the page to apply changes
  window.location.reload();
};

/**
 * Enable forced offline mode
 */
export const enableOfflineMode = () => {
  localStorage.setItem('forceOfflineMode', 'true');
  // Show the warning if it exists
  const warningElement = document.getElementById('cors-warning');
  if (warningElement) {
    warningElement.style.display = 'block';
  }
};

/**
 * Initialize API check on app startup
 */
export const initApiCheck = () => {
  // Run the check immediately
  checkApiConnectivity().then(isOnline => {
    console.log(`API connectivity check: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
  });
  
  // Add a helper method to the window object for debugging
  window.disableOfflineMode = disableOfflineMode;
  window.enableOfflineMode = enableOfflineMode;
  window.checkApiConnectivity = checkApiConnectivity;
  
  console.info('API check utility initialized. You can use these commands in the console:');
  console.info('- window.disableOfflineMode() - Exit offline mode');
  console.info('- window.enableOfflineMode() - Force offline mode');
  console.info('- window.checkApiConnectivity() - Test API connection');
};

export default {
  checkApiConnectivity,
  disableOfflineMode,
  enableOfflineMode,
  initApiCheck
};
