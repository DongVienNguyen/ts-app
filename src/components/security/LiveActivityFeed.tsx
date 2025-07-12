import { Activity, Clock, Eye, CheckCircle, AlertTriangle, Lock, Unlock, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SecurityEvent } from '@/utils/realTimeSecurityUtils';
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'LOGIN_FAILED':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'ACCOUNT_LOCKED':
        return <Lock className="w-4 h-4 text-orange-500" />;
      case 'ACCOUNT_UNLOCKED':
        return <Unlock className="w-4 h-4 text-blue-500" />;
      case 'PASSWORD_RESET_SUCCESS':
        return <Key className="w-4 h-4 text-purple-500" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'RATE_LIMIT_EXCEEDED':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: SecurityEvent) => {
    const descriptions: Record<string, string> = {
      'LOGIN_SUCCESS': 'Đăng nhập thành công',
      'LOGIN_FAILED': 'Đăng nhập thất bại',
      'ACCOUNT_LOCKED': 'Tài khoản bị khóa',
      'ACCOUNT_UNLOCKED': 'Tài khoản được mở khóa',
      'PASSWORD_RESET_SUCCESS': 'Đổi mật khẩu thành công',
      'PASSWORD_RESET_FAILED': 'Đổi mật khẩu thất bại',
      'RATE_LIMIT_EXCEEDED': 'Vượt quá giới hạn thử',
      'SUSPICIOUS_ACTIVITY': 'Hoạt động đáng nghi',
      'SECURITY_ALERT_TRIGGERED': 'Cảnh báo bảo mật được kích hoạt',
      'METRICS_RESET': 'Đặt lại số liệu thống kê'
    };
    return descriptions[event.type] || event.type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Luồng Hoạt động Trực tiếp</span>
          {isRealTimeEnabled && (
            <Badge variant="outline" className="ml-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Đang tải dữ liệu...</span>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                {getEventIcon(event.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{getEventDescription(event)}</span>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span title={new Date(event.timestamp).toLocaleString('vi-VN')}>
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                  </div>
                  {event.data?.username && (
                    <p className="text-sm text-gray-600">Người dùng: {event.data.username}</p>
                  )}
                  {event.data?.message && (
                    <p className="text-sm text-gray-600">{event.data.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có hoạt động bảo mật nào được ghi nhận</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}