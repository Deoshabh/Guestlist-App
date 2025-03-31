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

  // Detect errors on important React hooks
  patchReactHooks();

  // Fix existing array processing errors that might be present
  preemptiveArrayFix();

  // Monitor for Array operation errors
  window.addEventListener('error', (event) => {
    if (!event.error) return;

    const errorMessage = event.error.toString().toLowerCase();
    
    // Detect common mobile errors
    const isMapError = errorMessage.includes('map') || 
                        errorMessage.includes('undefined is not an object') ||
                        errorMessage.includes('null is not an object') ||
                        errorMessage.includes('cannot read property') ||
                        errorMessage.includes('is not a function');
                        
    const isRenderError = errorMessage.includes('render') || 
                          errorMessage.includes('react') ||
                          errorMessage.includes('hook') ||
                          errorMessage.includes('state') ||
                          errorMessage.includes('effect');

    const isTouchError = errorMessage.includes('touch') ||
                         errorMessage.includes('event') ||
                         errorMessage.includes('gesture') ||
                         errorMessage.includes('swipe');
                         
    // Track and respond to errors
    if (isMapError || isRenderError || isTouchError) {
      errorCount++;
      console.warn(`Mobile error detected (${errorCount}/${ERROR_THRESHOLD}):`, errorMessage);
      
      // Apply lightweight fixes first
      if (errorCount === 1) {
        attemptQuickFix(errorMessage);
      }
      
      // If we hit the threshold, try recovery
      if (errorCount >= ERROR_THRESHOLD) {
        initiateRecovery();
      }
    }
  });
};

/**
 * Attempt to quickly fix common issues without a full recovery
 */
const attemptQuickFix = (errorMessage) => {
  try {
    // If it's a map error, attempt to immediately patch Array.prototype.map
    if (errorMessage.includes('map') || errorMessage.includes('undefined is not an object')) {
      console.log('Applying quick fix for Array methods');
      
      // Patch Array functions
      const safeArrayFunctions = ['map', 'forEach', 'filter', 'reduce', 'find'];
      
      safeArrayFunctions.forEach(funcName => {
        const original = Array.prototype[funcName];
        Array.prototype[funcName] = function(...args) {
          if (!this) {
            console.warn(`Quick fix: Prevented ${funcName}() call on null/undefined`);
            return funcName === 'map' || funcName === 'filter' ? [] : undefined;
          }
          return original.apply(this, args);
        };
      });
      
      // Add a fix message and reload
      const fixMsg = document.createElement('div');
      fixMsg.style.position = 'fixed';
      fixMsg.style.bottom = '60px';
      fixMsg.style.left = '10px';
      fixMsg.style.right = '10px';
      fixMsg.style.padding = '10px';
      fixMsg.style.backgroundColor = '#4CAF50';
      fixMsg.style.color = 'white';
      fixMsg.style.textAlign = 'center';
      fixMsg.style.borderRadius = '5px';
      fixMsg.style.zIndex = '9999';
      fixMsg.textContent = 'Fixing display issue...';
      document.body.appendChild(fixMsg);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (e) {
    console.error('Error in quick fix:', e);
  }
};

/**
 * Apply preemptive fixes for array methods to avoid errors
 */
const preemptiveArrayFix = () => {
  try {
    // Check if the list or form is failing to render
    const guestFormExists = !!document.querySelector('.guest-form');
    const guestListExists = !!document.querySelector('.guest-list');
    
    if (!guestFormExists || !guestListExists) {
      console.log('Critical component missing, applying array fixes');
      
      // Fix array methods
      const arrayMethods = ['map', 'filter', 'forEach', 'reduce', 'find', 'some', 'every'];
      arrayMethods.forEach(method => {
        const original = Array.prototype[method];
        Array.prototype[method] = function(...args) {
          if (!this) return method === 'map' || method === 'filter' ? [] : undefined;
          return original.apply(this, args);
        };
      });
      
      // Force reload if components are still missing after a moment
      setTimeout(() => {
        if (!document.querySelector('.guest-form') || !document.querySelector('.guest-list')) {
          localStorage.setItem('componentFailure', 'true');
          window.location.reload();
        }
      }, 2000);
    }
  } catch (e) {
    console.error('Error in preemptive fix:', e);
  }
};

/**
 * Patch React hooks to prevent common mobile errors
 */
const patchReactHooks = () => {
  try {
    // Check if React DevTools are available to access React
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Monitor for React errors
      if (hook.onCommitFiberRoot) {
        const oldCommitFiber = hook.onCommitFiberRoot;
        hook.onCommitFiberRoot = (...args) => {
          try {
            return oldCommitFiber.apply(this, args);
          } catch (error) {
            console.error('React fiber error:', error);
            // If we catch React errors, increment our counter
            errorCount++;
            
            if (errorCount >= ERROR_THRESHOLD) {
              initiateRecovery();
            }
            return null;
          }
        };
      }
    }
  } catch (e) {
    console.error('Error patching React hooks:', e);
  }
};

/**
 * Apply enhanced protections for mobile devices
 */
const applyEnhancedProtections = () => {
  // Patch Array functions
  const safeArrayFunctions = ['map', 'forEach', 'filter', 'reduce', 'find', 'some', 'every'];
  
  safeArrayFunctions.forEach(funcName => {
    const original = Array.prototype[funcName];
    Array.prototype[funcName] = function(...args) {
      if (!this) {
        console.warn(`Enhanced protection: Prevented ${funcName}() call on null/undefined`);
        return funcName === 'map' || funcName === 'filter' ? [] : 
               funcName === 'some' || funcName === 'every' ? false : 
               funcName === 'find' ? undefined : 
               undefined;
      }
      try {
        return original.apply(this, args);
      } catch (error) {
        console.error(`Error in ${funcName} operation:`, error);
        return funcName === 'map' || funcName === 'filter' ? [] : 
               funcName === 'some' || funcName === 'every' ? false : 
               funcName === 'find' ? undefined : 
               undefined;
      }
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
  
  // Protect window.addEventListener for touch events
  if (typeof EventTarget !== 'undefined') {
    const origAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type.startsWith('touch') || type === 'click') {
        const safeListener = function(event) {
          try {
            return listener.call(this, event);
          } catch (e) {
            console.error(`Error in ${type} event:`, e);
          }
        };
        return origAddEventListener.call(this, type, safeListener, options);
      }
      return origAddEventListener.call(this, type, listener, options);
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
    
    // Show user a recovery message
    const recoveryMsg = document.createElement('div');
    recoveryMsg.style.position = 'fixed';
    recoveryMsg.style.top = '50%';
    recoveryMsg.style.left = '50%';
    recoveryMsg.style.transform = 'translate(-50%, -50%)';
    recoveryMsg.style.backgroundColor = '#3b82f6';
    recoveryMsg.style.color = 'white';
    recoveryMsg.style.padding = '20px';
    recoveryMsg.style.borderRadius = '8px';
    recoveryMsg.style.zIndex = '9999';
    recoveryMsg.style.maxWidth = '80%';
    recoveryMsg.style.textAlign = 'center';
    recoveryMsg.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">Resolving Display Issues</div>
      <div>Switching to desktop view to improve compatibility</div>
    `;
    document.body.appendChild(recoveryMsg);
  } else {
    // If desktop view doesn't help, clear data
    console.log('Desktop view already active, clearing app data');
    
    try {
      // Preserve key settings
      const theme = localStorage.getItem('darkMode');
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore theme
      if (theme) {
        localStorage.setItem('darkMode', theme);
      }
      
      // Show message
      const clearMsg = document.createElement('div');
      clearMsg.style.position = 'fixed';
      clearMsg.style.top = '50%';
      clearMsg.style.left = '50%';
      clearMsg.style.transform = 'translate(-50%, -50%)';
      clearMsg.style.backgroundColor = '#ef4444';
      clearMsg.style.color = 'white';
      clearMsg.style.padding = '20px';
      clearMsg.style.borderRadius = '8px';
      clearMsg.style.zIndex = '9999';
      clearMsg.style.maxWidth = '80%';
      clearMsg.style.textAlign = 'center';
      clearMsg.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">Resolving Persistent Issues</div>
        <div>Clearing app data to fix display problems</div>
      `;
      document.body.appendChild(clearMsg);
    } catch (e) {
      console.error('Error in clearing storage during recovery:', e);
    }
  }
  
  // Add a small delay before reload to ensure storage is set
  setTimeout(() => {
    window.location.reload();
  }, 1500);
};

export default { monitorMobileErrors };
