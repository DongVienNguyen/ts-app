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
  console.log('🔧 Cài đặt Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache tài nguyên tĩnh
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Cache tài nguyên tĩnh');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Preload tài nguyên quan trọng
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('⚡ Preload tài nguyên quan trọng');
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
      console.log('✅ Service Worker cài đặt thành công');
      return self.skipWaiting(); // Kích hoạt ngay lập tức
    })
  );
});

// Kích hoạt Service Worker với dọn dẹp cache cũ
self.addEventListener('activate', (event) => {
  console.log('🚀 Kích hoạt Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Dọn dẹp cache cũ
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('🗑️ Xóa cache cũ:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Kiểm soát tất cả client
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker đã kích hoạt');
      
      // Thông báo cho tất cả client về phiên bản mới
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
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
    console.log('🌐 Network không khả dụng, dùng cache');
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

// Xử lý push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Nhận push notification');
  
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Thông báo từ TS Manager',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'ts-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200], // Rung cho mobile
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
      self.registration.showNotification(data.title || 'TS Manager', options)
    );
  } catch (error) {
    console.error('❌ Lỗi push notification:', error);
  }
});

// Xử lý click notification - Cải thiện để chuyển đến trang thông báo
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Click notification');
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/notifications';
  const notificationId = notificationData.notificationId;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Tìm tab đã mở TS Manager
        const existingClient = clients.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (existingClient) {
          // Focus tab hiện tại và navigate đến trang thông báo
          return existingClient.focus().then(() => {
            // Gửi message để navigate đến trang thông báo cụ thể
            existingClient.postMessage({
              type: 'NAVIGATE_TO_NOTIFICATION',
              url: targetUrl,
              notificationId: notificationId,
              action: event.action || 'view'
            });
          });
        } else {
          // Mở tab mới và chuyển đến trang thông báo
          const fullUrl = `${self.location.origin}${targetUrl}${notificationId ? `?id=${notificationId}` : ''}`;
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});

// Xử lý messages từ main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Bỏ qua chờ đợi...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Thực hiện các tác vụ background
      Promise.resolve()
    );
  }
});

// Kiểm tra cập nhật định kỳ (tối ưu hóa)
let updateCheckInterval;

function startUpdateCheck() {
  // Kiểm tra mỗi 30 giây thay vì 10 giây để tiết kiệm tài nguyên
  updateCheckInterval = setInterval(() => {
    console.log('🔍 Kiểm tra cập nhật...');
    self.registration.update();
  }, 30000);
}

function stopUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
}

// Bắt đầu kiểm tra cập nhật khi SW active
startUpdateCheck();

// Dừng kiểm tra khi không cần thiết
self.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopUpdateCheck();
  } else {
    startUpdateCheck();
  }
});

console.log('✅ Service Worker tải thành công với tối ưu hóa');