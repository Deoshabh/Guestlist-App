/* eslint-disable no-restricted-globals */

// Custom service worker with better offline handling and asset caching
// Use a versioned cache name to force cache invalidation on updates
const CACHE_VERSION = '1.0.1'; // Increment this when deploying new versions
const CACHE_NAME = `guest-mgr-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `guest-mgr-dynamic-${CACHE_VERSION}`;

// Don't hardcode specific filenames, use patterns instead
// React's build process generates unique filenames with hashes
const STATIC_PATTERNS = [
  '/',
  '/index.html',
  '/static/js/',
  '/static/css/',
  '/static/media/',
  '/manifest.json',
  '/errorRecovery.js',
  '/offline.html',
  '/404.html'
];

// Keep track of cached URLs to avoid recaching
const cachedUrls = new Set();

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing new version');
  
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching important assets');
        // We only cache index.html and offline.html at install time
        // Other assets will be cached as they're requested
        return cache.addAll([
          '/',
          '/index.html',
          '/offline.html',
          '/404.html',
          '/manifest.json'
        ]);
      })
      .catch(error => console.error('[Service Worker] Install cache error:', error))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating new version');
  
  // Claim all clients so the service worker is in control immediately
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        console.log('[Service Worker] Discovered caches:', cacheNames);
        return Promise.all(
          cacheNames.filter(cacheName => {
            // Delete any old caches that don't match our current version
            return cacheName.startsWith('guest-mgr-') && 
                   !cacheName.includes(CACHE_VERSION);
          }).map(cacheName => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Helper to determine if a request is for a static asset
function isStaticAssetRequest(url) {
  const requestPath = new URL(url).pathname;
  
  // Check if the URL matches any of our static patterns
  return STATIC_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      // For directory patterns, check if the path starts with the pattern
      return requestPath.startsWith(pattern);
    } else {
      // For file patterns, check for exact match
      return requestPath === pattern;
    }
  });
}

// Helper to determine if we should cache a successful response
function shouldCacheResponse(url, response) {
  // Only cache successful responses
  if (!response || !response.ok) return false;
  
  const requestUrl = new URL(url);
  
  // Don't cache API requests
  if (requestUrl.pathname.includes('/api/')) return false;
  
  // Don't cache browser extensions or third-party resources
  if (
    requestUrl.origin !== location.origin ||
    requestUrl.pathname.includes('chrome-extension') ||
    requestUrl.pathname.includes('extension')
  ) {
    return false;
  }
  
  // Don't cache query string URLs except for essential ones
  if (requestUrl.search && !requestUrl.search.includes('source=pwa')) {
    return false;
  }
  
  // Cache HTML, CSS, JS, and image files
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html') ||
         contentType.includes('text/css') ||
         contentType.includes('application/javascript') ||
         contentType.includes('image/');
}

// Fetch event - network first, then cache with fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url);
  
  // Skip browser extension requests
  if (
    requestUrl.protocol === 'chrome-extension:' ||
    requestUrl.pathname.includes('extension')
  ) {
    return;
  }
  
  // Log all requests to help with debugging
  console.log(`[Service Worker] Fetch: ${requestUrl.pathname}`);
  
  // Handle API requests differently
  if (requestUrl.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Special handling for API failures - return a JSON error
          return new Response(
            JSON.stringify({ 
              error: true, 
              message: 'Network request failed. You appear to be offline.' 
            }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }

  // For static assets
  if (isStaticAssetRequest(event.request.url)) {
    event.respondWith(
      // Try network first
      fetch(event.request)
        .then(response => {
          // Clone the response to cache it and return it
          if (shouldCacheResponse(event.request.url, response)) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache the same URL multiple times in this session
                if (!cachedUrls.has(event.request.url)) {
                  cachedUrls.add(event.request.url);
                  cache.put(event.request, responseToCache)
                    .then(() => console.log(`[Service Worker] Cached: ${requestUrl.pathname}`))
                    .catch(err => console.warn(`[Service Worker] Cache error for ${requestUrl.pathname}:`, err));
                }
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log(`[Service Worker] Serving cached: ${requestUrl.pathname}`);
                return cachedResponse;
              }
              
              // Check if this is a navigation request
              if (event.request.mode === 'navigate' || 
                 (event.request.headers.get('accept') && 
                  event.request.headers.get('accept').includes('text/html'))) {
                console.log(`[Service Worker] Serving offline page for: ${requestUrl.pathname}`);
                return caches.match('/offline.html');
              }
              
              // For static assets that aren't in the cache, try the root index
              if (requestUrl.pathname.startsWith('/static/')) {
                return caches.match('/');
              }
              
              // If all else fails
              return new Response('Resource unavailable offline', { 
                status: 404,
                headers: { 'Content-Type': 'text/plain' } 
              });
            });
        })
    );
    return;
  }

  // For everything else (navigation requests mostly)
  event.respondWith(
    // Try from network first
    fetch(event.request)
      .then(response => {
        // Cache navigation results too
        if (shouldCacheResponse(event.request.url, response)) {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(event.request, responseToCache))
            .catch(err => console.warn('[Service Worker] Dynamic cache error:', err));
        }
        return response;
      })
      .catch(() => {
        // For navigation requests that fail, try the cache or fallback to offline page
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If it's a navigation request, show offline page
            return caches.match('/offline.html');
          });
      })
  );
});

// Handle errors better
self.addEventListener('error', event => {
  console.error('[Service Worker] Error:', event.error);
});

// Add periodic sync when available
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'sync-guests') {
      event.waitUntil(syncData());
    }
  });
}

// Data sync function placeholder
async function syncData() {
  console.log('[Service Worker] Attempting background sync');
  // Logic would be implemented by the main app
}

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.payload;
    if (Array.isArray(urls) && urls.length > 0) {
      console.log('[Service Worker] Caching additional URLs:', urls);
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => cache.addAll(urls))
      );
    }
  }
});
