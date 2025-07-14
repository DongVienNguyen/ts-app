import React from 'react';
import { BarChart3 } from 'lucide-react';

const BorrowReportHeader = React.memo(() => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Báo cáo tài sản đã mượn</h1>
          <p className="text-gray-600">TS cần cắt bìa kiểm tra hàng quý</p>
        </div>
      </div>
    </div>
  );
});

BorrowReportHeader.displayName = 'BorrowReportHeader';

export default BorrowReportHeader;