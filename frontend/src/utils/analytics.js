/**
 * Simple analytics module that avoids CORS errors
 */

const analytics = {
  initialized: false,
  
  // Initialize analytics - wrapped to prevent any failures
  init: async (trackingId) => {
    try {
      // Never even try to initialize - just use dummy functions
      console.log('Analytics disabled to prevent CORS issues');
      
      // Set up dummy functions
      window.ga = function() {};
      window.gtag = function() {};
      
      return false;
    } catch (error) {
      console.warn('Analytics error:', error);
      return false;
    }
  },
  
  // Dummy tracking functions that do nothing
  pageView: () => {},
  event: () => {},
  optOut: () => {},
  optIn: () => {}
};

export default analytics;
