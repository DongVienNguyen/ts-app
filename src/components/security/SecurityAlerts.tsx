import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SecurityAlertsProps {
  recentFailedLogins: number;
  suspiciousActivities: number;
}

export function SecurityAlerts({ recentFailedLogins, suspiciousActivities }: SecurityAlertsProps) {
  return (
    <div className="space-y-4">
      {recentFailedLogins > 5 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cảnh báo cao:</strong> Phát hiện {recentFailedLogins} lần đăng nhập thất bại trong 24h qua. 
            Hệ thống có thể đang bị tấn công brute force!
          </AlertDescription>
        </Alert>
      )}

      {suspiciousActivities > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Phát hiện {suspiciousActivities} hoạt động đáng nghi. Hãy kiểm tra log chi tiết.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}