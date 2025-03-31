/**
 * Utility to check API connectivity and manage offline mode
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

/**
 * Check if the API is reachable
 * @returns {Promise<boolean>} True if API is reachable
 */
export const checkApiConnectivity = async () => {
  try {
    // Make a simple request to the API health endpoint
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000  // 5 second timeout
    });
    
    // If we get a successful response, API is online
    if (response.status === 200) {
      // Disable forced offline mode
      localStorage.setItem('forceOfflineMode', 'false');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('API connectivity check failed:', error.message);
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
