import { Bug, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMonitoringHeaderProps {
  isLoading: boolean; // Thêm prop này
  lastUpdated: Date;
  onRefresh: () => void;
}

export function ErrorMonitoringHeader({ lastUpdated, onRefresh }: ErrorMonitoringHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-3">
          <Bug className="w-8 h-8 text-red-600" />
          <span>Theo dõi Lỗi Hệ thống</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Giám sát và phân tích lỗi, hiệu suất và trạng thái dịch vụ
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>
    </div>
  );
}