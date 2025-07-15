// public/sw.js
console.log('Service Worker: Script loading.');

self.addEventListener('install', event => {
  console.log('Service Worker: Event "install" received. Attempting to install...');
  event.waitUntil(
    self.skipWaiting().then(() => console.log('Service Worker: skipWaiting() completed, worker will activate.'))
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Event "activate" received. Worker is now active.');
  event.waitUntil(
    self.clients.claim().then(() => console.log('Service Worker: clients.claim() completed, worker now controls the page.'))
  );
});

self.addEventListener('push', event => {
  console.log('Service Worker: Event "push" received.');

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
      data: data.data
    };

    console.log('Service Worker: Showing notification with options:', options);
    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => console.log('Service Worker: Notification shown successfully.'))
        .catch(err => console.error('Service Worker: Error showing notification:', err))
    );
  } catch (e) {
    console.error('Error processing push event:', e);
    event.waitUntil(
      self.registration.showNotification('Bạn có thông báo mới', {
        body: 'Không thể hiển thị nội dung. Vui lòng mở ứng dụng để xem.',
        icon: '/icon-192x192.png'
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Event "notificationclick" received.');
  event.notification.close();

  const notificationData = event.notification.data;
  console.log('Service Worker: Notification data:', notificationData);
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if ('focus' in client) {
          console.log('Service Worker: Found an open client, focusing and sending message.');
          client.postMessage({ type: 'NAVIGATE_TO_NOTIFICATION', url: urlToOpen });
          return client.focus();
        }
      }

      if (clients.openWindow) {
        console.log('Service Worker: No open client found, opening a new window.');
        return clients.openWindow(urlToOpen);
      }
    })
  );
});