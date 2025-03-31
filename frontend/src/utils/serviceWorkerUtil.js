/**
 * Utility for handling service worker-related operations
 */

// Check if service worker is supported
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Check if app is installed (PWA mode)
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.matchMedia('(display-mode: minimal-ui)').matches || 
         window.navigator.standalone === true;
};

// Check if the app can be installed
export const canBeInstalled = async () => {
  try {
    if (!isServiceWorkerSupported()) return false;
    if (isAppInstalled()) return false;
    
    // Check for existing registrations
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration;
  } catch (error) {
    console.error('Error checking installation status:', error);
    return false;
  }
};

// Check if the app is offline
export const isOffline = () => {
  return !navigator.onLine;
};

// Force a service worker update
export const updateServiceWorker = async () => {
  try {
    if (!isServiceWorkerSupported()) return false;
    
    const registration = await navigator.serviceWorker.getRegistration();
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

// Clear all caches 
export const clearCaches = async () => {
  try {
    if (!('caches' in window)) return false;
    
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
};

// Reload the page with cache clearing
export const hardReload = async () => {
  try {
    await clearCaches();
    window.location.reload(true);
    return true;
  } catch (error) {
    console.error('Error during hard reload:', error);
    window.location.reload(true);
    return false;
  }
};

export default {
  isServiceWorkerSupported,
  isAppInstalled,
  canBeInstalled,
  isOffline,
  updateServiceWorker,
  clearCaches,
  hardReload
};
