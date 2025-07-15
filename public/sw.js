// public/sw.js
console.log('Service Worker: Script loading (v2).');

self.addEventListener('install', event => {
  console.log('Service Worker: Event "install" received.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Event "activate" received.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  console.log('Service Worker: Event "push" received.');
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
    data: data.data,
  };

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(windowClients => {
    let clientIsVisible = false;
    for (const client of windowClients) {
      if (client.visibilityState === 'visible') {
        clientIsVisible = true;
        break;
      }
    }

    if (clientIsVisible) {
      console.log('Service Worker: App is visible. Sending message to client for in-app notification.');
      // Send a message to the client to show an in-app notification
      windowClients.forEach(client => {
        if (client.visibilityState === 'visible') {
          client.postMessage({
            type: 'SHOW_IN_APP_NOTIFICATION',
            payload: { title: data.title, options }
          });
        }
      });
    } else {
      console.log('Service Worker: App is not visible. Showing system notification.');
      // Show a system notification
      return self.registration.showNotification(data.title, options);
    }
  });

  event.waitUntil(promiseChain);
});


self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Event "notificationclick" received.');
  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is a window client to focus
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});