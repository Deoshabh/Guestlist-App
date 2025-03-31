const fs = require('fs');
const path = require('path');

// Check if an icon exists, if not create a fallback
function ensureIconExists(fileName, size) {
  const filePath = path.join(__dirname, '../public', fileName);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`Creating fallback for missing icon: ${fileName}`);
    
    // Simple SVG with text as fallback
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" fill="#4F46E5"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${size/6}" fill="white" text-anchor="middle" dy=".3em">Guest App</text>
      </svg>
    `;
    
    fs.writeFileSync(filePath, svg.trim());
    console.log(`Created fallback icon: ${fileName}`);
  } else {
    console.log(`Icon exists: ${fileName}`);
  }
}

// Ensure all the required icons exist
ensureIconExists('logo192.png', 192);
ensureIconExists('logo512.png', 512);

console.log('Fallback icons check completed.');
