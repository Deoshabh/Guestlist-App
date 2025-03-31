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
})();
