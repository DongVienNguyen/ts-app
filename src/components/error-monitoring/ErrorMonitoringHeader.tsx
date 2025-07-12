import { RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ErrorMonitoringHeaderProps {
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  realtimeStatus: 'connecting' | 'connected' | 'error';
}

export function ErrorMonitoringHeader({
  isLoading,
  isRefreshing,
  lastUpdated,
  onRefresh,
  realtimeStatus,
}: ErrorMonitoringHeaderProps) {
  const getStatusIndicator = () => {
    switch (realtimeStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-spin" />
            <span>Connecting...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>Disconnected</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Giám sát Hệ thống</h1>
        <p className="text-muted-foreground">
          Tổng quan về lỗi, hiệu suất và trạng thái các dịch vụ.
        </p>
      </div>
      <div className="flex items-center gap-4">
        {isLoading ? (
          <Skeleton className="h-9 w-48" />
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Cập nhật lần cuối: {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : 'N/A'}</span>
              </div>
              {getStatusIndicator()}
            </div>
            <Button onClick={onRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}