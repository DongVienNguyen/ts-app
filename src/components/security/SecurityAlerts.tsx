import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SystemAlert } from '@/hooks/useRealTimeSecurityMonitoring';
import { formatRelativeTime } from '@/utils/dateUtils';

interface SecurityAlertsProps {
  alerts: SystemAlert[];
  isLoading: boolean;
}

export function SecurityAlerts({ alerts, isLoading }: SecurityAlertsProps) {
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Cảnh báo Bảo mật</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <p className="font-medium text-red-800">{alert.rule_name}</p>
                  <p className="text-sm text-red-700">{alert.message}</p>
                </div>
                <span className="text-xs text-red-600 whitespace-nowrap">
                  {formatRelativeTime(alert.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Không có cảnh báo bảo mật nào.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}