import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BellOff, CheckCircle } from 'lucide-react';
import { SystemAlert, getSeverityColor } from '@/utils/errorTracking';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import clsx from 'clsx'; // Import clsx

interface SystemAlertsDisplayProps {
  alerts: SystemAlert[];
  onAcknowledge: (alertId: string) => Promise<void>;
  isLoading: boolean;
}

export const SystemAlertsDisplay = ({ alerts, onAcknowledge, isLoading }: SystemAlertsDisplayProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cảnh báo hệ thống đang hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Đang tải cảnh báo...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cảnh báo hệ thống đang hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-6">
            <BellOff className="mx-auto h-10 w-10 mb-2" />
            <p>Không có cảnh báo nào đang hoạt động.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cảnh báo hệ thống đang hoạt động ({alerts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={clsx(
              "flex items-start justify-between p-3 rounded-lg border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/30",
              { 'new-item-highlight': alert.isNew } // Apply highlight class
            )}>
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className={`font-semibold ${getSeverityColor(alert.severity)}`}>{alert.message}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(alert.created_at!), { addSuffix: true, locale: vi })}
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="ml-4">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Ghi nhận
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận ghi nhận cảnh báo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này sẽ đánh dấu cảnh báo là đã được xem xét. Bạn có chắc chắn muốn tiếp tục?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onAcknowledge(alert.id!)}>Xác nhận</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};