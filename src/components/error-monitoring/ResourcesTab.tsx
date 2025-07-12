import React from 'react';
import { SystemMetricsGrid } from '@/components/system-health';
import { SystemHealth } from '@/components/system-health/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ResourcesTabProps {
  health: SystemHealth | null;
  isLoading: boolean;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({ health, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
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
      <SystemMetricsGrid health={health} />
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Các chỉ số này cung cấp một cái nhìn tổng quan về trạng thái các thành phần cốt lõi của hệ thống.
        </AlertDescription>
      </Alert>
    </div>
  );
};