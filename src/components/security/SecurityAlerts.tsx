import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SystemAlert } from '@/hooks/useRealTimeSecurityMonitoring';
import { formatRelativeTime } from '@/utils/dateUtils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SecurityAlertsProps {
  alerts: SystemAlert[];
  isLoading: boolean;
  onAcknowledge: (alertId: string) => Promise<void>; // Changed to Promise<void>
}

export function SecurityAlerts({ alerts, isLoading, onAcknowledge }: SecurityAlertsProps) {
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);

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

  const getSeverityBadge = (severity: string) => {
    const severityMap: { [key: string]: string } = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return (
      <Badge className={`${severityMap[severity] || 'bg-gray-500'} text-white`}>
        {severity}
      </Badge>
    );
  };

  const handleAcknowledge = () => {
    if (selectedAlert) {
      onAcknowledge(selectedAlert.id);
      setSelectedAlert(null);
    }
  };

  return (
    <>
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
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100"
                  onClick={() => setSelectedAlert(alert)}
                >
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="font-medium text-red-800">{alert.rule_name}</p>
                    <p className="text-sm text-red-700">{alert.message}</p>
                  </div>
                  <span className="text-xs text-red-600 whitespace-nowrap">
                    {formatRelativeTime(alert.created_at!)}
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

      <Dialog open={!!selectedAlert} onOpenChange={(isOpen) => !isOpen && setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getAlertIcon(selectedAlert.severity)}
              Chi tiết Cảnh báo
            </DialogTitle>
            <DialogDescription>
              {selectedAlert?.rule_name}
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <span className="font-medium">Mức độ:</span>
                {getSeverityBadge(selectedAlert.severity)}
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Thời gian:</span>
                <span>{new Date(selectedAlert.created_at!).toLocaleString('vi-VN')}</span>
              </div>
              <div>
                <p className="font-medium mb-1">Thông điệp:</p>
                <p className="p-2 bg-gray-100 rounded">{selectedAlert.message}</p>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Metric:</span>
                <code>{selectedAlert.metric}</code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Giá trị hiện tại:</span>
                <span>{selectedAlert.current_value}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ngưỡng:</span>
                <span>{selectedAlert.threshold}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>Đóng</Button>
            <Button onClick={handleAcknowledge}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Đã giải quyết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}