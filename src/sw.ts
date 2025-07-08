/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Ghi log khi script được đánh giá
console.log('[Service Worker] Script evaluated successfully.');

// self.__WB_MANIFEST được chèn bởi plugin PWA.
// Đây là danh sách các URL cần được precache.
try {
  cleanupOutdatedCaches()
  precacheAndRoute(self.__WB_MANIFEST || [])
  console.log('[Service Worker] Precaching configured.');
} catch (error) {
  console.error('[Service Worker] Precaching failed:', error);
}

// Lắng nghe sự kiện 'install'
self.addEventListener('install', () => {
  console.log('[Service Worker] Install event fired.');
  self.skipWaiting(); // Kích hoạt service worker mới ngay khi cài đặt xong.
});

// Lắng nghe sự kiện 'activate'
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event fired.');
  event.waitUntil(self.clients.claim()); // Trở thành service worker đang hoạt động cho tất cả các client.
});

// Lắng nghe sự kiện push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const title = data.title || 'Thông báo mới';
    const options: NotificationOptions = {
      body: data.body || 'Bạn có một tin nhắn mới.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    // Fallback cho văn bản thuần
    const title = 'Thông báo mới';
    const options: NotificationOptions = {
      body: event.data.text(),
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        url: '/',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Lắng nghe sự kiện click vào thông báo
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // Nếu có một cửa sổ của app đang mở, focus vào nó
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url === urlToOpen ? (windowClient.focus(), true) : false
      );

      // Ngược lại, mở một cửa sổ mới
      if (!hadWindowToFocus) {
        self.clients.openWindow(urlToOpen).then((windowClient) => (windowClient ? windowClient.focus() : null));
      }
    })
  );
});