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
  
  // Service worker utilities that may be redundant
  {
    path: 'public/generateIcons.js',
    reason: 'Should be replaced with scripts/generate-fallback-icons.js'
  }
];

// Conflicting file groups (imported from conflictChecker.js)
const conflictGroups = [
  // Error recovery and handling
  {
    group: 'Error Recovery',
    files: [
      'public/errorRecovery.js',
      'src/utils/mobileRecovery.js',
      'src/components/ErrorBoundary.js',
      'src/utils/SafeComponent.js'
    ],
    description: 'Multiple implementations of error recovery functionality'
  },
  
  // Mobile compatibility
  {
    group: 'Mobile Compatibility',
    files: [
      'src/utils/mobileCompatibility.js',
      'src/utils/mobileRecovery.js'
    ],
    description: 'Duplicate mobile device utility functions'
  },
  
  // Service worker management
  {
    group: 'Service Worker',
    files: [
      'public/service-worker.js',
      'src/serviceWorkerRegistration.js', 
      'src/utils/serviceWorkerUtil.js'
    ],
    description: 'Potentially conflicting service worker implementations'
  },
  
  // Icon generation
  {
    group: 'Icon Generation',
    files: [
      'public/generateIcons.js',
      'scripts/generate-fallback-icons.js'
    ],
    description: 'Multiple implementations for icon generation'
  },
  
  // Storage utilities
  {
    group: 'Storage Utilities',
    files: [
      'src/utils/safeStorage.js',
      'src/utils/safeAccess.js',
      'src/utils/db.js'
    ],
    description: 'Overlapping storage access utilities'
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

// Check for conflicting file groups
function checkConflicts() {
  console.log('Checking for file conflicts:');
  console.log('=========================================');
  
  let conflictCount = 0;
  
  for (const group of conflictGroups) {
    const existingFiles = [];
    
    // Check which files in this group exist
    for (const file of group.files) {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        existingFiles.push(file);
      }
    }
    
    // If more than one file exists in the group, log it as a conflict
    if (existingFiles.length > 1) {
      console.log(`\nConflict in "${group.group}": ${group.description}`);
      console.log('Files involved:');
      existingFiles.forEach(file => console.log(`- ${file}`));
      conflictCount++;
    }
  }
  
  console.log('=========================================');
  console.log(`Found ${conflictCount} conflict groups in the project.`);
  
  if (conflictCount > 0) {
    console.log('\nConsider consolidating these files to avoid conflicts.');
  }
}

// Main execution
if (process.argv.includes('--remove')) {
  removeUnnecessaryFiles();
} else if (process.argv.includes('--conflicts')) {
  checkConflicts();
} else {
  checkAllFiles();
  console.log('\nTo check for conflicting file groups, run:');
  console.log('node scripts/cleanup-conflicts.js --conflicts');
}
