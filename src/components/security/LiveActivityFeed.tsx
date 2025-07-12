import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, LogIn, Lock, Key, Activity, ShieldOff, Clock, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityEvent } from '@/hooks/useRealTimeSecurityMonitoring';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo } from 'react';

interface LiveActivityFeedProps {
  events: SecurityEvent[];
  isRealTimeEnabled: boolean;
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function LiveActivityFeed({ events, isRealTimeEnabled, isLoading, isRefreshing, onRefresh }: LiveActivityFeedProps) {
  
  // Debug log để kiểm tra dữ liệu
  useEffect(() => {
    console.log('🔍 [LiveActivityFeed] Events received:', events?.length || 0);
    console.log('🔍 [LiveActivityFeed] Real-time enabled:', isRealTimeEnabled);
    console.log('🔍 [LiveActivityFeed] Loading:', isLoading);
    console.log('🔍 [LiveActivityFeed] Refreshing:', isRefreshing);
    if (events && events.length > 0) {
      console.log('🔍 [LiveActivityFeed] Latest event:', events[0]);
    }
  }, [events, isRealTimeEnabled, isLoading, isRefreshing]);

  // Memoize events để tránh re-render không cần thiết
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    return [...events].sort((a, b) => 
      new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    );
  }, [events]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
        return <LogIn className="w-4 h-4 text-green-500" />;
      case 'LOGIN_FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'ACCOUNT_LOCKED':
        return <Lock className="w-4 h-4 text-red-600" />;
      case 'ACCOUNT_UNLOCKED':
        return <Key className="w-4 h-4 text-green-600" />;
      case 'PASSWORD_RESET_SUCCESS':
        return <Key className="w-4 h-4 text-blue-500" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <Activity className="w-4 h-4 text-orange-500" />;
      case 'RATE_LIMIT_EXCEEDED':
        return <ShieldOff className="w-4 h-4 text-yellow-500" />;
      case 'METRICS_RESET':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'TEST_REALTIME':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: SecurityEvent) => {
    let description = '';
    switch (event.event_type) {
      case 'LOGIN_SUCCESS':
        description = `Đăng nhập thành công bởi ${event.username || 'người dùng không xác định'}.`;
        break;
      case 'LOGIN_FAILED':
        description = `Đăng nhập thất bại bởi ${event.username || 'người dùng không xác định'}.`;
        break;
      case 'ACCOUNT_LOCKED':
        description = `Tài khoản ${event.username || 'không xác định'} đã bị khóa.`;
        break;
      case 'ACCOUNT_UNLOCKED':
        description = `Tài khoản ${event.username || 'không xác định'} đã được mở khóa.`;
        break;
      case 'PASSWORD_RESET_SUCCESS':
        description = `Đặt lại mật khẩu thành công cho ${event.username || 'người dùng không xác định'}.`;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        description = `Hoạt động đáng ngờ từ ${event.username || 'người dùng không xác định'}.`;
        break;
      case 'RATE_LIMIT_EXCEEDED':
        description = `Vượt quá giới hạn tốc độ bởi ${event.username || 'người dùng không xác định'}.`;
        break;
      case 'METRICS_RESET':
        description = `Số liệu đã được đặt lại bởi ${(event.event_data as Record<string, any>)?.resetBy || 'hệ thống'}.`;
        break;
      case 'TEST_REALTIME':
        description = `🧪 Test real-time: ${(event.event_data as Record<string, any>)?.message || 'Test event'}`;
        break;
      default:
        description = `Sự kiện: ${event.event_type} từ ${event.username || 'người dùng không xác định'}.`;
    }
    return description;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Dòng Hoạt động Trực tiếp</span>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isRealTimeEnabled ? (
              <span className="text-xs text-green-500 flex items-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="ml-1">Trực tiếp</span>
              </span>
            ) : (
              <span className="text-xs text-gray-500">Tạm dừng</span>
            )}
          </div>
        </CardTitle>
        {/* Debug info - chỉ hiển thị trong development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 space-y-1">
            <div>Debug: {sortedEvents?.length || 0} events, Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Real-time: {isRealTimeEnabled ? 'Enabled' : 'Disabled'}</div>
            <div>Refreshing: {isRefreshing ? 'Yes' : 'No'}</div>
            <div>Last update: {new Date().toLocaleTimeString()}</div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sortedEvents && sortedEvents.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {sortedEvents.map((event, index) => (
                <div 
                  key={`${event.id}-${index}`} 
                  className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors border-l-2 border-l-blue-200"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getEventDescription(event)}</p>
                    <p className="text-xs text-gray-500">
                      {event.ip_address && `IP: ${event.ip_address} - `}
                      {event.user_agent && `Agent: ${event.user_agent.substring(0, 30)}... - `}
                      {formatRelativeTime(event.created_at!)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Không có hoạt động bảo mật gần đây</p>
            <p className="text-sm">Các sự kiện bảo mật sẽ xuất hiện ở đây khi chúng xảy ra.</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="mt-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}