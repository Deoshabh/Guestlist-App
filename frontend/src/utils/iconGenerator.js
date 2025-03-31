/**
 * This utility generates placeholder icons for the application
 * when the actual icon files are missing.
 */

/**
 * Creates a canvas icon with the specified size
 * @param {number} size - Size of the icon in pixels
 * @returns {string} - Data URL of the generated icon
 */
export const generateIcon = (size = 192) => {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    console.warn('Cannot generate icon outside of browser environment');
    return '';
  }
  
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create a blue background
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, size, size);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = `${size / 5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GUEST', size / 2, size / 2 - size / 10);
    ctx.fillText('MANAGER', size / 2, size / 2 + size / 10);
    
    // Convert to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating icon:', error);
    return '';
  }
};

/**
 * Checks if an icon exists and creates it if not
 * @param {string} iconPath - Path to the icon
 * @param {number} size - Size of the icon
 */
export const ensureIconExists = (iconPath, size) => {
  return new Promise((resolve) => {
    // Create a test image to check if the icon exists
    const img = new Image();
    img.onload = () => {
      // Icon exists
      resolve(true);
    };
    img.onerror = () => {
      // Icon doesn't exist, create it
      try {
        // Generate icon
        const iconDataUrl = generateIcon(size);
        
        // Create a link and download the icon
        const link = document.createElement('a');
        link.href = iconDataUrl;
        link.download = iconPath.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Generated icon: ${iconPath}`);
        resolve(true);
      } catch (error) {
        console.error('Error creating icon:', error);
        resolve(false);
      }
    };
    img.src = iconPath;
  });
};

// Check for missing icons when this module is imported
export const checkIcons = async () => {
  if (typeof window !== 'undefined') {
    await ensureIconExists('/logo192.png', 192);
    await ensureIconExists('/logo512.png', 512);
  }
};

export default { generateIcon, ensureIconExists, checkIcons };
