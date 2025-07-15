// public/sw.js

// On install, activate immediately to ensure the latest version is used.
self.addEventListener('install', event => {
  console.log('Service Worker: installing...');
  event.waitUntil(self.skipWaiting());
});

// On activate, take control of all clients to apply updates without a page reload.
self.addEventListener('activate', event => {
  console.log('Service Worker: activating...');
  event.waitUntil(self.clients.claim());
});

// Listener for push events
self.addEventListener('push', event => {
  console.log('Service Worker: Push event received.');

  try {
    if (!event.data) {
      console.error('Service Worker: Push event but no data');
      return;
    }

    const data = event.data.json();
    console.log('Service Worker: Push data parsed:', data);
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      tag: data.tag,
      data: data.data // This should contain the URL to open, e.g., { url: '/error-monitoring' }
    };

    console.log('Service Worker: Showing notification with options:', options);
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
    console.log('Service Worker: Notification shown.');
  } catch (e) {
    console.error('Error processing push event:', e);
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Bạn có thông báo mới', {
        body: 'Không thể hiển thị nội dung. Vui lòng mở ứng dụng để xem.',
        icon: '/icon-192x192.png'
      })
    );
  }
});

// Listener for notification click events
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';
  const notificationId = notificationData?.id;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if a window/tab with the app is already open.
      for (const client of windowClients) {
        // If a window is open, focus it and send a message to navigate.
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE_TO_NOTIFICATION', url: urlToOpen, notificationId });
          return client.focus();
        }
      }

      // If no window is open, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});