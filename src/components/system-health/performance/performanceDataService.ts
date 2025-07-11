import { PerformanceMetric, PerformanceInsights, TimeRange } from './types';

export class PerformanceDataService {
  static generateMetrics(timeRange: TimeRange): PerformanceMetric[] {
    const dataPoints = this.getDataPointsForTimeRange(timeRange);
    const metrics: PerformanceMetric[] = [];
    const now = new Date();

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * this.getIntervalMs(timeRange));
      const baseResponseTime = 150 + Math.sin(i / 10) * 50;
      const responseTime = Math.max(50, baseResponseTime + (Math.random() - 0.5) * 100);
      const baseThroughput = 100 + Math.cos(i / 15) * 30;
      const throughput = Math.max(10, baseThroughput + (Math.random() - 0.5) * 40);
      const errorRate = Math.max(0, Math.min(10, 1 + Math.random() * 2));
      const cpuUsage = Math.max(10, Math.min(95, 40 + Math.sin(i / 8) * 20 + Math.random() * 15));
      const memoryUsage = Math.max(20, Math.min(90, 50 + Math.cos(i / 12) * 15 + Math.random() * 10));
      const activeUsers = Math.max(1, Math.floor(20 + Math.sin(i / 20) * 15 + Math.random() * 10));

      metrics.push({
        timestamp: timestamp.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          ...(timeRange === '7d' || timeRange === '30d' ? { month: 'short', day: 'numeric' } : {})
        }),
        responseTime,
        throughput,
        errorRate,
        cpuUsage,
        memoryUsage,
        activeUsers
      });
    }

    return metrics;
  }

  static calculateInsights(metrics: PerformanceMetric[], health: any): PerformanceInsights {
    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        peakThroughput: 0,
        errorRate: 0,
        performanceScore: 0,
        bottlenecks: [],
        recommendations: []
      };
    }

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const peakThroughput = Math.max(...metrics.map(m => m.throughput));
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const responseScore = Math.max(0, 100 - (avgResponseTime - 100) / 10);
    const throughputScore = Math.min(100, (peakThroughput / 200) * 100);
    const errorScore = Math.max(0, 100 - avgErrorRate * 10);
    const performanceScore = (responseScore + throughputScore + errorScore) / 3;

    const bottlenecks: string[] = [];
    if (avgResponseTime > 500) bottlenecks.push('High response times detected');
    if (avgErrorRate > 2) bottlenecks.push('Elevated error rates');
    if (health.memory.percentage > 80) bottlenecks.push('High memory usage');

    const recommendations: string[] = [];
    if (avgResponseTime > 300) recommendations.push('Consider implementing response caching');
    if (peakThroughput < 50) recommendations.push('Optimize database queries for better throughput');

    return {
      averageResponseTime: avgResponseTime,
      peakThroughput,
      errorRate: avgErrorRate,
      performanceScore,
      bottlenecks,
      recommendations
    };
  }

  static exportToCsv(metrics: PerformanceMetric[], timeRange: TimeRange): void {
    const csvContent = [
      ['Timestamp', 'Response Time (ms)', 'Throughput', 'Error Rate (%)', 'CPU Usage (%)', 'Memory Usage (%)', 'Active Users'],
      ...metrics.map(m => [
        m.timestamp,
        m.responseTime.toFixed(2),
        m.throughput.toFixed(2),
        m.errorRate.toFixed(2),
        m.cpuUsage.toFixed(2),
        m.memoryUsage.toFixed(2),
        m.activeUsers.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static getDataPointsForTimeRange(timeRange: TimeRange): number {
    switch (timeRange) {
      case '1h': return 60;
      case '6h': return 72;
      case '24h': return 96;
      case '7d': return 168;
      case '30d': return 720;
      default: return 60;
    }
  }

  private static getIntervalMs(timeRange: TimeRange): number {
    switch (timeRange) {
      case '1h': return 60 * 1000;
      case '6h': return 5 * 60 * 1000;
      case '24h': return 15 * 60 * 1000;
      case '7d': return 60 * 60 * 1000;
      case '30d': return 4 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  }
}