/**
 * Error recovery script to prevent white screens in production
 */
(function() {
  // Set a timeout to check if the application has rendered
  const TIMEOUT = 5000; // 5 seconds
  
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
  
  // Original timeout function to check if app rendered
  setTimeout(function() {
    // Check if the root element is empty or has no visible content
    const rootEl = document.getElementById('root');
    if (!rootEl || !rootEl.children.length || rootEl.innerHTML.trim() === '') {
      console.error('Application failed to render within timeout period');
      
      // Display a recovery message
      const recoveryEl = document.createElement('div');
      recoveryEl.style.padding = '20px';
      recoveryEl.style.maxWidth = '500px';
      recoveryEl.style.margin = '0 auto';
      recoveryEl.style.fontFamily = 'system-ui, sans-serif';
      
      recoveryEl.innerHTML = `
        <h2 style="color: #3b82f6;">Guest Manager Recovery</h2>
        <p>We encountered an issue loading the application. Let's try to fix it:</p>
        <ul style="margin-bottom: 20px;">
          <li>Clear your browser cache and cookies</li>
          <li>Disable browser extensions that might be blocking scripts</li>
          <li>Try refreshing the page</li>
        </ul>
        <div>
          <button id="recovery-reload" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 10px;">
            Reload Application
          </button>
          <button id="recovery-reset" style="background: #ef4444; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Reset Application Data
          </button>
          <button id="recovery-desktop" style="background: #10b981; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; margin-top: 10px; width: 100%;">
            Switch to Desktop Mode
          </button>
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
          If the problem persists, please contact support.
        </p>
      `;
      
      rootEl.appendChild(recoveryEl);
      
      // Add event listeners
      document.getElementById('recovery-reload').addEventListener('click', function() {
        window.location.reload();
      });
      
      document.getElementById('recovery-reset').addEventListener('click', function() {
        // Clear localStorage data
        const tokenKey = 'token';
        localStorage.removeItem(tokenKey);
        
        // Clear service worker caches
        if ('caches' in window) {
          caches.keys().then(function(cacheNames) {
            return Promise.all(
              cacheNames.map(function(cacheName) {
                return caches.delete(cacheName);
              })
            );
          });
        }
        
        // Clear indexedDB
        if ('indexedDB' in window) {
          indexedDB.databases().then(function(dbs) {
            dbs.forEach(function(db) {
              indexedDB.deleteDatabase(db.name);
            });
          });
        }
        
        // Reload the page
        setTimeout(function() {
          window.location.reload();
        }, 500);
      });
      
      // Add desktop mode handler
      document.getElementById('recovery-desktop').addEventListener('click', function() {
        localStorage.setItem('forceDesktopView', 'true');
        window.location.reload();
      });
    }
  }, TIMEOUT);
})();
