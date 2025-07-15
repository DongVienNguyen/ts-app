import React from 'react';
import { SystemMetricsGrid } from '@/components/system-health';
import { SystemHealth } from '@/components/system-health/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { RealTimeMonitor } from '@/components/system-health/RealTimeMonitor';
import { SystemMetric } from '@/types/system';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; // Thêm CardDescription vào đây

interface ResourcesTabProps {
  health: SystemHealth | null;
  systemMetrics: SystemMetric[];
  isLoading: boolean;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ health, systemMetrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Không có dữ liệu tài nguyên để hiển thị.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan tài nguyên hệ thống</CardTitle>
          <CardDescription>Cái nhìn tổng thể về trạng thái các thành phần cốt lõi.</CardDescription>
        </CardHeader>
        <CardContent>
          <SystemMetricsGrid health={health} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giám sát tài nguyên thời gian thực</CardTitle>
          <CardDescription>Biểu đồ sử dụng CPU, bộ nhớ và mạng.</CardDescription>
        </CardHeader>
        <CardContent>
          <RealTimeMonitor systemMetrics={systemMetrics} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Các biểu đồ này hiển thị dữ liệu tài nguyên được thu thập từ các phiên hoạt động gần đây của người dùng.
        </AlertDescription>
      </Alert>
    </div>
  );
};