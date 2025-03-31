/**
 * Script to help resolve file conflicts by creating consolidated utilities
 */
const fs = require('fs');
const path = require('path');

// New consolidated files to create
const consolidatedFiles = [
  {
    path: 'src/utils/errorHandling.js',
    description: 'Consolidated error handling utilities'
  },
  {
    path: 'src/utils/serviceWorker.js',
    description: 'Consolidated service worker registration and utilities'
  },
  {
    path: 'src/utils/storage.js',
    description: 'Consolidated storage utilities'
  }
];

// Files that should be deprecated in favor of consolidated versions
const deprecatedFiles = [
  {
    path: 'src/components/ErrorBoundary.js',
    replaceWith: 'src/utils/errorHandling.js',
    exportName: 'ErrorBoundary'
  },
  {
    path: 'src/utils/SafeComponent.js',
    replaceWith: 'src/utils/errorHandling.js',
    exportName: 'withErrorHandling'
  },
  {
    path: 'src/serviceWorkerRegistration.js',
    replaceWith: 'src/utils/serviceWorker.js',
    exportNames: ['register', 'unregister']
  },
  {
    path: 'src/utils/serviceWorkerUtil.js',
    replaceWith: 'src/utils/serviceWorker.js',
    exportNames: ['checkForUpdates', 'getRegistration']
  },
  {
    path: 'src/utils/safeStorage.js',
    replaceWith: 'src/utils/storage.js',
    exportName: 'localStorage'
  },
  {
    path: 'src/utils/safeAccess.js',
    replaceWith: 'src/utils/storage.js',
    exportName: 'safeAccess'
  },
  {
    path: 'src/utils/db.js',
    replaceWith: 'src/utils/storage.js',
    exportName: 'db'
  }
];

// Get the root directory of the project
const rootDir = path.resolve(__dirname, '..');

// Analyze the project to find imports of the deprecated files
function findImportsOfDeprecatedFiles() {
  // This function would scan all JS/JSX files for imports
  // and list files that need to be updated
  console.log('To complete the migration, update imports in these files:');
  console.log('(This is a placeholder - the actual implementation would');
  console.log('scan your codebase for import statements)');
  console.log('\nExample updates:');
  console.log('- import { ErrorBoundary } from "../components/ErrorBoundary"');
  console.log('  → import { ErrorBoundary } from "../utils/errorHandling"');
  console.log('\n- import SafeComponent from "../utils/SafeComponent"');
  console.log('  → import { withErrorHandling } from "../utils/errorHandling"');
  console.log('  → const SafeComponent = withErrorHandling(YourComponent)');
}

// Function to delete deprecated files with backup
function deleteDeprecatedFiles() {
  console.log('Creating backups and deleting deprecated files:');
  console.log('============================================');
  
  let deletedCount = 0;
  
  deprecatedFiles.forEach(fileInfo => {
    const filePath = path.join(rootDir, fileInfo.path);
    
    if (fs.existsSync(filePath)) {
      try {
        // Create a backup first
        const backupPath = `${filePath}.bak`;
        fs.copyFileSync(filePath, backupPath);
        
        // Delete the file
        fs.unlinkSync(filePath);
        console.log(`✓ Deleted ${fileInfo.path} (backup at ${fileInfo.path}.bak)`);
        deletedCount++;
      } catch (err) {
        console.error(`✗ Error deleting ${fileInfo.path}:`, err.message);
      }
    } else {
      console.log(`✗ ${fileInfo.path} (not found)`);
    }
  });
  
  console.log('============================================');
  console.log(`Deleted ${deletedCount} deprecated files.`);
  console.log('Backups were created with .bak extension.');
}

// Main function
function main() {
  console.log('Conflict Resolution Helper');
  console.log('=========================\n');
  
  // Display information about consolidated files
  console.log('Consolidated files that resolve conflicts:');
  consolidatedFiles.forEach(file => {
    console.log(`- ${file.path}: ${file.description}`);
  });
  
  console.log('\nFiles to be deprecated:');
  deprecatedFiles.forEach(file => {
    console.log(`- ${file.path} → use ${file.replaceWith} instead`);
  });
  
  // Find imports that need to be updated
  console.log('\n');
  findImportsOfDeprecatedFiles();
  
  // Add instructions for deleting files
  console.log('\nAfter updating all imports, you can delete deprecated files:');
  console.log('node scripts/resolve-conflicts.js --delete');
}

// Add delete command
if (process.argv.includes('--delete')) {
  deleteDeprecatedFiles();
} else {
  main();
}
