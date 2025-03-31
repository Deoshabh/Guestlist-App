/**
 * Error recovery script to prevent white screens in production
 */
(function() {
  // Set a timeout to check if the application has rendered
  const TIMEOUT = 5000; // 5 seconds
  const RECOVERY_MARKER = 'errorRecoveryAttempted';
  const DESKTOP_FORCE_KEY = 'forceDesktopView';
  
  // Add specific error monitoring for map errors
  window.addEventListener('error', function(event) {
    // Check if it's a map related error
    if (event.error && 
        (event.error.message.includes('map') || 
         event.error.message.includes('undefined'))) {
      
      console.error('Map function error detected:', event.error);
      
      // Log additional details
      console.log('Error context:', {
        isMobile: window.innerWidth <= 768,
        url: window.location.href,
        time: new Date().toISOString()
      });
      
      // Refresh the page after a delay if it's specifically a map error 
      // and we're on mobile
      if (window.innerWidth <= 768 && !sessionStorage.getItem('mapErrorRefreshed')) {
        console.log('First map error encountered, will attempt refresh');
        // Mark that we've tried a refresh
        sessionStorage.setItem('mapErrorRefreshed', 'true');
        
        // Display a brief message
        const msgEl = document.createElement('div');
        msgEl.style.position = 'fixed';
        msgEl.style.bottom = '10px';
        msgEl.style.left = '10px';
        msgEl.style.right = '10px';
        msgEl.style.padding = '10px';
        msgEl.style.background = '#3b82f6';
        msgEl.style.color = 'white';
        msgEl.style.borderRadius = '5px';
        msgEl.style.zIndex = '9999';
        msgEl.style.textAlign = 'center';
        msgEl.textContent = 'Fixing display issue...';
        document.body.appendChild(msgEl);
        
        // Reload after 2 seconds
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
                             navigator.maxTouchPoints > 0 || 
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
          
          // Get all keys to remove
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !keysToPreserve.includes(key)) {
              keysToRemove.push(key);
            }
          }
          
          // Remove keys
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Clear session storage
          sessionStorage.clear();
          
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
