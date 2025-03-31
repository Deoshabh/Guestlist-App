// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Export a function to detect if a service worker is registered
export function checkServiceWorkerRegistration() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistration()
      .then(registration => {
        return !!registration; // Convert to boolean
      })
      .catch(error => {
        console.error('Error checking for service worker:', error);
        return false;
      });
  }
  return Promise.resolve(false);
}

// Send message to service worker
export function sendMessageToServiceWorker(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return true;
  }
  return false;
}

// Tell service worker to cache important URLs
export function cacheUrls(urls) {
  return sendMessageToServiceWorker({
    type: 'CACHE_URLS',
    payload: urls
  });
}

// Force service worker to activate immediately
export function forceActivateServiceWorker() {
  return sendMessageToServiceWorker({
    type: 'SKIP_WAITING'
  });
}

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
    
    // Handle service worker updates when a new version is waiting
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated');
      // Notify the app that a refresh is needed
      if (config && config.onControllerChange) {
        config.onControllerChange();
      }
    });
  }
}

const registerValidSW = (swUrl, config) => {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Add improved error handling for registration
      if (!registration) {
        console.error('Service worker registration failed: registration object is undefined');
        return;
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched
              console.log('New content is available and will be used when all tabs for this page are closed');
              
              // Log more info about the changes to help debugging
              console.log('Current controller:', navigator.serviceWorker.controller);
              console.log('New worker state:', installingWorker.state);
              
              // Show a notification to the user about the update
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached
              console.log('Content is cached for offline use.');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };

      // Add regular checks for service worker health
      const refreshInterval = 1000 * 60 * 60; // 1 hour
      setInterval(() => {
        console.log('[SW Manager] Checking for updates...');
        registration.update()
          .catch(error => console.warn('Update check failed:', error));
      }, refreshInterval);
      
      // Document what static assets are currently being used to help diagnostics
      // when troubleshooting cache problems
      console.log('[SW Manager] Current page assets:');
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.href);
      const scripts = Array.from(document.querySelectorAll('script[src]'))
        .map(script => script.src);
      const images = Array.from(document.querySelectorAll('img[src]'))
        .filter(img => img.src.startsWith(window.location.origin))
        .map(img => img.src);
        
      console.log('- Styles:', styles);
      console.log('- Scripts:', scripts);
      console.log('- Images:', images);
      
      // Ask service worker to cache key assets from the current page
      setTimeout(() => {
        const assetsToCache = [...styles, ...scripts];
        if (assetsToCache.length > 0) {
          cacheUrls(assetsToCache);
        }
      }, 2000);
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
};

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
      if (config && config.onOffline) {
        config.onOffline();
      }
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Helper to clear all service worker caches
export function clearAllCaches() {
  if ('caches' in window) {
    return caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log(`Clearing cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('All caches cleared successfully');
        return true;
      })
      .catch(error => {
        console.error('Error clearing caches:', error);
        return false;
      });
  }
  return Promise.resolve(false);
}
