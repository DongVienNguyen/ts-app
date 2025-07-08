const CACHE_NAME = 'asset-management-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event);
  
  let notificationData = {
    title: 'Thông báo mới',
    body: 'Bạn có thông báo mới từ hệ thống quản lý tài sản',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'asset-notification',
    requireInteraction: true,
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
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📋 Push data:', data);
      
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        tag: data.tag || notificationData.tag,
        data: data
      };
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('✅ Notification displayed successfully');
      })
      .catch((error) => {
        console.error('❌ Error showing notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
        .then((windowClient) => {
          console.log('🪟 App window opened');
          return windowClient;
        })
        .catch((error) => {
          console.error('❌ Error opening window:', error);
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('❌ Notification dismissed');
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Check if app is already open
          for (let client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              console.log('🎯 Focusing existing window');
              return client.focus();
            }
          }
          
          // Open new window if app is not open
          if (clients.openWindow) {
            console.log('🆕 Opening new window');
            return clients.openWindow('/');
          }
        })
        .catch((error) => {
          console.error('❌ Error handling notification click:', error);
        })
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'asset-sync') {
    event.waitUntil(
      // Handle offline asset submissions
      syncAssetData()
        .then(() => {
          console.log('✅ Asset data synced successfully');
        })
        .catch((error) => {
          console.error('❌ Error syncing asset data:', error);
        })
    );
  }
});

// Function to sync asset data when back online
async function syncAssetData() {
  try {
    // Get pending submissions from IndexedDB or localStorage
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingAssetSubmissions') || '[]');
    
    if (pendingSubmissions.length === 0) {
      console.log('📭 No pending submissions to sync');
      return;
    }

    console.log(`📤 Syncing ${pendingSubmissions.length} pending submissions...`);

    // Process each pending submission
    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/asset-transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission)
        });

        if (response.ok) {
          console.log('✅ Submission synced:', submission.id);
        } else {
          console.error('❌ Failed to sync submission:', submission.id);
        }
      } catch (error) {
        console.error('❌ Error syncing individual submission:', error);
      }
    }

    // Clear pending submissions after sync
    localStorage.removeItem('pendingAssetSubmissions');
    console.log('🧹 Cleared pending submissions');

  } catch (error) {
    console.error('❌ Error in syncAssetData:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting...');
    self.skipWaiting();
  }
});

console.log('🎉 Service Worker script loaded successfully');