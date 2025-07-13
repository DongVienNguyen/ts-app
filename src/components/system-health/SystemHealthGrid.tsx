import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SystemHealth } from '@/components/system-health/types';
import { DatabaseMetric } from './DatabaseMetric';
import { ApiMetric } from './ApiMetric';
import { StorageMetric } from './StorageMetric';
import { MemoryMetric } from './MemoryMetric';
import { PerformanceMetric } from './PerformanceMetric';
import { SecurityMetric } from './SecurityMetric';
import { EmailMetric } from './EmailMetric';
import { PushNotificationMetric } from './PushNotificationMetric';

interface SystemHealthGridProps {
  health: SystemHealth | null;
  isLoading: boolean;
}

export const SystemHealthGrid: React.FC<SystemHealthGridProps> = ({ health, isLoading }) => {
  if (isLoading || !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan Sức khỏe Hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng quan Sức khỏe Hệ thống</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DatabaseMetric health={health.database} />
          <ApiMetric health={health.api} />
          <StorageMetric health={health.storage} />
          <MemoryMetric health={health.memory} />
          <PerformanceMetric health={health.performance} />
          <SecurityMetric health={health.security} />
          <EmailMetric status={health.email} isLoading={isLoading} />
          <PushNotificationMetric status={health.pushNotification} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  );
};