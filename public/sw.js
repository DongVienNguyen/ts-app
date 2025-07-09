const CACHE_NAME = 'ts-manager-v' + Date.now(); // Dynamic cache name
const STATIC_CACHE = 'ts-static-v' + Date.now();
const DYNAMIC_CACHE = 'ts-dynamic-v' + Date.now();

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Old caches cleaned');
        return self.clients.claim(); // Take control immediately
      })
      .catch((error) => {
        console.error('❌ Cache cleanup failed:', error);
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('📦 Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone response for caching
            const responseClone = networkResponse.clone();
            
            // Determine cache strategy
            const cacheName = isStaticAsset(request.url) ? STATIC_CACHE : DYNAMIC_CACHE;
            
            // Cache the response
            caches.open(cacheName)
              .then((cache) => {
                console.log('💾 Caching:', request.url);
                cache.put(request, responseClone);
              })
              .catch((error) => {
                console.error('❌ Caching failed:', error);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('❌ Network request failed:', error);
            
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/') || new Response('Offline', { status: 503 });
            }
            
            throw error;
          });
      })
  );
});

// Helper function to determine if asset is static
function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(url) ||
         url.includes('/assets/') ||
         url.includes('manifest.json');
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Thông báo từ TS Manager',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'ts-notification',
      requireInteraction: false,
      actions: data.actions || [],
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'TS Manager', options)
    );
  } catch (error) {
    console.error('❌ Push notification error:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting...');
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background tasks
      Promise.resolve()
    );
  }
});

console.log('✅ Service Worker loaded successfully');