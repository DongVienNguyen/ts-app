import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter
} from 'lucide-react';
import { SystemHealth } from './types';
import { getPerformanceStats } from '@/utils/performanceMonitor';

interface PerformanceMetric {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  activeUsers: number;
}

interface PerformanceAnalyticsProps {
  health: SystemHealth;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d' | '30d') => void;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  health,
  timeRange,
  onTimeRangeChange
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [insights, setInsights] = useState({
    averageResponseTime: 0,
    peakThroughput: 0,
    errorRate: 0,
    performanceScore: 0,
    bottlenecks: [] as string[],
    recommendations: [] as string[]
  });

  useEffect(() => {
    generateMetrics();
    calculateInsights();
  }, [timeRange, health]);

  const generateMetrics = () => {
    const dataPoints = timeRange === '1h' ? 60 : 
                      timeRange === '6h' ? 72 : 
                      timeRange === '24h' ? 96 : 
                      timeRange === '7d' ? 168 : 720;

    const newMetrics: PerformanceMetric[] = [];
    const now = new Date();

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * getIntervalMs());
      
      // Simulate realistic performance data with trends
      const baseResponseTime = 150 + Math.sin(i / 10) * 50;
      const responseTime = Math.max(50, baseResponseTime + (Math.random() - 0.5) * 100);
      
      const baseThroughput = 100 + Math.cos(i / 15) * 30;
      const throughput = Math.max(10, baseThroughput + (Math.random() - 0.5) * 40);
      
      const errorRate = Math.max(0, Math.min(10, 1 + Math.random() * 2));
      const cpuUsage = Math.max(10, Math.min(95, 40 + Math.sin(i / 8) * 20 + Math.random() * 15));
      const memoryUsage = Math.max(20, Math.min(90, 50 + Math.cos(i / 12) * 15 + Math.random() * 10));
      const activeUsers = Math.max(1, Math.floor(20 + Math.sin(i / 20) * 15 + Math.random() * 10));

      newMetrics.push({
        timestamp: timestamp.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          ...(timeRange === '7d' || timeRange === '30d' ? { 
            month: 'short', 
            day: 'numeric' 
          } : {})
        }),
        responseTime,
        throughput,
        errorRate,
        cpuUsage,
        memoryUsage,
        activeUsers
      });
    }

    setMetrics(newMetrics);
  };

  const getIntervalMs = () => {
    switch (timeRange) {
      case '1h': return 60 * 1000; // 1 minute
      case '6h': return 5 * 60 * 1000; // 5 minutes
      case '24h': return 15 * 60 * 1000; // 15 minutes
      case '7d': return 60 * 60 * 1000; // 1 hour
      case '30d': return 4 * 60 * 60 * 1000; // 4 hours
      default: return 60 * 1000;
    }
  };

  const calculateInsights = () => {
    if (metrics.length === 0) return;

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const peakThroughput = Math.max(...metrics.map(m => m.throughput));
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;

    // Calculate performance score (0-100)
    const responseScore = Math.max(0, 100 - (avgResponseTime - 100) / 10);
    const throughputScore = Math.min(100, (peakThroughput / 200) * 100);
    const errorScore = Math.max(0, 100 - avgErrorRate * 10);
    const performanceScore = (responseScore + throughputScore + errorScore) / 3;

    // Identify bottlenecks
    const bottlenecks: string[] = [];
    if (avgResponseTime > 500) bottlenecks.push('High response times detected');
    if (avgErrorRate > 2) bottlenecks.push('Elevated error rates');
    if (health.memory.percentage > 80) bottlenecks.push('High memory usage');
    if (health.database.responseTime && health.database.responseTime > 1000) {
      bottlenecks.push('Database performance issues');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgResponseTime > 300) {
      recommendations.push('Consider implementing response caching');
    }
    if (peakThroughput < 50) {
      recommendations.push('Optimize database queries for better throughput');
    }
    if (avgErrorRate > 1) {
      recommendations.push('Review error logs and implement better error handling');
    }
    if (health.memory.percentage > 75) {
      recommendations.push('Monitor memory usage and consider scaling resources');
    }

    setInsights({
      averageResponseTime: avgResponseTime,
      peakThroughput,
      errorRate: avgErrorRate,
      performanceScore,
      bottlenecks,
      recommendations
    });
  };

  const exportData = () => {
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
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertTriangle;
    return TrendingDown;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Performance Analytics</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => onTimeRangeChange(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Performance Score */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                {React.createElement(getScoreIcon(insights.performanceScore), {
                  className: `h-6 w-6 ${getScoreColor(insights.performanceScore).split(' ')[0]}`
                })}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {insights.performanceScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Performance Score</div>
              <Badge className={`mt-2 ${getScoreColor(insights.performanceScore)}`}>
                {insights.performanceScore >= 80 ? 'Excellent' : 
                 insights.performanceScore >= 60 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">
                {insights.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-green-700">Avg Response Time</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg border">
              <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {insights.peakThroughput.toFixed(0)}
              </div>
              <div className="text-sm text-purple-700">Peak Throughput</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg border">
              <Target className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-900">
                {insights.errorRate.toFixed(2)}%
              </div>
              <div className="text-sm text-red-700">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Response Time (ms)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Throughput & Error Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Throughput & Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="throughput" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Throughput"
                      dot={false}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Error Rate (%)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="cpuUsage" 
                      stackId="1"
                      stroke="#F59E0B" 
                      fill="#F59E0B"
                      fillOpacity={0.6}
                      name="CPU Usage (%)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="memoryUsage" 
                      stackId="2"
                      stroke="#8B5CF6" 
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                      name="Memory Usage (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resource Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Resource Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'CPU Usage', value: health.memory.percentage },
                        { name: 'Memory Usage', value: health.memory.percentage },
                        { name: 'Storage Usage', value: health.storage.percentage },
                        { name: 'Available', value: Math.max(0, 100 - health.memory.percentage - health.storage.percentage) }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Users Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="activeUsers" fill="#06B6D4" name="Active Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Identified Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.bottlenecks.length > 0 ? (
                  <div className="space-y-3">
                    {insights.bottlenecks.map((bottleneck, index) => (
                      <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-sm font-medium text-orange-900">{bottleneck}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No performance bottlenecks detected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Performance Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {insights.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">{recommendation}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>System is performing optimally</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Correlation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Correlation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={metrics}>
                  <CartesianGrid />
                  <XAxis dataKey="responseTime" name="Response Time" unit="ms" />
                  <YAxis dataKey="throughput" name="Throughput" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Performance Points" data={metrics} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};