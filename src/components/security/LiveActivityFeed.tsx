import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, LogIn, Lock, Key, Activity, ShieldOff, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityEvent } from '@/hooks/useRealTimeSecurityMonitoring';
import { formatRelativeTime } from '@/utils/dateUtils';

interface LiveActivityFeedProps {
  events: SecurityEvent[];
  isRealTimeEnabled: boolean;
  isLoading: boolean;
}

export function LiveActivityFeed({ events, isRealTimeEnabled, isLoading }: LiveActivityFeedProps) {
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
        description = `Số liệu đã được đặt lại bởi ${event.event_data?.resetBy || 'hệ thống'}.`;
        break;
      default:
        description = `Sự kiện không xác định: ${event.event_type}.`;
    }
    return description;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Dòng Hoạt động Trực tiếp</span>
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
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
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
            <p>Không có hoạt động bảo mật gần đây.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}