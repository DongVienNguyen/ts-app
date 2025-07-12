import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { SystemStatus } from '@/utils/errorTracking';
import { Skeleton } from '@/components/ui/skeleton';

// Define the structure for service health
export interface ServiceHealth {
  database: SystemStatus;
  email: SystemStatus;
  pushNotification: SystemStatus;
  api: SystemStatus;
}

interface ServiceStatusTabProps {
  serviceHealth: ServiceHealth; // Changed to ServiceHealth object
  isLoading: boolean;
}

export function ServiceStatusTab({ serviceHealth, isLoading }: ServiceStatusTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const services = [
    { name: 'Cơ sở dữ liệu', key: 'database' },
    { name: 'API Backend', key: 'api' },
    { name: 'Dịch vụ Email', key: 'email' },
    { name: 'Thông báo đẩy (Push)', key: 'pushNotification' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái dịch vụ</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => {
              const statusData = serviceHealth[service.key as keyof ServiceHealth];
              return (
                <div key={service.key} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(statusData?.status || 'unknown')}
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <span className={`font-semibold ${getStatusColor(statusData?.status || 'unknown')}`}>
                    {statusData?.status ? statusData.status.charAt(0).toUpperCase() + statusData.status.slice(1) : 'Unknown'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}