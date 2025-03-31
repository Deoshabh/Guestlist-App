const fs = require('fs');
const path = require('path');

// Function to remove source map references from files
function removeSourceMapReferences(dir) {
  // Get all files in the directory
  const files = fs.readdirSync(dir);
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // If it's a directory, process its files recursively
    if (stat.isDirectory()) {
      removeSourceMapReferences(filePath);
      continue;
    }
    
    // Process only JS and CSS files
    if (file.endsWith('.js') || file.endsWith('.css')) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove source map comments
        content = content.replace(/\/\/# sourceMappingURL=.+?\.map/g, '');
        content = content.replace(/\/\*# sourceMappingURL=.+?\.map \*\//g, '');
        
        // Write the file back
        fs.writeFileSync(filePath, content);
        console.log(`Removed source map reference from: ${filePath}`);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }
    
    // Delete any existing map files
    if (file.endsWith('.map')) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted source map file: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting source map file ${filePath}:`, error);
      }
    }
  }
}

// Process the build directory
const buildDir = path.join(__dirname, '../build');
console.log('Removing source map references...');
removeSourceMapReferences(buildDir);
console.log('Source map cleanup completed.');
