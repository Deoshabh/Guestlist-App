/**
 * Startup script for Guest Manager application
 * This script handles initialization before the React app loads
 */
(function() {
  console.log('🚀 Initializing Guest Manager application...');
  
  // Check for missing icons and create data URIs in localStorage
  function generateAndCacheIcons() {
    const sizes = [192, 512];
    sizes.forEach(size => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Blue background
        ctx.fillStyle = '#3498db';
        ctx.fillRect(0, 0, size, size);
        
        // Draw rounded corners
        ctx.fillStyle = '#3498db';
        const radius = size * 0.2;
        ctx.beginPath();
        ctx.moveTo(0, radius);
        ctx.arcTo(0, 0, radius, 0, radius);
        ctx.lineTo(size - radius, 0);
        ctx.arcTo(size, 0, size, radius, radius);
        ctx.lineTo(size, size - radius);
        ctx.arcTo(size, size, size - radius, size, radius);
        ctx.lineTo(radius, size);
        ctx.arcTo(0, size, 0, size - radius, radius);
        ctx.closePath();
        ctx.fill();
        
        // White text
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size/5}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GUEST', size/2, size/2 - size/10);
        ctx.fillText('MANAGER', size/2, size/2 + size/10);
        
        // Cache the icon in localStorage
        try {
          const dataUrl = canvas.toDataURL('image/png');
          localStorage.setItem(`app-icon-${size}`, dataUrl);
        } catch (e) {
          console.warn('Failed to cache icon:', e);
        }
      } catch (e) {
        console.warn('Failed to generate icon:', e);
      }
    });
  }
  
  // Create or retrieve a blob URL for an icon
  function getIconBlobUrl(size) {
    const storageKey = `app-icon-blob-${size}`;
    let blobUrl = sessionStorage.getItem(storageKey);
    
    if (!blobUrl) {
      const dataUrl = localStorage.getItem(`app-icon-${size}`);
      if (dataUrl) {
        try {
          // Convert data URL to Blob
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          blobUrl = URL.createObjectURL(blob);
          sessionStorage.setItem(storageKey, blobUrl);
        } catch (e) {
          console.warn('Failed to create blob URL:', e);
        }
      }
    }
    
    return blobUrl;
  }
  
  // Apply icons dynamically to avoid CORS issues
  function applyIcons() {
    // Generate and cache icons if needed
    if (!localStorage.getItem('app-icon-192')) {
      generateAndCacheIcons();
    }
    
    // Update icon URLs
    const icons = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    icons.forEach(link => {
      const sizeAttr = link.getAttribute('sizes');
      const size = sizeAttr ? parseInt(sizeAttr.split('x')[0]) : 192;
      const blobUrl = getIconBlobUrl(size) || getIconBlobUrl(192);
      
      if (blobUrl) {
        link.href = blobUrl;
      }
    });
  }
  
  // Fix icon paths when DOM is loaded
  window.addEventListener('DOMContentLoaded', function() {
    // Apply icons
    setTimeout(applyIcons, 100);
    
    // Show offline mode warning if necessary
    if (localStorage.getItem('forceOfflineMode') === 'true') {
      const corsWarning = document.getElementById('cors-warning');
      if (corsWarning) corsWarning.style.display = 'block';
    }
    
    // Set up global error handler
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('Global error:', message, source, lineno, colno);
      return false;
    };
    
    console.log('✅ Startup script completed');
  });
  
  // Initialize localStorage if it doesn't exist
  if (localStorage.getItem('guest-app-initialized') !== 'true') {
    localStorage.setItem('guest-app-initialized', 'true');
    localStorage.setItem('forceOfflineMode', 'true'); // Start in offline mode by default
  }
  
  // Block analytics to avoid CORS errors
  window.ga = function() {};
  window.gtag = function() {};
  
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
