import { Server, Mail, Bell, Wifi, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SystemStatus } from '@/utils/errorTracking';

interface ServiceHealth {
  database: SystemStatus;
  email: SystemStatus;
  pushNotification: SystemStatus;
  api: SystemStatus;
}

interface ServiceStatusTabProps {
  serviceHealth: ServiceHealth;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => string;
}

export function ServiceStatusTab({ serviceHealth, getStatusColor, getStatusIcon }: ServiceStatusTabProps) {
  const getStatusIconComponent = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertCircle className="w-4 h-4" />;
      case 'offline': return <XCircle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const services = [
    {
      key: 'database',
      name: 'Cơ sở dữ liệu',
      icon: Server,
      service: serviceHealth.database
    },
    {
      key: 'email',
      name: 'Email',
      icon: Mail,
      service: serviceHealth.email
    },
    {
      key: 'pushNotification',
      name: 'Push Notification',
      icon: Bell,
      service: serviceHealth.pushNotification
    },
    {
      key: 'api',
      name: 'API',
      icon: Wifi,
      service: serviceHealth.api
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {services.map((service) => {
        const Icon = service.icon;
        return (
          <Card key={service.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Icon className="w-5 h-5" />
                <span>{service.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trạng thái:</span>
                  <Badge className={getStatusColor(service.service.status)}>
                    {getStatusIconComponent(service.service.status)}
                    <span className="ml-1">{service.service.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime:</span>
                  <span className="font-medium">{service.service.uptime_percentage}%</span>
                </div>
                <Progress value={service.service.uptime_percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}