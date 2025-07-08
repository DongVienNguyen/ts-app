/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST is injected by the PWA plugin to precache assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Caching for Supabase API calls
registerRoute(
  ({ url }) => url.origin === 'https://itoapoyrxxmtbbuolfhk.supabase.co',
  new NetworkFirst({
    cacheName: 'api-cache',
  })
);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
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

self.addEventListener('notificationclick', (event) => {
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