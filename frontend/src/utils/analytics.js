/**
 * STUB IMPLEMENTATION
 * 
 * This is a minimal stub for the analytics module.
 * It provides basic implementations that don't depend on external services.
 * 
 * TODO: This file should eventually be properly implemented with actual analytics functionality.
 */

console.warn('[STUB] analytics.js is a stub implementation. Replace with proper implementation.');

let isInitialized = false;
let isEnabled = false;
let isBlocked = false;

/**
 * Initialize analytics
 * @param {string} id - Analytics ID
 * @returns {Promise<boolean>} Promise that resolves to whether initialization was successful
 */
const init = async (id = 'G-03XW3FWG7L') => {
  console.warn('[STUB] analytics.init called with ID:', id);
  
  // Check if analytics might be blocked
  try {
    const testImg = document.createElement('img');
    testImg.src = 'https://www.google-analytics.com/collect?v=1&t=event&tid=UA-TEST&cid=555&ec=test&ea=test';
    testImg.style.display = 'none';
    document.body.appendChild(testImg);
    
    testImg.onerror = () => {
      isBlocked = true;
      console.warn('Analytics appears to be blocked by the browser or an extension');
    };
    
    setTimeout(() => {
      if (testImg.parentNode) {
        document.body.removeChild(testImg);
      }
    }, 500);
  } catch (e) {
    // Ignore errors in the detection
  }
  
  // In a real implementation, this would load the analytics script
  isInitialized = true;
  isEnabled = true;
  
  return Promise.resolve(true);
};

/**
 * Track a page view
 * @param {string} path - Page path
 * @param {string} title - Page title
 */
const pageView = (path, title) => {
  if (!isInitialized || isBlocked) return;
  console.warn(`[STUB] analytics.pageView: ${title} (${path})`);
};

/**
 * Track an event
 * @param {string} category - Event category
 * @param {string} action - Event action
 * @param {string} label - Event label
 * @param {number} value - Event value
 */
const event = (category, action, label, value) => {
  if (!isInitialized || isBlocked) return;
  console.warn(`[STUB] analytics.event: ${category} / ${action} / ${label} ${value ? `/ ${value}` : ''}`);
};

/**
 * Opt in to analytics
 */
const optIn = () => {
  isEnabled = true;
  console.warn('[STUB] User opted in to analytics');
  
  // In a real implementation, this would set a cookie or local storage value
  try {
    localStorage.removeItem('analytics_opt_out');
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Opt out of analytics
 */
const optOut = () => {
  isEnabled = false;
  console.warn('[STUB] User opted out of analytics');
  
  // In a real implementation, this would set a cookie or local storage value
  try {
    localStorage.setItem('analytics_opt_out', 'true');
  } catch (e) {
    // Ignore storage errors
  }
};

// Export analytics functions
const analytics = {
  init,
  pageView,
  event,
  optOut,
  optIn,
  isBlocked: () => isBlocked,
  isEnabled: () => isEnabled && !isBlocked,
  isInitialized: () => isInitialized
};

export default analytics;
