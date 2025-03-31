/**
 * Error recovery script to prevent white screens in production
 */
(function() {
  // Set a timeout to check if the application has rendered
  const TIMEOUT = 5000; // 5 seconds
  const RECOVERY_MARKER = 'errorRecoveryAttempted';
  const DESKTOP_FORCE_KEY = 'forceDesktopView';
  
  // First, add protection from common mobile errors
  function protectArrayMethods() {
    try {
      // Check if Array.prototype.map is being called on null or undefined
      const originalMap = Array.prototype.map;
      Array.prototype.map = function(...args) {
        if (!this) {
          console.warn('Protected map() call on null/undefined');
          return [];
        }
        return originalMap.apply(this, args);
      };
      
      // Also protect other common array methods
      ['filter', 'forEach', 'find', 'some', 'every'].forEach(method => {
        const original = Array.prototype[method];
        Array.prototype[method] = function(...args) {
          if (!this) {
            console.warn(`Protected ${method}() call on null/undefined`);
            return method === 'filter' ? [] : undefined;
          }
          return original.apply(this, args);
        };
      });
      
      console.log('Array method protection applied');
    } catch (e) {
      console.error('Error protecting array methods:', e);
    }
  }
  
  // Run protections immediately
  protectArrayMethods();
  
  // Add specific error monitoring for map errors
  window.addEventListener('error', function(event) {
    // Check if it's a map related error
    if (event.error && 
        (event.error.message.includes('map') || 
         event.error.message.includes('undefined') ||
         event.error.message.includes('null'))) {
      
      console.error('Critical error detected:', event.error);
      
      // Log additional details
      console.log('Error context:', {
        isMobile: window.innerWidth <= 768,
        url: window.location.href,
        time: new Date().toISOString(),
        errorType: 'ArrayOperation'
      });
      
      // Check if we need to recover on mobile
      if (window.innerWidth <= 768 && !sessionStorage.getItem('mapErrorRefreshed')) {
        console.log('Critical mobile error encountered, applying fixes');
        
        // Apply array protections again as a failsafe
        protectArrayMethods();
        
        // Mark that we've tried a refresh
        sessionStorage.setItem('mapErrorRefreshed', 'true');
        
        // Try forcing desktop view if not already set
        if (localStorage.getItem(DESKTOP_FORCE_KEY) !== 'true') {
          localStorage.setItem(DESKTOP_FORCE_KEY, 'true');
          console.log('Forcing desktop view to improve compatibility');
        }
        
        // Display a brief message
        const msgEl = document.createElement('div');
        msgEl.style.position = 'fixed';
        msgEl.style.top = '50%';
        msgEl.style.left = '50%';
        msgEl.style.transform = 'translate(-50%, -50%)';
        msgEl.style.width = '80%';
        msgEl.style.maxWidth = '300px';
        msgEl.style.padding = '20px';
        msgEl.style.background = '#3b82f6';
        msgEl.style.color = 'white';
        msgEl.style.borderRadius = '8px';
        msgEl.style.zIndex = '9999';
        msgEl.style.textAlign = 'center';
        msgEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        msgEl.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px;">Fixing Display Issue</div>
          <div>Please wait while we resolve the problem...</div>
        `;
        document.body.appendChild(msgEl);
        
        // Reload after delay
        setTimeout(function() {
          window.location.reload();
        }, 2000);
      }
    }
  });
  
  // Create a visible error UI if the app fails to render
  setTimeout(function() {
    const appRoot = document.getElementById('root');
    
    // Check if app content has been rendered
    if (appRoot && (!appRoot.hasChildNodes() || appRoot.innerHTML.trim() === '')) {
      console.error('Application failed to render within expected timeframe');
      
      // Track recovery attempts to prevent loops
      const recoveryAttempt = parseInt(sessionStorage.getItem(RECOVERY_MARKER) || '0');
      sessionStorage.setItem(RECOVERY_MARKER, String(recoveryAttempt + 1));
      
      // Don't show multiple recovery UIs
      if (recoveryAttempt > 2) {
        console.log('Multiple recovery attempts detected, waiting for manual action');
        return;
      }
      
      // Check if we're on mobile
      const isMobileDevice = window.innerWidth <= 768 || 
                             (navigator && navigator.maxTouchPoints > 0) || 
                             ('ontouchstart' in window);
      
      // Create error UI
      appRoot.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif;">
          <div style="max-width: 500px; margin: 30px auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #e53e3e; margin-top: 0;">Something went wrong</h2>
            <p>The application encountered an error while loading.</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
              <button id="recovery-reload" style="padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Reload the App
              </button>
              ${isMobileDevice ? `
                <button id="recovery-desktop" style="padding: 10px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  Switch to Desktop View
                </button>
              ` : ''}
              <button id="recovery-clear" style="padding: 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Clear App Data & Reload
              </button>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              If this issue persists, please contact support.
            </p>
          </div>
        </div>
      `;
      
      // Add reload handler
      document.getElementById('recovery-reload').addEventListener('click', function() {
        window.location.reload();
      });
      
      // Add desktop mode handler for mobile devices
      if (isMobileDevice) {
        document.getElementById('recovery-desktop').addEventListener('click', function() {
          // Force desktop view
          localStorage.setItem(DESKTOP_FORCE_KEY, 'true');
          window.location.reload();
        });
      }
      
      // Add clear data handler
      document.getElementById('recovery-clear').addEventListener('click', function() {
        // Clear only app-related data
        try {
          const keysToPreserve = ['theme', 'language']; // Keep these settings
          const preservedValues = {};
          
          // Save the preserved values
          keysToPreserve.forEach(key => {
            preservedValues[key] = localStorage.getItem(key);
          });
          
          // Clear all storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Restore preserved values
          for (const key in preservedValues) {
            if (preservedValues[key] !== null) {
              localStorage.setItem(key, preservedValues[key]);
            }
          }
          
          console.log('App data cleared successfully');
        } catch (e) {
          console.error('Error clearing app data:', e);
        }
        
        // Reload the page
        setTimeout(function() {
          window.location.reload();
        }, 500);
      });
    }
  }, TIMEOUT);
})();
