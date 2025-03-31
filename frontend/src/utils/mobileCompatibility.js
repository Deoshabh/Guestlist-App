/**
 * Utility for handling mobile-specific compatibility issues
 */

// Check if we're in a mobile environment
export const isMobileDevice = () => {
  try {
    return (
      window.innerWidth <= 768 ||
      'ontouchstart' in window ||
      (navigator && navigator.maxTouchPoints > 0)
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
        // Use a fixed width but allow zooming for accessibility
        viewport.content = 'width=1024, initial-scale=0.8, maximum-scale=3.0, user-scalable=yes';
      }
      
      // Add explicit body styles for desktop view
      document.body.classList.add('forced-desktop-view');
      
      // Check if style already exists to prevent duplicates
      let styleElement = document.getElementById('desktop-mode-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'desktop-mode-styles';
        styleElement.textContent = `
          .forced-desktop-view {
            min-width: 1024px;
            overflow-x: auto;
            touch-action: pan-x pan-y;
          }
          @media (max-width: 768px) {
            .forced-desktop-view {
              transform: scale(0.9);
              transform-origin: top left;
            }
            /* Ensure buttons and links are clickable */
            button, a {
              touch-action: manipulation;
            }
            /* Improve focus styles for keyboard users */
            :focus {
              outline: 2px solid #3b82f6 !important;
            }
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      // Fix scroll behavior
      document.documentElement.style.overscrollBehavior = 'none';
      
      return true;
    }

    // Fix array methods for mobile
    fixArrayMethods();
    
    // Fix event handlers
    fixEventHandlers();
    
    // Fix dom methods
    fixDomMethods();
    
    // Apply additional mobile optimizations
    applyMobileOptimizations();

    // Log successful patching
    console.log('Mobile compatibility patches applied');
    return true;
  } catch (error) {
    console.error('Failed to apply mobile patches:', error);
    return false;
  }
};

// Fix array-related methods that often cause mobile issues
const fixArrayMethods = () => {
  // Patch Array.prototype.map for additional safety
  const arrayMethods = ['map', 'filter', 'forEach', 'find', 'some', 'every', 'reduce', 'reduceRight'];
  
  arrayMethods.forEach(method => {
    const original = Array.prototype[method];
    Array.prototype[method] = function(...args) {
      if (!this) {
        console.warn(`Prevented ${method}() call on null/undefined`);
        switch (method) {
          case 'map':
          case 'filter':
            return [];
          case 'find':
            return undefined;
          case 'some':
          case 'every':
            return false;
          case 'reduce':
          case 'reduceRight':
            if (args.length < 2) {
              throw new TypeError(`Reduce of empty array with no initial value`);
            }
            return args[1];
          default:
            return undefined;
        }
      }
      return original.apply(this, args);
    };
  });
  
  // Also patch Object entries, keys, values
  ['entries', 'keys', 'values'].forEach(method => {
    const original = Object[method];
    Object[method] = function(obj, ...args) {
      if (obj == null) {
        console.warn(`Prevented Object.${method}() call on null/undefined`);
        return [];
      }
      return original.call(this, obj, ...args);
    };
  });
  
  console.log('Array and Object methods patched for mobile safety');
};

// Fix event handlers that cause issues on mobile
const fixEventHandlers = () => {
  if (typeof EventTarget !== 'undefined') {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (!this) return;
      
      // For touch events, wrap in try-catch
      if (type.startsWith('touch') || type === 'click') {
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
  
  // Prevent pinch zoom on mobile if causing issues
  document.addEventListener('touchmove', function(event) {
    if (event.scale !== 1 && event.scale !== undefined) {
      // Pinch detected, check if it should be allowed
      const targetElement = event.target;
      const shouldPreventPinch = targetElement.closest('.no-pinch-zoom');
      
      if (shouldPreventPinch) {
        event.preventDefault();
      }
    }
  }, { passive: false });
  
  console.log('Event handlers patched for mobile safety');
};

// Fix DOM methods that cause issues on mobile
const fixDomMethods = () => {
  // Fix element.remove() method
  if (Element.prototype.remove) {
    const originalRemove = Element.prototype.remove;
    Element.prototype.remove = function() {
      try {
        originalRemove.apply(this);
      } catch (e) {
        console.warn('Error removing element:', e);
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      }
    };
  }
  
  // Fix querySelector to avoid null errors
  if (Document.prototype.querySelector) {
    const originalQuerySelector = Document.prototype.querySelector;
    Document.prototype.querySelector = function(selector) {
      try {
        return originalQuerySelector.call(this, selector);
      } catch (e) {
        console.warn(`Error in querySelector('${selector}'):`, e);
        return null;
      }
    };
  }
  
  // Fix element.classList.toggle to avoid errors
  if (DOMTokenList.prototype.toggle) {
    const originalToggle = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function(token, force) {
      try {
        return originalToggle.call(this, token, force);
      } catch (e) {
        console.warn(`Error toggling class '${token}':`, e);
        return false;
      }
    };
  }
  
  console.log('DOM methods patched for mobile safety');
};

// Apply additional mobile-specific optimizations
const applyMobileOptimizations = () => {
  // Fix for 100vh issues on mobile
  const setCssViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setCssViewportHeight();
  window.addEventListener('resize', setCssViewportHeight);
  
  // Improve touch response
  document.documentElement.style.touchAction = 'manipulation';
  
  // Add safe access utilities to window
  window.safeAccess = (obj, prop, defaultValue = null) => {
    try {
      if (!obj || typeof obj !== 'object') return defaultValue;
      return obj[prop] !== undefined ? obj[prop] : defaultValue;
    } catch (e) {
      console.warn(`Error accessing ${prop}:`, e);
      return defaultValue;
    }
  };
  
  // Ensure scroll restoration is set to auto
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'auto';
  }
  
  console.log('Mobile optimizations applied');
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
  
  // Add a temporary message before reload
  const msgEl = document.createElement('div');
  msgEl.style.position = 'fixed';
  msgEl.style.top = '50%';
  msgEl.style.left = '50%';
  msgEl.style.transform = 'translate(-50%, -50%)';
  msgEl.style.backgroundColor = '#3b82f6';
  msgEl.style.color = 'white';
  msgEl.style.padding = '20px';
  msgEl.style.borderRadius = '8px';
  msgEl.style.zIndex = '9999';
  msgEl.style.textAlign = 'center';
  msgEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  msgEl.textContent = newValue === 'true' ? 'Switching to desktop view...' : 'Switching to mobile view...';
  document.body.appendChild(msgEl);
  
  // Reload after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 500);
  
  return newValue === 'true';
};

// Initialize on import
applyMobilePatches();

export default {
  isMobileDevice,
  applyMobilePatches,
  toggleDesktopView
};
