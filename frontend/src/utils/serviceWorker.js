/**
 * Consolidated service worker registration and utilities
 * Combines functionality from serviceWorkerRegistration.js and serviceWorkerUtil.js
 */

// Configuration with sensible defaults
const defaultConfig = {
  onSuccess: () => console.log('Service worker registered successfully'),
  onUpdate: () => console.log('New content available; please refresh'),
  onError: error => console.error('Error during service worker registration:', error),
  scope: '/',
  enabled: process.env.NODE_ENV === 'production'
};

/**
 * Register the service worker with the browser
 * @param {Object} config - Configuration options
 * @returns {Promise} - Registration promise
 */
export function register(config = {}) {
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Only register in production and if service workers are supported
  if (mergedConfig.enabled && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    
    // Our service worker won't work if PUBLIC_URL is on a different origin
    if (publicUrl.origin !== window.location.origin) {
      console.warn('Service worker cannot be registered - different origin');
      return Promise.reject(new Error('Service worker origin mismatch'));
    }

    return window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      registerValidSW(swUrl, mergedConfig);
    });
  }
  
  return Promise.resolve();
}

/**
 * Register the service worker
 * @param {string} swUrl - URL of the service worker script
 * @param {Object} config - Configuration options
 */
function registerValidSW(swUrl, config) {
  return navigator.serviceWorker
    .register(swUrl, { scope: config.scope })
    .then(registration => {
      // Success handler
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              config.onUpdate(registration);
            } else {
              // Content cached for offline use
              config.onSuccess(registration);
            }
          }
        };
      };
      
      return registration;
    })
    .catch(error => {
      config.onError(error);
      throw error;
    });
}

/**
 * Unregister the service worker
 * @returns {Promise} - Unregistration promise
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready
      .then(registration => registration.unregister())
      .catch(error => console.error('Error unregistering service worker:', error));
  }
  return Promise.resolve();
}

/**
 * Check if the service worker needs updating
 * @returns {Promise<boolean>} - Whether an update is available
 */
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready
      .then(registration => {
        return registration.update()
          .then(() => true)
          .catch(() => false);
      })
      .catch(() => false);
  }
  return Promise.resolve(false);
}

/**
 * Get the current service worker registration
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export function getRegistration() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready;
  }
  return Promise.resolve(null);
}
