import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const startTime = performance.now();

console.log('🚀 Asset Management System starting...');
console.log('📍 Current URL:', window.location.href);
console.log('🌐 User Agent:', navigator.userAgent);

// Create root element check
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = `
    <div style="
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      background: #ffffff; 
      color: #111827;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="text-align: center; max-width: 400px; padding: 2rem;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">❌ Lỗi khởi tạo</h1>
        <p style="margin-bottom: 1rem;">Không tìm thấy root element. Vui lòng kiểm tra file index.html.</p>
        <button onclick="window.location.reload()" style="
          background: #10b981; 
          color: white; 
          border: none; 
          padding: 0.5rem 1rem; 
          border-radius: 0.375rem; 
          cursor: pointer;
        ">
          🔄 Tải lại trang
        </button>
      </div>
    </div>
  `;
} else {
  console.log('✅ Root element found');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );

    const endTime = performance.now();
    console.log(`✅ App initialized in ${(endTime - startTime).toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Failed to render React app:', error);
    
    // Fallback UI
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        background: #ffffff; 
        color: #111827;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="text-align: center; max-width: 500px; padding: 2rem;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">❌ Lỗi React</h1>
          <p style="margin-bottom: 1rem;">Có lỗi xảy ra khi khởi tạo ứng dụng React.</p>
          <details style="margin-bottom: 1rem; text-align: left;">
            <summary style="cursor: pointer; font-weight: bold;">Chi tiết lỗi</summary>
            <pre style="
              background: #f3f4f6; 
              padding: 1rem; 
              border-radius: 0.375rem; 
              overflow: auto; 
              font-size: 0.875rem;
              margin-top: 0.5rem;
            ">${error}</pre>
          </details>
          <button onclick="window.location.reload()" style="
            background: #10b981; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 0.375rem; 
            cursor: pointer;
            margin-right: 0.5rem;
          ">
            🔄 Tải lại trang
          </button>
          <button onclick="localStorage.clear(); window.location.reload();" style="
            background: #f59e0b; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 0.375rem; 
            cursor: pointer;
          ">
            🧹 Xóa cache và tải lại
          </button>
        </div>
      </div>
    `;
  }
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('⚠️ SW registration failed: ', registrationError);
      });
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

console.log('🎯 Main.tsx execution completed');