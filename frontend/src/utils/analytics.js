/**
 * Simple analytics wrapper that gracefully handles being blocked
 */

// Default empty functions to prevent errors
const noopFn = () => {};

const analytics = {
  initialized: false,
  
  /**
   * Initialize analytics with the given tracking ID
   * @param {string} trackingId - Google Analytics tracking ID
   */
  init: async (trackingId) => {
    try {
      // Check if the user has opted out
      if (localStorage.getItem('analytics_opt_out') === 'true') {
        console.log('Analytics: User opted out');
        return false;
      }
      
      // Don't initialize if already initialized
      if (analytics.initialized) {
        return true;
      }
      
      // Set up dummy functions to prevent errors
      window.ga = window.ga || noopFn;
      window.gtag = window.gtag || noopFn;
      
      // Create a test request to see if analytics is blocked
      const testRequest = await fetch('https://www.google-analytics.com/collect?v=1&t=event&tid=UA-TEST&cid=555&ec=test&ea=test', { 
        mode: 'no-cors',
        method: 'GET'
      }).catch(() => null);
      
      // If the test request succeeded, try to load the real analytics
      if (testRequest) {
        analytics.initialized = true;
        console.log('Analytics initialized with ID:', trackingId);
        return true;
      } else {
        console.log('Analytics: Looks like requests are being blocked');
        return false;
      }
    } catch (error) {
      console.warn('Error initializing analytics:', error);
      return false;
    }
  },
  
  /**
   * Track a page view
   * @param {string} page - Page path to record
   */
  pageView: (page) => {
    try {
      if (!analytics.initialized) return;
      
      // If analytics is loaded, track page view
      if (typeof window.gtag === 'function') {
        window.gtag('config', 'G-03XW3FWG7L', {
          page_path: page
        });
      }
    } catch (error) {
      console.warn('Error tracking page view:', error);
    }
  },
  
  /**
   * Track an event
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {string} label - Event label (optional)
   * @param {number} value - Event value (optional)
   */
  event: (category, action, label = null, value = null) => {
    try {
      if (!analytics.initialized) return;
      
      // If analytics is loaded, track event
      if (typeof window.gtag === 'function') {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        });
      }
    } catch (error) {
      console.warn('Error tracking event:', error);
    }
  },
  
  /**
   * Opt out of analytics
   */
  optOut: () => {
    localStorage.setItem('analytics_opt_out', 'true');
    console.log('User opted out of analytics');
  },
  
  /**
   * Opt back into analytics
   */
  optIn: () => {
    localStorage.removeItem('analytics_opt_out');
    console.log('User opted into analytics');
  }
};

export default analytics;
