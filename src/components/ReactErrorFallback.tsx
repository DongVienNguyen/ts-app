import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ReactErrorFallback: React.FC = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="react-error-fallback">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-red-800 mb-4">React Loading Error</h1>
        <p className="text-red-600 mb-6">
          Có lỗi xảy ra khi tải React. Vui lòng thử tải lại trang.
        </p>
        <button 
          onClick={handleReload}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Tải lại trang
        </button>
        <div className="mt-4 text-sm text-gray-500">
          <p>Nếu lỗi vẫn tiếp tục, vui lòng:</p>
          <ul className="mt-2 text-left">
            <li>• Xóa cache trình duyệt</li>
            <li>• Thử trình duyệt khác</li>
            <li>• Liên hệ quản trị viên</li>
          </ul>
        </div>
      </div>
    </div>
  );
};