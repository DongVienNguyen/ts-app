/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Explicitly declare __WB_MANIFEST as it's injected by vite-plugin-pwa
// This resolves the 'Property __WB_MANIFEST does not exist on type ServiceWorkerGlobalScope' error.
declare const __WB_MANIFEST: (string | { url: string; revision: string | null })[];

// This is injected by vite-plugin-pwa
// Access __WB_MANIFEST directly as it's a global variable in the Service Worker scope.
precacheAndRoute(__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'Thông báo mới';
    const options: NotificationOptions = {
      body: data.body || 'Bạn có một tin nhắn mới.',
      icon: '/logo192.png', // Ensure this icon exists in the public folder
      badge: '/logo192.png', // Ensure this icon exists in the public folder
      data: {
        url: data.url || '/', // URL to open on click
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    // Fallback notification
    event.waitUntil(self.registration.showNotification('Thông báo mới', {
        body: event.data.text(),
        icon: '/logo192.png',
        badge: '/logo192.png',
    }));
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url === urlToOpen ? (windowClient.focus(), true) : false
      );

      if (!hadWindowToFocus) {
        self.clients.openWindow(urlToOpen).then((windowClient) => (windowClient ? windowClient.focus() : null));
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});