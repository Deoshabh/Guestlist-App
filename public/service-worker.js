// Guest Management Service Worker with Enhanced Caching

const CACHE_NAME = 'guest-management-v1';
const DYNAMIC_CACHE = 'guest-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/static/media/logo.png',
  // Add other static assets here
];

// API endpoints to handle specially
const API_ROUTES = [
  '/api/guests',
  '/api/guest-groups',
  '/guests/export'
];

// Install event - Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('Error during service worker install:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Apply caching strategies
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle API requests (network first with cache fallback)
  if (API_ROUTES.some(route => requestUrl.pathname.includes(route))) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static assets (cache first with network fallback)
  event.respondWith(handleStaticAsset(event.request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Clone the response to cache it and return the original
    const responseToCache = response.clone();
    
    // Cache the successful response
    caches.open(DYNAMIC_CACHE).then(cache => {
      // Only cache successful responses
      if (responseToCache.status === 200) {
        // Set a custom header to mark this as a cached response
        const headers = new Headers(responseToCache.headers);
        headers.append('X-Cache-Date', new Date().toISOString());
        
        // Create a new response with the updated headers
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        
        cache.put(request, cachedResponse);
      }
    });
    
    return response;
  } catch (error) {
    console.log('Network request failed, trying cache', error);
    
    // If network fails, try the cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If nothing in cache either, return a custom offline response
    return createOfflineResponse(request);
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const response = await fetch(request);
    
    // Cache the new response
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Failed to fetch from network:', error);
    
    // For image failures, return a placeholder
    if (request.destination === 'image') {
      return caches.match('/static/media/placeholder.png');
    }
    
    // For other failures, create an appropriate offline response
    return createOfflineResponse(request);
  }
}

// Create an appropriate offline response
function createOfflineResponse(request) {
  if (request.destination === 'document') {
    return caches.match('/offline.html');
  }
  
  // Default offline response
  return new Response('Network error occurred. Please check your connection.', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
}
