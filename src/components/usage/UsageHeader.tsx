import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UsageHeaderProps {
  selectedTimeRange: 'day' | 'week' | 'month' | 'quarter' | 'year';
  lastUpdated: Date;
  onTimeRangeChange: (value: 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
  onRefresh: () => void;
}

export function UsageHeader({
  selectedTimeRange,
  lastUpdated,
  onTimeRangeChange,
  onRefresh
}: UsageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <span>Theo dõi Sử dụng</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Thống kê và phân tích hành vi người dùng
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Select value={selectedTimeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">24 giờ</SelectItem>
            <SelectItem value="week">7 ngày</SelectItem>
            <SelectItem value="month">30 ngày</SelectItem>
            <SelectItem value="quarter">3 tháng</SelectItem>
            <SelectItem value="year">1 năm</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-gray-500">
          Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>
    </div>
  );
}