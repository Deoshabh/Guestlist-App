/**
 * Mobile-specific error recovery utilities
 */

// Create a global error monitor and recovery system for mobile devices
export function monitorMobileErrors() {
  try {
    console.log('Mobile error monitoring initialized');
    
    // Track error counts to prevent infinite loops
    const errorCounts = {};
    
    // Track if we've already applied emergency recovery
    let emergencyRecoveryApplied = false;
    
    // Monitor for unhandled errors
    window.addEventListener('error', event => {
      const error = event.error || new Error(event.message);
      const errorMsg = error.message || 'Unknown error';
      
      // Skip network errors - they're handled elsewhere
      if (errorMsg.includes('network') || 
          errorMsg.includes('fetch') || 
          errorMsg.includes('Network')) {
        return;
      }
      
      // Count this error type
      errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1;
      
      // Check if this is a repeated error
      if (errorCounts[errorMsg] > 2) {
        console.warn('Repeated error detected:', errorMsg);
        
        // Apply emergency recovery if we haven't already
        if (!emergencyRecoveryApplied) {
          emergencyRecoveryApplied = true;
          applyEmergencyRecovery(errorMsg);
        }
      }
      
      // Log the error for debugging
      console.error('Mobile error detected:', {
        message: errorMsg,
        stack: error.stack,
        count: errorCounts[errorMsg],
        recoveryApplied: emergencyRecoveryApplied
      });
    });
    
    // Monitor for unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      const error = event.reason;
      const errorMsg = error?.message || 'Unhandled promise rejection';
      
      // Count this error type
      errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1;
      
      console.error('Unhandled promise rejection:', {
        message: errorMsg,
        stack: error?.stack,
        count: errorCounts[errorMsg]
      });
      
      // Apply emergency recovery if this keeps happening
      if (errorCounts[errorMsg] > 2 && !emergencyRecoveryApplied) {
        emergencyRecoveryApplied = true;
        applyEmergencyRecovery(errorMsg);
      }
    });
  } catch (error) {
    console.error('Failed to initialize mobile error recovery:', error);
  }
}

// Apply emergency fixes for critical errors
function applyEmergencyRecovery(errorMsg) {
  console.log('Applying emergency recovery for:', errorMsg);
  
  try {
    // Show a recovery UI to the user
    showRecoveryUI(errorMsg);
    
    // Try to fix common mobile errors
    if (errorMsg.includes('undefined is not an object') || 
        errorMsg.includes('null is not an object') ||
        errorMsg.includes('cannot read property')) {
      
      // These are usually property access on null/undefined objects
      // Apply array and object protections
      applyObjectProtections();
      
      // Force desktop view as a last resort for serious errors
      if (window.innerWidth <= 768) {
        localStorage.setItem('forceDesktopView', 'true');
      }
      
      // Clear service worker caches which might be causing issues
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(name => caches.delete(name));
        });
      }
    }
    
    // Reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  } catch (recoveryError) {
    console.error('Error during emergency recovery:', recoveryError);
    // Last resort - reload
    setTimeout(() => window.location.reload(), 1000);
  }
}

// Protect object and array accesses
function applyObjectProtections() {
  // Make console.log safe (it's often used in components)
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    try {
      return originalConsoleLog.apply(this, args);
    } catch (e) {
      // Silently fail rather than crash
    }
  };
  
  // Add safe property access to Object
  if (!Object.prototype.safeGet) {
    Object.defineProperty(Object.prototype, 'safeGet', {
      value: function(path, defaultValue = null) {
        try {
          let current = this;
          const keys = path.split('.');
          
          for (let i = 0; i < keys.length; i++) {
            if (current === null || current === undefined) {
              return defaultValue;
            }
            current = current[keys[i]];
          }
          
          return current === undefined ? defaultValue : current;
        } catch (e) {
          return defaultValue;
        }
      },
      enumerable: false,
      configurable: true
    });
  }
}

// Show a simple recovery UI
function showRecoveryUI(errorMsg) {
  try {
    // Create recovery element
    const recoveryEl = document.createElement('div');
    recoveryEl.style.position = 'fixed';
    recoveryEl.style.top = '0';
    recoveryEl.style.left = '0';
    recoveryEl.style.right = '0';
    recoveryEl.style.bottom = '0';
    recoveryEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    recoveryEl.style.zIndex = '9999';
    recoveryEl.style.display = 'flex';
    recoveryEl.style.flexDirection = 'column';
    recoveryEl.style.alignItems = 'center';
    recoveryEl.style.justifyContent = 'center';
    recoveryEl.style.color = 'white';
    recoveryEl.style.padding = '20px';
    recoveryEl.style.textAlign = 'center';
    
    // Create content
    recoveryEl.innerHTML = `
      <div style="background: #4f46e5; border-radius: 8px; padding: 20px; max-width: 300px; margin: 0 auto;">
        <h2 style="margin-top: 0; font-size: 18px;">Fixing Display Issue</h2>
        <p style="margin-bottom: 20px;">We've detected a problem and are fixing it automatically.</p>
        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden;">
          <div style="width: 30%; height: 100%; background: white; animation: progress 2s linear infinite;"></div>
        </div>
        <style>
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        </style>
      </div>
    `;
    
    // Add to body
    document.body.appendChild(recoveryEl);
  } catch (error) {
    console.error('Error showing recovery UI:', error);
  }
}

export default {
  monitorMobileErrors
};
