export interface PerformanceMetric {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  activeUsers: number;
}

export interface PerformanceInsights {
  averageResponseTime: number;
  peakThroughput: number;
  errorRate: number;
  performanceScore: number;
  bottlenecks: string[];
  recommendations: string[];
}

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';