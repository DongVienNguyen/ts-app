import { useState, useEffect } from 'react';
import { PerformanceMetric, PerformanceInsights, TimeRange } from './types';
import { PerformanceDataService } from './performanceDataService';

export const usePerformanceAnalytics = (health: any, timeRange: TimeRange) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [insights, setInsights] = useState<PerformanceInsights>({
    averageResponseTime: 0,
    peakThroughput: 0,
    errorRate: 0,
    performanceScore: 0,
    bottlenecks: [],
    recommendations: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateAnalytics();
  }, [timeRange, health]);

  const generateAnalytics = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const newMetrics = PerformanceDataService.generateMetrics(timeRange);
      const newInsights = PerformanceDataService.calculateInsights(newMetrics, health);
      setMetrics(newMetrics);
      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating performance analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    PerformanceDataService.exportToCsv(metrics, timeRange);
  };

  const refreshData = () => {
    generateAnalytics();
  };

  return {
    metrics,
    insights,
    isLoading,
    exportData,
    refreshData
  };
};