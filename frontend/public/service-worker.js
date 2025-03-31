const CACHE_NAME = 'guest-app-cache-v1';
const RUNTIME_CACHE = 'guest-app-runtime';

// Use self to reference the Service Worker global scope
const serviceWorkerScope = self;

// Assets to precache at install time
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo512.svg',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js'
];

// Install handler - precaches resources
serviceWorkerScope.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell and static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => serviceWorkerScope.skipWaiting())
  );
});

// Activate handler - cleans up old caches
serviceWorkerScope.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => serviceWorkerScope.clients.claim())
  );
});

// Fetch handler - network-first for API requests, cache-first for assets
serviceWorkerScope.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(serviceWorkerScope.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  
  // For API requests, use network-first strategy
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response for caching
          const responseToCache = response.clone();
          
          // Store response in runtime cache
          caches.open(RUNTIME_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If item not in cache, return a default offline response for API
              return new Response(JSON.stringify({ error: 'You are offline' }), {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'application/json'
                })
              });
            });
        })
    );
  } else {
    // For non-API assets, use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Not in cache - get from network
          return fetch(event.request)
            .then(response => {
              // Cache valid responses
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            })
            .catch(error => {
              console.error('Fetch failed for asset:', error);
              
              // For HTML navigation requests, return the cached home page as a fallback
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
              
              return new Response('Network error occurred', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});

// Handle messages from clients (used for skipWaiting)
serviceWorkerScope.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    serviceWorkerScope.skipWaiting();
  }
});

// Handle background sync
serviceWorkerScope.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

// Handle push notifications
serviceWorkerScope.addEventListener('push', event => {
  if (event.data) {
    const notification = event.data.json();
    serviceWorkerScope.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/logo512.svg',
      badge: '/favicon.ico'
    });
  }
});

// Function to sync pending actions
function syncPendingActions() {
  // This would be implemented to talk to IndexedDB
  // For now, we'll just use a console message as a placeholder
  console.log('Background sync triggered - would process pending actions here');
  
  // In a complete implementation, this would:
  // 1. Open IndexedDB
  // 2. Get pending actions
  // 3. Send them to the server
  // 4. Delete them from the queue if successful
  return Promise.resolve();
}
