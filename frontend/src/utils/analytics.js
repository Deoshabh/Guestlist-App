/**
 * Google Analytics utility with error handling
 */

// Safe wrapper for Google Analytics
const analytics = {
  // Initialize analytics safely
  init: () => {
    try {
      if (window.ga === undefined) {
        console.log('Analytics: Loading Google Analytics script');
        
        // Load GA script dynamically
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.google-analytics.com/analytics.js';
        script.onerror = () => console.log('Analytics: Script failed to load (might be blocked)');
        
        document.head.appendChild(script);
        
        window.ga = function() {
          (window.ga.q = window.ga.q || []).push(arguments);
        };
        window.ga.l = +new Date();
      }
    } catch (error) {
      console.log('Analytics: Failed to initialize');
    }
  },

  // Send pageview event safely
  pageview: (path) => {
    try {
      if (window.ga) {
        window.ga('send', 'pageview', path);
      }
    } catch (error) {
      console.log('Analytics: Failed to send pageview');
    }
  },

  // Send event safely
  event: (category, action, label = null, value = null) => {
    try {
      if (window.ga) {
        const params = {
          eventCategory: category,
          eventAction: action,
        };
        
        if (label) params.eventLabel = label;
        if (value) params.eventValue = value;
        
        window.ga('send', 'event', params);
      }
    } catch (error) {
      console.log('Analytics: Failed to send event');
    }
  }
};

export default analytics;
