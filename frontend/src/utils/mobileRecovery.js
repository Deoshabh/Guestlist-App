/**
 * Mobile Recovery Utility
 * Handles mobile-specific error detection and recovery
 */

// Track errors to prevent infinite loops
let errorCount = 0;
const ERROR_THRESHOLD = 3;
const RECOVERY_KEY = 'mobileRecoveryAttempted';

/**
 * Monitors for common mobile errors and provides recovery options
 */
export const monitorMobileErrors = () => {
  // Only apply on mobile devices
  if (window.innerWidth > 768) return;

  // Check if we're in a recovery cycle
  if (sessionStorage.getItem(RECOVERY_KEY) === 'true') {
    console.log('Recovery mode active, applying enhanced protections');
    applyEnhancedProtections();
  }

  // Monitor for Array operation errors
  window.addEventListener('error', (event) => {
    if (!event.error) return;

    const errorMessage = event.error.toString().toLowerCase();
    
    // Detect common mobile errors
    const isMapError = errorMessage.includes('map') || 
                        errorMessage.includes('undefined is not an object') ||
                        errorMessage.includes('null is not an object');
                        
    const isRenderError = errorMessage.includes('render') || 
                          errorMessage.includes('react');
                          
    // Track and respond to errors
    if (isMapError || isRenderError) {
      errorCount++;
      console.warn(`Mobile error detected (${errorCount}/${ERROR_THRESHOLD}):`, errorMessage);
      
      // If we hit the threshold, try recovery
      if (errorCount >= ERROR_THRESHOLD) {
        initiateRecovery();
      }
    }
  });
};

/**
 * Apply enhanced protections for mobile devices
 */
const applyEnhancedProtections = () => {
  // Patch Array functions
  const safeArrayFunctions = ['map', 'forEach', 'filter', 'reduce', 'find'];
  
  safeArrayFunctions.forEach(funcName => {
    const original = Array.prototype[funcName];
    Array.prototype[funcName] = function(...args) {
      if (!this) {
        console.warn(`Prevented ${funcName}() call on null/undefined`);
        return funcName === 'map' || funcName === 'filter' ? [] : undefined;
      }
      return original.apply(this, args);
    };
  });
  
  // Patch rendering functions
  if (typeof window.requestAnimationFrame === 'function') {
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return originalRAF.call(window, function() {
        try {
          return callback.apply(this, arguments);
        } catch (error) {
          console.error('Error in requestAnimationFrame:', error);
          return null;
        }
      });
    };
  }
  
  console.log('Enhanced mobile protections applied');
};

/**
 * Initiate recovery process for persistent mobile errors
 */
const initiateRecovery = () => {
  // Mark that recovery has been attempted
  sessionStorage.setItem(RECOVERY_KEY, 'true');
  
  // Check if desktop view is already forced
  const isDesktopForced = localStorage.getItem('forceDesktopView') === 'true';
  
  if (!isDesktopForced) {
    console.log('Attempting mobile recovery by switching to desktop view');
    localStorage.setItem('forceDesktopView', 'true');
  }
  
  // Add a small delay before reload to ensure storage is set
  setTimeout(() => {
    window.location.reload();
  }, 300);
};

export default { monitorMobileErrors };
