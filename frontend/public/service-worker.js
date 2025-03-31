/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

const CACHE_NAME = 'guest-manager-v1';

// List of URLs to cache initially (add your important assets here)
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico'
];

// Install a service worker
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip browser-extension requests
  if (event.request.url.includes('chrome-extension')) {
    return;
  }
  
  // Network first, then cache for API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the API response for offline use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // If fetch fails, try to get from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If not in cache, return offline fallback
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Cache first, then network for static assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Cache hit - return the response from cache
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // No cache match, we attempt to fetch it from the network
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Open cache and put the fetched response in it
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('Fetch error:', error);
            
            // For navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // For image requests, return a fallback image
            if (event.request.destination === 'image') {
              return caches.match('/images/offline-image.png');
            }
            
            // Otherwise return nothing
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});

// Clear old caches when a new service worker takes over
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the whitelist, delete it
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  
  // Immediately claim clients so the page is under this SW's control
  self.clients.claim();
});

// Listen for messages from clients (the web app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Show an offline notification when the user goes offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate' && !navigator.onLine) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/offline.html')
            .then((response) => {
              return response || new Response('You are offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});
