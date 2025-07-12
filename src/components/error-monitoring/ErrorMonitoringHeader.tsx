import { RefreshCw, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RealTimeStatusIndicator } from './RealTimeStatusIndicator';

interface ErrorMonitoringHeaderProps {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  realtimeStatus: 'connecting' | 'connected' | 'error';
}

export function ErrorMonitoringHeader({ lastUpdated, isRefreshing, onRefresh, realtimeStatus }: ErrorMonitoringHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Giám sát Hệ thống</h1>
        <p className="text-muted-foreground">
          {lastUpdated ? `Cập nhật lần cuối: ${formatDistanceToNow(lastUpdated, { addSuffix: true, locale: vi })}` : 'Đang tải...'}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <RealTimeStatusIndicator status={realtimeStatus} />
        <Button onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Làm mới
        </Button>
      </div>
    </div>
  );
}