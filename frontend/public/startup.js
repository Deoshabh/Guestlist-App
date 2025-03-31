/**
 * Startup script for Guest Manager application
 * This script handles initialization before the React app loads
 */
(function() {
  console.log('🚀 Initializing Guest Manager application...');
  
  // Generate missing icons if needed
  function generateIcon(size) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Blue background
      ctx.fillStyle = '#3498db';
      ctx.fillRect(0, 0, size, size);
      
      // White text
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size/5}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GUEST', size/2, size/2 - size/10);
      ctx.fillText('MANAGER', size/2, size/2 + size/10);
      
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Failed to generate icon:', e);
      return '';
    }
  }
  
  // Fix missing icons on page load
  window.addEventListener('DOMContentLoaded', function() {
    // Fix icon paths
    const iconLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    iconLinks.forEach(link => {
      const size = link.getAttribute('sizes')?.split('x')[0] || 192;
      const icon = generateIcon(parseInt(size));
      if (icon) link.href = icon;
    });
    
    // Force offline mode if CORS is not working
    if (localStorage.getItem('forceOfflineMode') !== 'false') {
      localStorage.setItem('forceOfflineMode', 'true');
      console.log('⚠️ Forcing offline mode due to CORS issues');
    }
    
    console.log('✅ Startup script completed');
  });
  
  // Log errors for debugging
  window.addEventListener('error', function(event) {
    console.error('Global error:', event.message, event.filename, event.lineno);
  });
  
  // Check for previously set offline mode
  const isForceOffline = localStorage.getItem('forceOfflineMode') === 'true';
  
  // Check for network status
  const isOnline = navigator.onLine;
  
  // Function to show CORS warning
  function showCorsWarning() {
    const corsWarning = document.getElementById('cors-warning');
    if (corsWarning) {
      corsWarning.style.display = 'block';
    }
  }
  
  // If offline mode is forced, show the warning
  if (isForceOffline) {
    showCorsWarning();
  }
  
  // Add listener for offline events
  window.addEventListener('offline', function() {
    // Show toast-like notification at the top of the page
    const notification = document.createElement('div');
    notification.textContent = 'You are offline. Limited functionality available.';
    notification.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff9800;color:white;text-align:center;padding:10px;z-index:10001;';
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(function() {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  });
  
  // Setup CORS error detection
  window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('CORS')) {
      console.warn('CORS error detected in startup script');
      // Don't automatically enable offline mode, just log it
    }
  });
  
  // Initialize localStorage if it doesn't exist
  if (localStorage.getItem('guest-app-initialized') !== 'true') {
    localStorage.setItem('guest-app-initialized', 'true');
    localStorage.setItem('forceOfflineMode', 'false');
  }
  
  // Improve PWA experience
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(function(err) {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
})();
