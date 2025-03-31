/**
 * Utility functions to improve mobile device compatibility
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
        if (touchEvents.includes(type) && typeof listener === 'function') {
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
        if (touchEvents.includes(type) && typeof listener === 'function') {
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
    const currentValue = localStorage.getItem('forceDesktopView');
    const newValue = currentValue === 'true' ? null : 'true';
    
    if (newValue) {
      localStorage.setItem('forceDesktopView', newValue);
      console.log('Enabled desktop view mode');
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

export default {
  applyMobilePatches,
  isMobileDevice,
  isPWAMode,
  toggleDesktopView
};
