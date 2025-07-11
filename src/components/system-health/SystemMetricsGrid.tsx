import React from 'react';
import { SystemHealth } from './types';
import { DatabaseMetric } from './DatabaseMetric';
import { ApiMetric } from './ApiMetric';
import { StorageMetric } from './StorageMetric';
import { MemoryMetric } from './MemoryMetric';
import { PerformanceMetric } from './PerformanceMetric';
import { SecurityMetric } from './SecurityMetric';

interface SystemMetricsGridProps {
  health: SystemHealth;
}

export const SystemMetricsGrid: React.FC<SystemMetricsGridProps> = ({ health }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <DatabaseMetric health={health.database} />
      <ApiMetric health={health.api} />
      <StorageMetric health={health.storage} />
      <MemoryMetric health={health.memory} />
      <PerformanceMetric health={health.performance} />
      <SecurityMetric health={health.security} />
    </div>
  );
};