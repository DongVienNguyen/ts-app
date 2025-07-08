import React from 'react';
import { Package } from 'lucide-react';

export function LoginHeader() {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-white" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Hệ thống Quản lý Tài sản
      </h2>
      <p className="text-gray-600">
        Đăng nhập để tiếp tục sử dụng hệ thống
      </p>
    </div>
  );
}