/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Ghi log khi script được đánh giá
console.log('[Service Worker] Script evaluated successfully.');

// Lắng nghe sự kiện 'install'
self.addEventListener('install', () => {
  console.log('[Service Worker] Install event fired.');
  self.skipWaiting(); // Kích hoạt Service Worker ngay lập tức
});

// Lắng nghe sự kiện 'activate'
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event fired.');
  event.waitUntil(self.clients.claim()); // Yêu cầu kiểm soát tất cả các client ngay lập tức
});

// Các chức năng precaching và xử lý push/notificationclick sẽ được thêm lại sau khi xác định nguyên nhân lỗi.