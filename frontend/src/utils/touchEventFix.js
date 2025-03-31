/**
 * Touch Event Fix Utility
 * Improves mobile touch event handling
 */

export const fixTouchEvents = () => {
  // Check if we're in a touch-capable environment
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
    return false;
  }
  
  try {
    console.log('Applying touch event fixes');
    
    // Fix click delay on mobile devices
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        touch-action: manipulation;
      }
      
      button, a, [role="button"], input, select, textarea {
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      
      .touch-target {
        min-height: 44px;
        min-width: 44px;
      }
    `;
    document.head.appendChild(style);
    
    // Monitor and fix touch events
    fixGhostClicks();
    fixTouchCancellation();
    
    // Add passive touch listeners for better scrolling performance
    improveScrollingPerformance();
    
    return true;
  } catch (err) {
    console.error('Error fixing touch events:', err);
    return false;
  }
};

// Prevent ghost clicks
const fixGhostClicks = () => {
  let lastTouchTime = 0;
  
  // Capture touch events to prevent ghost clicks
  document.addEventListener('touchend', function() {
    lastTouchTime = Date.now();
  }, true);
  
  // Block click events that happen too soon after a touch
  document.addEventListener('click', function(e) {
    const timeSinceTouch = Date.now() - lastTouchTime;
    if (timeSinceTouch < 300) {
      // This might be a ghost click, let's check if it's on or near a touch target
      if (e.target.tagName === 'BUTTON' || 
          e.target.tagName === 'A' || 
          e.target.getAttribute('role') === 'button') {
        console.log('Prevented potential ghost click');
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, true);
};

// Fix touchcancel issues on mobile browsers
const fixTouchCancellation = () => {
  // Handle touch cancellation events better
  document.addEventListener('touchcancel', function(e) {
    // Touch cancelled - sometimes this causes issues with swipe actions
    console.log('Touch cancelled, preventing potential issues');
    
    // Try to identify what handler was being executed
    const target = e.target;
    
    // If this was a swipeable element, try to abort the swipe gracefully
    if (target.classList.contains('swipe-action') || 
        target.closest('.swipe-action')) {
      console.log('Swipe action cancelled');
    }
  }, true);
};

// Improve scrolling performance by making touch listeners passive
const improveScrollingPerformance = () => {
  // Set a flag to identify passive support
  let passiveSupported = false;
  
  try {
    // Test if passive is supported
    const options = Object.defineProperty({}, 'passive', {
      get: function() {
        passiveSupported = true;
        return true;
      }
    });
    
    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    passiveSupported = false;
  }
  
  // If passive is supported, override addEventListener
  if (passiveSupported) {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // For touch and wheel events, force passive by default
      const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
      
      if (passiveEvents.includes(type)) {
        // Convert boolean or undefined to object if needed
        let newOptions = options;
        
        if (options === undefined || options === false || options === true) {
          newOptions = {
            capture: Boolean(options),
            passive: true
          };
        } else if (typeof options === 'object' && options !== null && options.passive === undefined) {
          // Clone the object to avoid modifying the original
          newOptions = Object.assign({}, options, { passive: true });
        }
        
        return originalAddEventListener.call(this, type, listener, newOptions);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
  }
};

export default { fixTouchEvents };
