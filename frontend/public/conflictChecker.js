/**
 * Utility to detect and list potentially conflicting or unnecessary files
 * This runs in development mode to help developers identify issues
 */
(function() {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('Checking for potential file conflicts...');
  
  // List of potentially conflicting file groups
  const conflictGroups = [
    // Error recovery and handling
    {
      group: 'Error Recovery',
      files: [
        '/public/errorRecovery.js',
        '/src/utils/mobileRecovery.js',
        '/src/components/ErrorBoundary.js',
        '/src/utils/SafeComponent.js'
      ],
      description: 'Multiple implementations of error recovery functionality'
    },
    
    // Mobile compatibility
    {
      group: 'Mobile Compatibility',
      files: [
        '/src/utils/mobileCompatibility.js',
        '/src/utils/mobileRecovery.js'
      ],
      description: 'Duplicate mobile device utility functions'
    },
    
    // Service worker management
    {
      group: 'Service Worker',
      files: [
        '/public/service-worker.js',
        '/src/serviceWorkerRegistration.js', 
        '/src/utils/serviceWorkerUtil.js'
      ],
      description: 'Potentially conflicting service worker implementations'
    },
    
    // Icon generation
    {
      group: 'Icon Generation',
      files: [
        '/public/generateIcons.js',
        '/scripts/generate-fallback-icons.js'
      ],
      description: 'Multiple implementations for icon generation'
    },
    
    // Storage utilities
    {
      group: 'Storage Utilities',
      files: [
        '/src/utils/safeStorage.js',
        '/src/utils/safeAccess.js',
        '/src/utils/db.js'
      ],
      description: 'Overlapping storage access utilities'
    }
  ];
  
  // Development time utility - check which files exist by making HEAD requests
  function checkFileExists(path) {
    return new Promise(resolve => {
      const fullPath = window.location.origin + path;
      
      fetch(fullPath, { method: 'HEAD' })
        .then(response => {
          resolve(response.ok);
        })
        .catch(() => {
          resolve(false);
        });
    });
  }
  
  // Check each group and log results
  async function checkConflictGroups() {
    for (const group of conflictGroups) {
      const existingFiles = [];
      
      // Check which files in this group exist
      for (const file of group.files) {
        const exists = await checkFileExists(file);
        if (exists) {
          existingFiles.push(file);
        }
      }
      
      // If more than one file exists in the group, log it as a potential conflict
      if (existingFiles.length > 1) {
        console.warn(
          `Potential conflict in "${group.group}": ${group.description}\n` +
          `Files involved:\n- ${existingFiles.join('\n- ')}`
        );
      }
    }
    
    console.log('Conflict check complete');
  }
  
  // Run the check after the page has loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkConflictGroups);
  } else {
    checkConflictGroups();
  }
})();
