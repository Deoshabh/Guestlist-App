/**
 * Utility for handling mobile-specific compatibility issues
 */

// Check if we're in a mobile environment
export const isMobileDevice = () => {
  try {
    return (
      window.innerWidth <= 768 ||
      'ontouchstart' in window ||
      navigator?.maxTouchPoints > 0
    );
  } catch (error) {
    console.error('Error detecting mobile device:', error);
    return false;
  }
};

// Apply mobile-specific patches
export const applyMobilePatches = () => {
  try {
    // Check if forced desktop view is enabled
    const forceDesktop = localStorage.getItem('forceDesktopView') === 'true';
    if (forceDesktop) {
      console.log('Desktop view forced on mobile device');
      // Add meta viewport tag to force desktop view
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.content = 'width=1024, user-scalable=yes';
      }
      return true;
    }

    // Patch Array.prototype.map for additional safety
    const originalMap = Array.prototype.map;
    Array.prototype.map = function(...args) {
      // Only apply to arrays in mobile context
      if (!this) {
        console.warn('Prevented map() call on null/undefined');
        return [];
      }
      return originalMap.apply(this, args);
    };

    // Add safe access to window objects
    const originalGet = Object.prototype.__lookupGetter__;
    const originalSet = Object.prototype.__lookupSetter__;
    
    // Safe property access
    window.safeAccess = (obj, prop, defaultValue = null) => {
      try {
        if (!obj || typeof obj !== 'object') return defaultValue;
        return obj[prop] !== undefined ? obj[prop] : defaultValue;
      } catch (e) {
        console.warn(`Error accessing ${prop}:`, e);
        return defaultValue;
      }
    };

    // Log successful patching
    console.log('Mobile compatibility patches applied');
    return true;
  } catch (error) {
    console.error('Failed to apply mobile patches:', error);
    return false;
  }
};

// Initialize on import
applyMobilePatches();

export default {
  isMobileDevice,
  applyMobilePatches
};
