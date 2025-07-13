import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, ServerCrash, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SystemStatus } from '@/utils/errorTracking';

interface EmailMetricProps {
  status?: SystemStatus;
  isLoading: boolean;
}

export const EmailMetric: React.FC<EmailMetricProps> = ({ status, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Dịch vụ Email</CardTitle>
          <Skeleton className="h-6 w-6 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusInfo = () => {
    if (!status) {
      return { Icon: AlertTriangle, color: 'text-gray-500', text: 'Chưa có dữ liệu' };
    }
    switch (status.status) {
      case 'online':
        return { Icon: Mail, color: 'text-green-500', text: 'Hoạt động' };
      case 'offline':
        return { Icon: ServerCrash, color: 'text-red-500', text: 'Ngoại tuyến' };
      default:
        return { Icon: AlertTriangle, color: 'text-yellow-500', text: 'Trạng thái không xác định' };
    }
  };

  const { Icon, color, text } = getStatusInfo();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Dịch vụ Email</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{text}</div>
        <p className="text-xs text-muted-foreground">
          {status ? `Phản hồi: ${status.response_time_ms}ms` : 'Chưa có lần kiểm tra nào'}
        </p>
      </CardContent>
    </Card>
  );
};