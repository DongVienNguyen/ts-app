// public/sw.js

// Listener for push events
self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      tag: data.tag,
      data: data.data // This should contain the URL to open, e.g., { url: '/error-monitoring' }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
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