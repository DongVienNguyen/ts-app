import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RealTimeMetrics {
  loginAttempts: number;
  failedLogins: number;
  successfulLogins: number;
  accountLocks: number;
  passwordResets: number;
  suspiciousActivities: number;
}

interface RealTimeMetricsCardProps {
  metrics: RealTimeMetrics;
  isRealTimeEnabled: boolean;
}

export function RealTimeMetricsCard({ metrics, isRealTimeEnabled }: RealTimeMetricsCardProps) {
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
          <span>Số liệu thời gian thực (5 phút qua)</span>
          {isRealTimeEnabled && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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