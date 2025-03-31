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
        viewport.content = 'width=1024, initial-scale=0.9, user-scalable=yes';
      }
      
      // Add explicit body styles for desktop view
      document.body.classList.add('forced-desktop-view');
      const style = document.createElement('style');
      style.textContent = `
        .forced-desktop-view {
          min-width: 1024px;
          overflow-x: auto;
          touch-action: pan-x pan-y;
        }
        @media (max-width: 768px) {
          .forced-desktop-view {
            zoom: 0.9;
          }
        }
      `;
      document.head.appendChild(style);
      
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
    
    // Add other safe array operations
    ['filter', 'forEach', 'find', 'some', 'every'].forEach(method => {
      const original = Array.prototype[method];
      Array.prototype[method] = function(...args) {
        if (!this) {
          console.warn(`Prevented ${method}() call on null/undefined`);
          return method === 'filter' ? [] : 
                 method === 'find' ? undefined :
                 method === 'some' || method === 'every' ? false : undefined;
        }
        return original.apply(this, args);
      };
    });

    // Improve touch event handling
    if (typeof EventTarget !== 'undefined') {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (!this) return;
        
        if (type.startsWith('touch')) {
          // Wrap touch event listeners in try-catch
          const wrappedListener = function(event) {
            try {
              return listener.call(this, event);
            } catch (error) {
              console.error(`Error in ${type} event handler:`, error);
              // Prevent further propagation if there's an error
              event.stopPropagation();
              event.preventDefault();
            }
          };
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        
        return originalAddEventListener.call(this, type, listener, options);
      };
    }

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

// Create a toggle function to easily switch between views
export const toggleDesktopView = () => {
  const currentValue = localStorage.getItem('forceDesktopView');
  const newValue = currentValue === 'true' ? null : 'true';
  
  if (newValue) {
    localStorage.setItem('forceDesktopView', newValue);
  } else {
    localStorage.removeItem('forceDesktopView');
  }
  
  // Reload to apply changes
  window.location.reload();
  
  return newValue === 'true';
};

// Initialize on import
applyMobilePatches();

export default {
  isMobileDevice,
  applyMobilePatches,
  toggleDesktopView
};
