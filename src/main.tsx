import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global error handler for React errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error);
  
  // Check if it's a React Hook error
  if (event.error?.message?.includes('useEffect') || 
      event.error?.message?.includes('Invalid hook call')) {
    console.error('🚨 React Hook Error detected');
    
    // Show user-friendly error message
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fef2f2; padding: 20px;">
          <div style="text-center; max-width: 400px;">
            <div style="width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg style="width: 32px; height: 32px; color: #dc2626;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <h1 style="font-size: 24px; font-weight: bold; color: #991b1b; margin-bottom: 16px;">Lỗi tải ứng dụng</h1>
            <p style="color: #dc2626; margin-bottom: 24px;">Có lỗi xảy ra khi khởi động React. Vui lòng tải lại trang.</p>
            <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              🔄 Tải lại trang
            </button>
            <div style="margin-top: 16px; font-size: 14px; color: #6b7280;">
              <p>Nếu lỗi vẫn tiếp tục:</p>
              <ul style="margin-top: 8px; text-align: left; list-style: none; padding: 0;">
                <li>• Xóa cache trình duyệt (Ctrl+Shift+R)</li>
                <li>• Thử trình duyệt khác</li>
                <li>• Liên hệ quản trị viên hệ thống</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }
    return;
  }
});

// Check if React is properly loaded
if (!React || !ReactDOM) {
  console.error('❌ React or ReactDOM not loaded properly');
  document.getElementById('root')!.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fef2f2;">
      <div style="text-center;">
        <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">React Loading Failed</h1>
        <p style="color: #991b1b; margin-bottom: 16px;">React framework không thể tải. Vui lòng thử lại.</p>
        <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `;
} else {
  try {
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('✅ React app rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
    document.getElementById('root')!.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #fef2f2;">
        <div style="text-center;">
          <h1 style="color: #dc2626;">Render Error</h1>
          <p style="color: #991b1b;">Failed to render React app: ${error}</p>
          <button onclick="window.location.reload()" style="background: #dc2626; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
            Reload
          </button>
        </div>
      </div>
    `;
  }
}