/**
 * Utility functions for managing service worker and caching
 */

// Helper to check if we're online
export const isOnline = () => {
  return navigator.onLine;
};

// Get current service worker registration if available
export const getServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
};

// Force service worker update
export const updateServiceWorker = async () => {
  try {
    const registration = await getServiceWorkerRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating service worker:', error);
    return false;
  }
};

// Check if a newer version of service worker is waiting
export const hasServiceWorkerUpdate = async () => {
  try {
    const registration = await getServiceWorkerRegistration();
    return !!registration?.waiting;
  } catch (error) {
    console.error('Error checking for service worker update:', error);
    return false;
  }
};

// Force the waiting service worker to become active
export const activateWaitingServiceWorker = async () => {
  try {
    const registration = await getServiceWorkerRegistration();
    
    if (registration?.waiting) {
      // Send skip waiting message
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error activating waiting service worker:', error);
    return false;
  }
};

// Get info about the currently cached files
export const getCacheInfo = async () => {
  if (!('caches' in window)) {
    return null;
  }
  
  try {
    // Get list of all caches
    const cacheNames = await caches.keys();
    
    // Get info about each cache
    const cacheInfo = await Promise.all(
      cacheNames.map(async (name) => {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          
          return {
            name,
            count: keys.length,
            size: 'unknown', // We can't directly get the size
            urls: keys.map(req => req.url).slice(0, 10) // First 10 URLs for sample
          };
        } catch (error) {
          return { name, error: error.message };
        }
      })
    );
    
    return cacheInfo;
  } catch (error) {
    console.error('Error getting cache info:', error);
    return null;
  }
};

// Clear all caches
export const clearCaches = async () => {
  if (!('caches' in window)) {
    return false;
  }
  
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('All caches cleared');
    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
};

// Hard reload the page with cache busting
export const hardReload = async () => {
  try {
    // Clear caches first
    await clearCaches();
    
    // Add cache busting parameter
    const cacheBuster = `?cache=${Date.now()}`;
    window.location.href = window.location.pathname + cacheBuster;
    return true;
  } catch (error) {
    console.error('Error during hard reload:', error);
    // Try a normal reload as fallback
    window.location.reload(true);
    return false;
  }
};

// Check if app is in installed PWA mode
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.matchMedia('(display-mode: minimal-ui)').matches || 
         window.navigator.standalone === true;
};

// Check if the app can be installed
export const canBeInstalled = async () => {
  // If already in PWA mode, can't install again
  if (isAppInstalled()) return false;
  
  // Check for service worker support
  if (!('serviceWorker' in navigator)) return false;
  
  // Check if there's an active service worker
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration;
  } catch (error) {
    console.error('Error checking installation status:', error);
    return false;
  }
};

// Check if offline
export const isOffline = () => {
  return !navigator.onLine;
};

export default {
  isServiceWorkerSupported: () => 'serviceWorker' in navigator,
  isAppInstalled,
  canBeInstalled,
  isOffline,
  updateServiceWorker,
  clearCaches,
  hardReload
};
