/**
 * Utility script to help clean up and consolidate redundant files
 */
const fs = require('fs');
const path = require('path');

// Configuration: Files that might be unnecessary/conflicting
const potentiallyUnnecessaryFiles = [
  // Development/build only files (can be removed from production)
  { 
    path: 'public/enableSourceMaps.js',
    reason: 'Not needed in production, source maps should be disabled'
  },
  {
    path: 'public/CONVERT_INSTRUCTIONS.md',
    reason: 'Only needed during development, not for production'
  },
  {
    path: 'public/icons.html',
    reason: 'Documentation file that\'s not needed in production'
  },
  
  // Potentially conflicting recovery mechanisms
  {
    path: 'src/utils/mobileRecovery.js',
    reason: 'Functionality exists in mobileCompatibility.js'
  },
  
  // Service worker utilities that may be redundant
  {
    path: 'public/generateIcons.js',
    reason: 'Should be replaced with scripts/generate-fallback-icons.js'
  }
];

// Get the root directory of the project
const rootDir = path.resolve(__dirname, '..');

// Function to check a specific file
function checkFile(fileInfo) {
  const filePath = path.join(rootDir, fileInfo.path);
  
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${fileInfo.path}`);
    console.log(`  Reason for potential removal: ${fileInfo.reason}`);
    return true;
  } else {
    console.log(`✗ ${fileInfo.path} (not found)`);
    return false;
  }
}

// Check all files
function checkAllFiles() {
  console.log('Checking for potentially unnecessary files:');
  console.log('=========================================');
  
  let foundCount = 0;
  
  potentiallyUnnecessaryFiles.forEach(fileInfo => {
    if (checkFile(fileInfo)) {
      foundCount++;
    }
  });
  
  console.log('=========================================');
  console.log(`Found ${foundCount} out of ${potentiallyUnnecessaryFiles.length} potentially unnecessary files.`);
  
  if (foundCount > 0) {
    console.log('\nTo remove these files, run:');
    console.log('node scripts/cleanup-conflicts.js --remove');
  }
}

// Remove unnecessary files
function removeUnnecessaryFiles() {
  console.log('Removing unnecessary files:');
  console.log('=========================================');
  
  let removedCount = 0;
  
  potentiallyUnnecessaryFiles.forEach(fileInfo => {
    const filePath = path.join(rootDir, fileInfo.path);
    
    if (fs.existsSync(filePath)) {
      try {
        // Create a backup first
        const backupPath = `${filePath}.bak`;
        fs.copyFileSync(filePath, backupPath);
        
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`✓ Removed ${fileInfo.path} (backup created at ${fileInfo.path}.bak)`);
        removedCount++;
      } catch (err) {
        console.error(`✗ Error removing ${fileInfo.path}:`, err.message);
      }
    } else {
      console.log(`✗ ${fileInfo.path} (not found)`);
    }
  });
  
  console.log('=========================================');
  console.log(`Removed ${removedCount} unnecessary files.`);
  console.log('Backups were created with .bak extension.');
}

// Main execution
if (process.argv.includes('--remove')) {
  removeUnnecessaryFiles();
} else {
  checkAllFiles();
}
