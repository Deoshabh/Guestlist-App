/**
 * Utility functions to improve mobile device compatibility
 * This file consolidates functionality previously split between mobileCompatibility.js and mobileRecovery.js
 */

// Apply runtime patches to fix common mobile-specific issues
export function applyMobilePatches() {
  // Apply Array method protections to prevent common mobile errors
  protectArrayMethods();
  
  // Add touch event safeguards
  enhanceTouchEvents();
  
  // Add swipe gesture protections
  protectSwipeGestures();
  
  // Fix event propagation issues on mobile
  fixEventBubbling();
  
  // Apply recovery patches for common mobile issues
  applyRecoveryPatches();
  
  console.log('Mobile compatibility patches applied');
}

// Protect Array methods from undefined/null errors common on mobile devices
function protectArrayMethods() {
  try {
    // Protect common array methods that cause mobile crashes
    ['map', 'filter', 'forEach', 'find', 'reduce', 'some', 'every'].forEach(method => {
      const original = Array.prototype[method];
      
      if (original && typeof original === 'function') {
        Array.prototype[method] = function(...args) {
          if (this === null || this === undefined) {
            console.warn(`Protected ${method}() call on ${this} - returning safe default`);
            // Return appropriate default value based on method
            if (method === 'map' || method === 'filter') return [];
            if (method === 'find') return undefined;
            if (method === 'some' || method === 'every') return false;
            if (method === 'reduce') throw new TypeError('Reduce of null or undefined not allowed');
            return undefined;
          }
          return original.apply(this, args);
        };
      }
    });
  } catch (error) {
    console.error('Error applying array protections:', error);
  }
}

// Add safeguards for touch events that commonly break in mobile WebViews
function enhanceTouchEvents() {
  try {
    // Intercept and fix problematic touch events
    const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
    
    touchEvents.forEach(eventType => {
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;
      
      // Override addEventListener to add error protection
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === eventType && typeof listener === 'function') {
          // Wrap the listener in a try-catch
          const safeListener = function(event) {
            try {
              return listener.call(this, event);
            } catch (error) {
              console.warn(`Error in touch event (${type}) listener caught:`, error);
              event.preventDefault();
              event.stopPropagation();
            }
          };
          
          // Store reference to original for removal
          if (!listener._safeVersion) {
            listener._safeVersion = safeListener;
          }
          
          return originalAdd.call(this, type, safeListener, options);
        }
        
        return originalAdd.call(this, type, listener, options);
      };
      
      // Override removeEventListener to handle wrapped functions
      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        if (type === eventType && typeof listener === 'function') {
          return originalRemove.call(
            this, 
            type, 
            listener._safeVersion || listener, 
            options
          );
        }
        
        return originalRemove.call(this, type, listener, options);
      };
    });
  } catch (error) {
    console.error('Error enhancing touch events:', error);
  }
}

// Protect swipe gesture handlers from common errors
function protectSwipeGestures() {
  try {
    // Add global error handler for touch events
    window.addEventListener('error', function(event) {
      if (event.error && 
          (event.error.message?.includes('swipe') || 
           event.error.message?.includes('touch') ||
           event.error.message?.includes('drag'))) {
        
        console.warn('Swipe gesture error intercepted:', event.error);
        
        // Add temp fix for swipe errors - cancel all current touches
        const touchend = new Event('touchend', { bubbles: true, cancelable: true });
        document.dispatchEvent(touchend);
        
        // Prevent default action
        event.preventDefault();
      }
    });
  } catch (error) {
    console.error('Error protecting swipe gestures:', error);
  }
}

// Fix event bubbling issues on mobile browsers
function fixEventBubbling() {
  try {
    // Ensure click events properly propagate on iOS
    document.addEventListener('touchend', function(e) {
      // Convert touchend to click for elements with role="button" or actual buttons
      const target = e.target.closest('[role="button"], button, a, input[type="checkbox"], input[type="radio"]');
      
      if (target && !target.disabled) {
        // Get the position of the touch
        const touch = e.changedTouches[0];
        
        // Create a mouse event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          screenX: touch?.screenX || 0,
          screenY: touch?.screenY || 0,
          clientX: touch?.clientX || 0,
          clientY: touch?.clientY || 0
        });
        
        // Dispatch the event conditionally if it looks like we need to
        if (target.tagName === 'INPUT' || window.navigator.userAgent.match(/iPhone|iPad|iPod/)) {
          target.dispatchEvent(clickEvent);
        }
      }
    }, false);
  } catch (error) {
    console.error('Error fixing event bubbling:', error);
  }
}

// Add recovery functionality that was previously in mobileRecovery.js
function applyRecoveryPatches() {
  try {
    // Register global error handler for recoverable mobile errors
    window.__cleanupErrorListeners = function() {
      console.log('Cleaning up problematic event listeners');
      
      const safeListener = () => {};
      ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(type => {
        window.addEventListener(type, safeListener, { capture: true });
      });
    };
    
    // Add recovery function for mobile crashes
    window.attemptRecovery = function() {
      console.log('Attempting auto-recovery for mobile issues');
      
      // Re-apply protections
      protectArrayMethods();
      enhanceTouchEvents();
      
      return true;
    };
  } catch (error) {
    console.error('Error applying recovery patches:', error);
  }
}

// Helper to detect if rendering on a mobile device
export function isMobileDevice() {
  return (
    window.innerWidth <= 768 ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window ||
    /Mobi|Android/i.test(navigator.userAgent)
  );
}

// Helper to check if device is in PWA mode
export function isPWAMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Toggles between mobile and desktop view modes
 * This function allows users to manually override the device detection
 * and force either desktop or mobile layout rendering.
 * 
 * @returns {boolean} - Returns true if desktop view is now enabled, false if mobile view
 */
export function toggleDesktopView() {
  try {
    // Check for conflicting implementations
    const hasRecoveryConflict = window.errorRecoveryInitialized || 
                               (typeof window.attemptRecovery === 'function');
    
    // Log conflicts if found in development mode
    if (process.env.NODE_ENV === 'development' && hasRecoveryConflict) {
      console.warn('Potential conflict: Multiple error recovery implementations detected');
    }
    
    const currentValue = localStorage.getItem('forceDesktopView');
    const newValue = currentValue === 'true' ? null : 'true';
    
    if (newValue) {
      localStorage.setItem('forceDesktopView', newValue);
      console.log('Enabled desktop view mode');
      
      // Clean up potential conflicts
      if (hasRecoveryConflict) {
        try {
          // Remove conflicting event listeners if possible
          if (typeof window.__cleanupErrorListeners === 'function') {
            window.__cleanupErrorListeners();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } else {
      localStorage.removeItem('forceDesktopView');
      console.log('Enabled mobile view mode');
    }
    
    // Reload to apply the changes
    window.location.reload();
    
    return newValue === 'true';
  } catch (error) {
    console.error('Error toggling desktop/mobile view:', error);
    return false;
  }
}

// Check if device is likely a touch device
export const isTouchDevice = () => {
  return ('ontouchstart' in window) || 
    (navigator.maxTouchPoints > 0) || 
    (navigator.msMaxTouchPoints > 0);
};

// Fix for iOS Safari touch event delay
export const fixTouchDelay = () => {
  if (typeof document !== 'undefined') {
    document.addEventListener('touchstart', function() {}, {passive: true});
  }
};

// Apply fixes for mobile compatibility
export const applyMobileFixes = () => {
  // Only apply if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  try {
    // Fix for iOS touch delay
    fixTouchDelay();
    
    // Fix for mobile viewport height issues (iOS Safari address bar)
    fixMobileViewportHeight();
    
    // Fix for double tap zoom on mobile
    fixDoubleTapZoom();
    
    // Fix for swipe gesture handlers
    protectSwipeGestures();
    
    // Fix event bubbling issues on mobile
    fixEventBubbling();
    
    // Add CSS touch-action to improve scrolling
    addTouchActionCSS();
    
    console.log('Applied mobile compatibility fixes');
  } catch (error) {
    console.error('Error applying mobile fixes:', error);
  }
};

// Fix for mobile viewport height issues (iOS Safari address bar)
function fixMobileViewportHeight() {
  try {
    // Fix iOS viewport height issue
    const appHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    window.addEventListener('resize', appHeight);
    window.addEventListener('orientationchange', appHeight);
    appHeight();
  } catch (error) {
    console.error('Error fixing mobile viewport height:', error);
  }
}

// Fix for double tap zoom on mobile
function fixDoubleTapZoom() {
  try {
    // Add CSS for touch-action
    const style = document.createElement('style');
    style.innerHTML = `
      /* Prevent double-tap zoom */
      button, 
      a,
      input[type="button"],
      input[type="submit"],
      input[type="reset"],
      [role="button"],
      .touch-manipulation {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error fixing double tap zoom:', error);
  }
}

// Fix touch action CSS for improved scrolling
function addTouchActionCSS() {
  try {
    // Create a style element
    const style = document.createElement('style');
    style.innerHTML = `
      /* Improvements for touch interactions */
      body {
        -webkit-overflow-scrolling: touch;
      }
      
      .scrollable {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Allow vertical scrolling but prevent horizontal */
      .scroll-y {
        touch-action: pan-y;
        -ms-touch-action: pan-y;
      }
      
      /* Allow horizontal scrolling but prevent vertical */
      .scroll-x {
        touch-action: pan-x;
        -ms-touch-action: pan-x;
      }
      
      /* Improve touch target sizes */
      button,
      .btn,
      [role="button"],
      input[type="checkbox"],
      input[type="radio"],
      input[type="button"],
      input[type="submit"],
      select,
      a {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Safe area insets for newer iOS/Android devices */
      .safe-area-top {
        padding-top: env(safe-area-inset-top);
      }
      
      .safe-area-bottom {
        padding-bottom: env(safe-area-inset-bottom);
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error adding touch action CSS:', error);
  }
}

// Automatically apply mobile fixes when imported
applyMobileFixes();

export default {
  applyMobilePatches,
  isMobileDevice,
  isPWAMode,
  toggleDesktopView,
  // Export recovery functions that might have been used from mobileRecovery.js
  attemptRecovery: window.attemptRecovery,
  cleanupErrorListeners: window.__cleanupErrorListeners,
  isTouchDevice,
  fixTouchDelay,
  applyMobileFixes
};
