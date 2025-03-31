/**
 * STUB IMPLEMENTATION - COMPLETELY DISABLED
 * 
 * This is a stub implementation that does absolutely nothing.
 * All analytics functions are no-ops to avoid CORS issues.
 */

console.warn('[STUB] analytics.js has been completely disabled to prevent CORS issues.');

// Disable analytics entirely
const analytics = {
  init: async () => Promise.resolve(false),
  pageView: () => {},
  event: () => {},
  optOut: () => {},
  optIn: () => {},
  isBlocked: () => true,
  isEnabled: () => false,
  isInitialized: () => false
};

export default analytics;
