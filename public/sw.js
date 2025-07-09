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

// Install event - cache static assets and activate immediately
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
        // Force immediate activation - no waiting
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate event - clean old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches aggressively
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated and took control');
      
      // Force reload all clients to get latest version
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          console.log('🔄 Reloading client for update...');
          client.navigate(client.url);
        });
      });
    })
  );
});

// Fetch event - always try network first for HTML, then cache
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
  
  // For HTML documents, always try network first
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request) || caches.match('/');
        })
    );
    return;
  }
  
  // For other resources, use cache-first with background update
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Always fetch in background to update cache
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              const cacheName = isStaticAsset(request.url) ? STATIC_CACHE : DYNAMIC_CACHE;
              caches.open(cacheName).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => null);
        
        // Return cached version immediately if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise wait for network
        return fetchPromise || new Response('Offline', { status: 503 });
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
      actions: [
        {
          action: 'view',
          title: 'Xem chi tiết',
          icon: '/icon-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Đóng',
          icon: '/icon-192x192.png'
        }
      ],
      data: {
        url: '/notifications',
        ...data.data
      }
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
  
  const urlToOpen = event.notification.data?.url || '/notifications';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Check if there's any window/tab open
        for (const client of clients) {
          if ('focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
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

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background tasks
      Promise.resolve()
    );
  }
});

// Periodic update check
setInterval(() => {
  console.log('🔍 Checking for updates...');
  self.registration.update();
}, 30000); // Check every 30 seconds

console.log('✅ Service Worker loaded successfully');