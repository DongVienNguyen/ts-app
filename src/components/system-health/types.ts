export interface SystemHealthMetric {
  status: 'healthy' | 'warning' | 'error';
  responseTime?: number;
  uptime?: number;
  lastCheck: string;
}

export interface DatabaseHealth extends SystemHealthMetric {
  connections: number;
}

export interface ApiHealth extends SystemHealthMetric {
  requestsPerMinute: number;
}

export interface StorageHealth extends SystemHealthMetric {
  used: number;
  total: number;
  percentage: number;
  growth: number;
}

export interface MemoryHealth extends SystemHealthMetric {
  used: number;
  total: number;
  percentage: number;
  peak: number;
}

export interface PerformanceHealth {
  averageResponseTime: number;
  totalOperations: number;
  slowestOperation: string | null;
  fastestOperation: string | null;
}

export interface SecurityHealth extends SystemHealthMetric {
  activeThreats: number;
  lastSecurityScan: string;
  failedLogins: number;
}

export interface SystemHealth {
  database: DatabaseHealth;
  api: ApiHealth;
  storage: StorageHealth;
  memory: MemoryHealth;
  performance: PerformanceHealth;
  security: SecurityHealth;
  overall: 'healthy' | 'warning' | 'error';
}