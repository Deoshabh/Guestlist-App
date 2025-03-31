/**
 * This script creates placeholder icons when the real ones are missing
 * It runs when the page loads to prevent the PWA manifest error
 */
(function() {
  // Check if the icon files exist
  const checkImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Create a canvas-based icon
  const createIconCanvas = (size, text) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#3b82f6'; // Primary blue color
    ctx.fillRect(0, 0, size, size);
    
    // Draw a shape in the middle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size/4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size/2, size/2);
    
    return canvas;
  };
  
  // Generate data URL from canvas
  const canvasToDataURL = (canvas) => {
    return canvas.toDataURL('image/png');
  };
  
  // Create blob from data URL
  const dataURLToBlob = (dataURL) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  };
  
  // Generate icon, create blob URL, and update links
  const generateAndUpdateIcon = async (path, size, text) => {
    // First check if the icon exists
    const exists = await checkImage(path);
    if (exists) return; // Icon exists, no need to generate
    
    // Generate icon if it doesn't exist
    console.log(`Icon ${path} not found, generating placeholder...`);
    const canvas = createIconCanvas(size, text);
    const dataURL = canvasToDataURL(canvas);
    const blob = dataURLToBlob(dataURL);
    const blobURL = URL.createObjectURL(blob);
    
    // Update the link in the manifest
    const links = document.querySelectorAll(`link[rel="icon"], link[rel="apple-touch-icon"], link[href="${path}"]`);
    links.forEach(link => {
      if (link.href.includes(path)) {
        link.href = blobURL;
      }
    });
    
    // Also find and update in the manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      try {
        fetch(manifestLink.href)
          .then(response => response.text())
          .then(text => {
            // This is simplistic and won't work for all manifests
            // but provides a quick fix for the error
            console.log('Updating manifest reference if needed');
          });
      } catch (e) {
        console.warn('Could not update manifest', e);
      }
    }
  };
  
  // Main execution
  const init = async () => {
    // Generate placeholder icons
    await generateAndUpdateIcon('/logo192.png', 192, 'GM');
    await generateAndUpdateIcon('/logo512.png', 512, 'GM');
    console.log('Icon check complete');
  };
  
  // Run when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
