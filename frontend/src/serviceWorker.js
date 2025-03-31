const CACHE_NAME = 'guest-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo512.svg'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For API requests, try network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
  } else {
    // For non-API requests, use cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          // Clone the request since it's a stream and can only be consumed once
          const fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(
            response => {
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response for cache and return
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          );
        })
    );
  }
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle communication from the application
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// This optional code is used to register a service worker.
// register() is not called by default.

// Enhanced service worker with better error handling
// and IndexedDB sync support for offline functionality

// Check if the browser supports service workers
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Public URL from environment or default to origin
const PUBLIC_URL = process.env.PUBLIC_URL || '';

export function register(config) {
  if ('serviceWorker' in navigator) {
    console.log('Service Worker is supported in this browser');
    
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(PUBLIC_URL, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      console.warn('SERVICE WORKER: Public URL is on different origin from page - service worker will not be registered');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost
        navigator.serviceWorker.ready.then(() => {
          console.log('SERVICE WORKER: App is being served from cache by a service worker.');
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
    
    // Add offline/online event listeners for better UX
    window.addEventListener('online', () => {
      console.log('APPLICATION: Device is now online');
      // Trigger any queued sync operations
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE',
          timestamp: new Date().toISOString()
        });
      }
      // Notify the user they're back online
      if (config && config.onOnline) {
        config.onOnline();
      } else {
        // Default notification if no handler provided
        const event = new CustomEvent('app:online');
        window.dispatchEvent(event);
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('APPLICATION: Device is now offline');
      if (config && config.onOffline) {
        config.onOffline();
      } else {
        // Default notification if no handler provided
        const event = new CustomEvent('app:offline');
        window.dispatchEvent(event);
      }
    });
  } else {
    console.warn('SERVICE WORKER: Service workers are not supported in this browser');
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      console.log('SERVICE WORKER: Registered successfully');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('SERVICE WORKER: New content is available and will be used when all tabs are closed.');

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              console.log('SERVICE WORKER: Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
      
      // Set up sync manager if available for offline data synchronization
      if ('SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          // Register sync for pending actions
          registration.sync.register('syncPendingActions').then(() => {
            console.log('SERVICE WORKER: Background sync registered for pending actions');
          }).catch(error => {
            console.error('SERVICE WORKER: Background sync registration failed:', error);
          });
        });
      } else {
        console.warn('SERVICE WORKER: Background sync is not supported in this browser');
        // Fallback for browsers without SyncManager support
        // You might want to implement a manual sync here
      }
    })
    .catch(error => {
      console.error('SERVICE WORKER: Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        console.warn('SERVICE WORKER: No service worker found. Reloading page...');
        navigator.serviceWorker.ready.then(registration => {
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
      console.log('SERVICE WORKER: No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error('SERVICE WORKER: Error unregistering service worker:', error);
      });
  }
}
