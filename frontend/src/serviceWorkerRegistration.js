// This file handles registering and communicating with the service worker

// Check if current host is localhost
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Core service worker functions
const serviceWorkerUtils = {
  // Check if a service worker is registered
  isRegistered: () => {
    if (!('serviceWorker' in navigator)) return Promise.resolve(false);
    
    return navigator.serviceWorker.getRegistration()
      .then(registration => !!registration)
      .catch(() => false);
  },
  
  // Send message to the active service worker
  sendMessage: (message) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return false;
    
    navigator.serviceWorker.controller.postMessage(message);
    return true;
  },
  
  // Cache URLs in the service worker
  cacheUrls: (urls) => {
    if (!Array.isArray(urls) || urls.length === 0) return false;
    
    return serviceWorkerUtils.sendMessage({
      type: 'CACHE_URLS',
      urls: urls
    });
  },
  
  // Force the service worker to activate immediately
  skipWaiting: () => {
    return serviceWorkerUtils.sendMessage({
      type: 'SKIP_WAITING'
    });
  },
  
  // Clear all caches
  clearCaches: () => {
    if (!('caches' in window)) return Promise.resolve(false);
    
    return caches.keys()
      .then(cacheNames => Promise.all(cacheNames.map(name => caches.delete(name))))
      .then(() => true)
      .catch(() => false);
  },
  
  // Update the service worker
  update: () => {
    if (!('serviceWorker' in navigator)) return Promise.resolve(false);
    
    return navigator.serviceWorker.getRegistration()
      .then(registration => {
        if (!registration) return false;
        return registration.update()
          .then(() => true)
          .catch(() => false);
      })
      .catch(() => false);
  }
};

// Register the service worker
export function register(config = {}) {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return;
  }
  
  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    
    if (isLocalhost) {
      // Running on localhost - check for existing service worker
      checkValidServiceWorker(swUrl, config);
      
      // Log for developers
      navigator.serviceWorker.ready.then(() => {
        console.log('Service worker is active and ready');
      });
    } else {
      // Production environment - register immediately
      registerValidSW(swUrl, config);
    }
  });
  
  // Listen for service worker updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker controller active');
      
      if (config.onUpdate) {
        config.onUpdate();
      }
    });
  }
}

// Register a valid service worker
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      // Watch for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              console.log('New service worker installed, content available when tabs close');
              
              if (config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // First time install
              console.log('Service worker installed for offline use');
              
              if (config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
      
      // Cache current page assets
      setTimeout(() => {
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .map(link => link.href)
          .filter(url => url && url.startsWith(window.location.origin));
          
        const scripts = Array.from(document.querySelectorAll('script[src]'))
          .map(script => script.src)
          .filter(url => url && url.startsWith(window.location.origin));
        
        const assetsToCache = [...stylesheets, ...scripts];
        if (assetsToCache.length > 0) {
          serviceWorkerUtils.cacheUrls(assetsToCache);
        }
      }, 2000);
    })
    .catch(error => {
      console.error('Service worker registration failed:', error);
    });
}

// Verify service worker is valid
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then(response => {
      const contentType = response.headers.get('content-type');
      
      if (response.status === 404 || (contentType && !contentType.includes('javascript'))) {
        // No service worker found
        navigator.serviceWorker.ready
          .then(registration => {
            registration.unregister().then(() => {
              window.location.reload();
            });
          });
      } else {
        // Valid service worker found
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Network offline, app running in offline mode');
      
      if (config.onOffline) {
        config.onOffline();
      }
    });
}

// Unregister the service worker
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error('Error unregistering service worker:', error.message);
      });
  }
}

// Export utility functions
export const utils = serviceWorkerUtils;
