/**
 * Analytics module with fallback for when GA is blocked
 */

// Check if analytics is blocked by ad blockers
const checkAnalyticsBlocked = () => {
  return new Promise((resolve) => {
    // Create a test script element
    const testScript = document.createElement('script');
    testScript.src = 'https://www.google-analytics.com/analytics.js';
    testScript.onload = () => resolve(false); // Not blocked
    testScript.onerror = () => resolve(true); // Blocked
    
    // Add a timeout in case the event handlers don't fire
    setTimeout(() => resolve(true), 1000);
    
    // Append the script to the document
    document.head.appendChild(testScript);
    
    // Remove the script after test
    setTimeout(() => {
      if (document.head.contains(testScript)) {
        document.head.removeChild(testScript);
      }
    }, 1500);
  });
};

// Initialize analytics
const isEnabled = (() => {
  try {
    // Check if analytics is explicitly disabled
    if (localStorage.getItem('analytics_opt_out') === 'true') {
      console.log('Analytics: Disabled by user preference');
      return false;
    }
    
    // Respect Do Not Track setting
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      console.log('Analytics: Respecting Do Not Track setting');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Analytics: Error during initialization check', error);
    return false;
  }
})();

// Placeholder for tracking status
let isBlocked = false;
let isInitialized = false;

// Initialize Google Analytics with error handling
const initialize = async (trackingId) => {
  if (!isEnabled) return false;
  
  try {
    // Check if analytics is blocked
    isBlocked = await checkAnalyticsBlocked();
    
    if (isBlocked) {
      console.log('Analytics: Blocked by browser or extension');
      return false;
    }
    
    // Only load GA if it's not blocked
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', trackingId, {
      'send_page_view': false,
      'anonymize_ip': true
    });
    
    // Dynamically load the GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);
    
    isInitialized = true;
    return true;
  } catch (error) {
    console.warn('Analytics: Failed to initialize', error);
    isBlocked = true;
    return false;
  }
};

// Safely track page views
const pageView = (path) => {
  if (!isEnabled || isBlocked || !isInitialized) return;
  
  try {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path
      });
    }
  } catch (error) {
    console.warn('Analytics: Error tracking page view', error);
  }
};

// Safely track events
const event = (category, action, label, value) => {
  if (!isEnabled || isBlocked || !isInitialized) return;
  
  try {
    if (window.gtag) {
      window.gtag('event', action, {
        'event_category': category,
        'event_label': label,
        'value': value
      });
    }
  } catch (error) {
    console.warn('Analytics: Error tracking event', error);
  }
};

// Allow users to opt out
const optOut = () => {
  try {
    localStorage.setItem('analytics_opt_out', 'true');
    console.log('Analytics: User opted out');
  } catch (error) {
    console.warn('Analytics: Error setting opt-out', error);
  }
};

// Allow users to opt in
const optIn = () => {
  try {
    localStorage.removeItem('analytics_opt_out');
    console.log('Analytics: User opted in');
  } catch (error) {
    console.warn('Analytics: Error setting opt-in', error);
  }
};

export default {
  initialize,
  pageView,
  event,
  optOut,
  optIn,
  isBlocked: () => isBlocked,
  isEnabled: () => isEnabled && !isBlocked && isInitialized
};
