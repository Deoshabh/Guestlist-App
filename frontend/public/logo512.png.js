/**
 * This file is loaded if the real logo512.png fails to load
 * It creates a placeholder icon dynamically
 */
(function() {
  // Create a canvas element to draw the icon
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  
  const ctx = canvas.getContext('2d');
  
  // Draw a blue background
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, 512, 512);
  
  // Add some shape
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(256, 256, 160, 0, Math.PI * 2);
  ctx.fill();
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 128px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GM', 256, 256);
  
  // Convert to data URL
  const iconUrl = canvas.toDataURL('image/png');
  
  // Replace all instances of the icon in the document
  const updateLinks = () => {
    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => {
      if (link.href.includes('logo512.png')) {
        link.href = iconUrl;
      }
    });
  };
  
  // Update on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateLinks);
  } else {
    updateLinks();
  }
})();
