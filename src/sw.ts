/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Basic service worker without Workbox dependencies
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const pushData = event.data?.json() ?? {};

  const title = pushData.title || 'Thông báo mới';
  const options = {
    body: pushData.body || 'Bạn có một thông báo mới.',
    icon: pushData.icon || '/logo192.png',
    badge: pushData.badge || '/logo192.png',
    data: pushData.data || { url: self.location.origin },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const windowToFocus = clientsArr.find(
        (windowClient) => windowClient.url === urlToOpen
      );

      if (windowToFocus) {
        windowToFocus.focus();
      } else {
        self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Basic caching strategy for API calls
self.addEventListener('fetch', (event) => {
  // Only cache Supabase API calls
  if (event.request.url.includes('itoapoyrxxmtbbuolfhk.supabase.co')) {
    event.respondWith(
      caches.open('api-cache').then(cache => {
        return fetch(event.request).then(response => {
          // Cache successful responses
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          // Return cached version if network fails
          return cache.match(event.request);
        });
      })
    );
  }
});