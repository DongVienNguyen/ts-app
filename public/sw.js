const CACHE_NAME = 'asset-management-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const API_CACHE = 'api-v2';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/.*$/,
  /supabase\.co\/.*$/
];

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  STATIC: 365 * 24 * 60 * 60, // 1 year
  DYNAMIC: 7 * 24 * 60 * 60,  // 1 week
  API: 5 * 60,                // 5 minutes
  IMAGES: 30 * 24 * 60 * 60   // 30 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Bypass service worker for Supabase API calls to prevent caching conflicts
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    console.log('🌐 Bypassing SW cache for Supabase API:', request.url);
    return event.respondWith(fetch(request));
  }
  
  // Determine caching strategy based on request type
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  let cacheName = DYNAMIC_CACHE;
  let maxAge = CACHE_DURATIONS.DYNAMIC;
  
  // Static assets (JS, CSS, fonts)
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
    cacheName = STATIC_CACHE;
    maxAge = CACHE_DURATIONS.STATIC;
  }
  
  // Images
  else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
    cacheName = STATIC_CACHE;
    maxAge = CACHE_DURATIONS.IMAGES;
  }
  
  // API calls (other than Supabase, which is bypassed above)
  else if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    cacheName = API_CACHE;
    maxAge = CACHE_DURATIONS.API;
  }
  
  // HTML pages
  else if (request.headers.get('accept')?.includes('text/html')) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
    cacheName = DYNAMIC_CACHE;
    maxAge = CACHE_DURATIONS.DYNAMIC;
  }
  
  event.respondWith(
    handleRequest(request, strategy, cacheName, maxAge)
  );
});

// Handle different caching strategies
async function handleRequest(request, strategy, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache, maxAge);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache, maxAge);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache, maxAge);
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cache.match(request);
      
    default:
      return networkFirst(request, cache, maxAge);
  }
}

// Cache first strategy
async function cacheFirst(request, cache, maxAge) {
  try {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      console.log('📦 Cache hit:', request.url);
      return cachedResponse;
    }
    
    console.log('🌐 Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Cache first failed:', error);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network error', { status: 408 });
  }
}

// Network first strategy
async function networkFirst(request, cache, maxAge) {
  try {
    console.log('🌐 Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📦 Network failed, trying cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return cache.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 408 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  // Always fetch in background
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    return networkResponse;
  }).catch((error) => {
    console.error('❌ Background fetch failed:', error);
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('📦 Stale cache hit:', request.url);
    return cachedResponse;
  }
  
  // Wait for network if no cache
  console.log('🌐 No cache, waiting for network:', request.url);
  return fetchPromise;
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const age = (now - responseTime) / 1000;
  
  return age > maxAge;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when back online
  console.log('🔄 Performing background sync...');
  
  // This would sync any offline data
  // Implementation depends on your specific needs
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Xem chi tiết',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Đóng',
        icon: '/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Asset Management', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/notifications')
    );
  }
});

// Cache management utilities
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'CACHE_STATS') {
    const stats = await getCacheStats();
    event.ports[0].postMessage(stats);
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    await clearAllCaches();
    event.ports[0].postMessage({ success: true });
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🗑️ All caches cleared');
}