import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SecurityEvent } from '@/hooks/useRealTimeSecurityMonitoring';

interface RealTimeMetrics {
  loginAttempts: number;
  failedLogins: number;
  successfulLogins: number;
  accountLocks: number;
  passwordResets: number;
  suspiciousActivities: number;
}

interface RealTimeMetricsCardProps {
  events: SecurityEvent[];
  isLoading: boolean;
  title: string;
  timeframeMinutes: number;
}

export function RealTimeMetricsCard({ events, isLoading, title, timeframeMinutes }: RealTimeMetricsCardProps) {
  const timeLimit = new Date(Date.now() - timeframeMinutes * 60 * 1000);
  const recentEvents = events.filter(event => 
    new Date(event.created_at!) > timeLimit
  );

  const metrics: RealTimeMetrics = {
    loginAttempts: recentEvents.filter(e => e.event_type === 'LOGIN_ATTEMPT').length,
    failedLogins: recentEvents.filter(e => e.event_type === 'LOGIN_FAILED').length,
    successfulLogins: recentEvents.filter(e => e.event_type === 'LOGIN_SUCCESS').length,
    accountLocks: recentEvents.filter(e => e.event_type === 'ACCOUNT_LOCKED').length,
    passwordResets: recentEvents.filter(e => e.event_type === 'PASSWORD_RESET_SUCCESS').length,
    suspiciousActivities: recentEvents.filter(e => 
      e.event_type === 'SUSPICIOUS_ACTIVITY' || e.event_type === 'RATE_LIMIT_EXCEEDED'
    ).length,
  };

  const metricItems = [
    { label: 'Thử đăng nhập', value: metrics.loginAttempts, color: 'blue' },
    { label: 'Thành công', value: metrics.successfulLogins, color: 'green' },
    { label: 'Thất bại', value: metrics.failedLogins, color: 'red' },
    { label: 'Khóa tài khoản', value: metrics.accountLocks, color: 'orange' },
    { label: 'Đổi mật khẩu', value: metrics.passwordResets, color: 'purple' },
    { label: 'Hoạt động nghi ngờ', value: metrics.suspiciousActivities, color: 'red' }
  ];

  const colorStyles: { [key: string]: string } = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>{title}</span>
          {!isLoading && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metricItems.map((item, index) => (
            <div key={index} className={`text-center p-4 rounded-lg ${colorStyles[item.color] || 'bg-gray-50 text-gray-600'}`}>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}