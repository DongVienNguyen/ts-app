const CACHE_VERSION = 'v' + Date.now();
const STATIC_CACHE = `ts-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ts-dynamic-${CACHE_VERSION}`;
const API_CACHE = `ts-api-${CACHE_VERSION}`;

// Tài nguyên tĩnh cần cache ngay lập tức
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.png'
];

// Tài nguyên quan trọng cần cache với ưu tiên cao
const CRITICAL_ASSETS = [
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/Layout.tsx'
];

// API endpoints cần cache
const API_ENDPOINTS = [
  '/rest/v1/notifications',
  '/rest/v1/staff',
  '/rest/v1/asset_reminders'
];

// Cài đặt Service Worker với tối ưu hóa
self.addEventListener('install', (event) => {
  console.log('🔧 Installing Service Worker silently...');
  
  event.waitUntil(
    Promise.all([
      // Cache tài nguyên tĩnh
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Preload tài nguyên quan trọng
      caches.open(DYNAMIC_CACHE).then(cache => {
        return Promise.allSettled(
          CRITICAL_ASSETS.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            }).catch(() => {
              // Bỏ qua lỗi preload
            })
          )
        );
      })
    ]).then(() => {
      // Tự động skip waiting - không cần thông báo
      return self.skipWaiting();
    })
  );
});

// Kích hoạt Service Worker với dọn dẹp cache cũ - SILENT
self.addEventListener('activate', (event) => {
  console.log('🚀 Activating Service Worker silently...');
  
  event.waitUntil(
    Promise.all([
      // Dọn dẹp cache cũ
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes(CACHE_VERSION)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Kiểm soát tất cả client
      self.clients.claim()
    ]).then(() => {
      // KHÔNG gửi thông báo về cập nhật - silent update
      console.log('✅ Service Worker activated silently');
    })
  );
});

// Xử lý fetch với chiến lược cache thông minh
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Bỏ qua non-GET requests
  if (request.method !== 'GET') return;
  
  // Bỏ qua external requests
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('supabase')) return;
  
  // Chiến lược cho HTML documents
  if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request));
    return;
  }
  
  // Chiến lược cho API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Chiến lược cho static assets
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAssetRequest(request));
    return;
  }
  
  // Chiến lược mặc định
  event.respondWith(handleDefaultRequest(request));
});

// Xử lý HTML documents - Network First với fallback
async function handleDocumentRequest(request) {
  try {
    // Thử network trước
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      // Cache response mới
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Silent fallback - không log
  }
  
  // Fallback to cache
  const cachedResponse = await caches.match(request);
  return cachedResponse || caches.match('/');
}

// Xử lý API requests - Stale While Revalidate
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Fetch mới trong background
  const fetchPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Trả về cache ngay lập tức nếu có
  if (cachedResponse) {
    // Update cache trong background
    fetchPromise;
    return cachedResponse;
  }
  
  // Chờ network response nếu không có cache
  return fetchPromise || new Response('{"error": "Offline"}', {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Xử lý static assets - Cache First
async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Asset not found', { status: 404 });
  }
}

// Xử lý requests khác
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Helper functions
function isApiRequest(url) {
  return url.pathname.startsWith('/rest/') || 
         url.pathname.startsWith('/auth/') ||
         url.pathname.startsWith('/functions/') ||
         API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$/i.test(url.pathname) ||
         url.pathname.includes('/assets/') ||
         url.pathname.includes('manifest.json');
}

// Xử lý push notifications - CHỈ hiện khi có thông báo thật
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    // CHỈ hiện thông báo khi có nội dung thật sự
    if (!data.title || data.title.includes('Push Notifications Enabled') || 
        data.title.includes('Notifications Enabled') ||
        data.body?.includes('Push notifications unavailable')) {
      return; // Không hiện thông báo setup
    }
    
    const options = {
      body: data.body || 'Thông báo từ TS Manager',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'ts-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200],
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
        timestamp: Date.now(),
        notificationId: data.notificationId,
        ...data.data
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('❌ Lỗi push notification:', error);
  }
});

// Xử lý click notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/notifications';
  const notificationId = notificationData.notificationId;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const existingClient = clients.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (existingClient) {
          return existingClient.focus().then(() => {
            existingClient.postMessage({
              type: 'NAVIGATE_TO_NOTIFICATION',
              url: targetUrl,
              notificationId: notificationId,
              action: event.action || 'view'
            });
          });
        } else {
          const fullUrl = `${self.location.origin}${targetUrl}${notificationId ? `?id=${notificationId}` : ''}`;
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});

// Xử lý messages từ main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      Promise.resolve()
    );
  }
});

// KHÔNG có kiểm tra cập nhật định kỳ - chỉ khi load app
console.log('✅ Service Worker loaded with silent updates');