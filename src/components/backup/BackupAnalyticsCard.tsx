import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  HardDrive, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Calendar,
  Database,
  Zap
} from 'lucide-react';

interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  backupType?: string;
  filename?: string;
  size?: number;
  duration: number;
  success: boolean;
  error?: string;
}

interface BackupAnalyticsProps {
  backupHistory: BackupRecord[];
  onRefresh: () => void;
}

const BackupAnalyticsCard: React.FC<BackupAnalyticsProps> = ({ 
  backupHistory, 
  onRefresh 
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState({
    successRate: 0,
    averageDuration: 0,
    totalSize: 0,
    frequencyTrend: 'stable' as 'up' | 'down' | 'stable',
    performanceTrend: 'stable' as 'up' | 'down' | 'stable',
    recentFailures: 0,
    largestBackup: null as BackupRecord | null,
    fastestBackup: null as BackupRecord | null
  });

  const [chartData, setChartData] = useState({
    dailyBackups: [] as any[],
    sizeDistribution: [] as any[],
    performanceHistory: [] as any[],
    typeDistribution: [] as any[]
  });

  useEffect(() => {
    calculateAnalytics();
    generateChartData();
  }, [backupHistory, timeRange]);

  const calculateAnalytics = () => {
    if (!backupHistory.length) return;

    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    const filteredHistory = backupHistory.filter(backup => 
      new Date(backup.timestamp) >= cutoffDate
    );

    // Success rate
    const successfulBackups = filteredHistory.filter(b => b.success);
    const successRate = filteredHistory.length > 0 
      ? (successfulBackups.length / filteredHistory.length) * 100 
      : 0;

    // Average duration
    const averageDuration = successfulBackups.length > 0
      ? successfulBackups.reduce((sum, b) => sum + b.duration, 0) / successfulBackups.length
      : 0;

    // Total size
    const totalSize = successfulBackups.reduce((sum, b) => sum + (b.size || 0), 0);

    // Recent failures
    const recentFailures = filteredHistory.filter(b => 
      !b.success && new Date(b.timestamp) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Largest and fastest backups
    const largestBackup = successfulBackups.reduce((largest, current) => 
      (current.size || 0) > (largest?.size || 0) ? current : largest, 
      null as BackupRecord | null
    );

    const fastestBackup = successfulBackups.reduce((fastest, current) => 
      current.duration < (fastest?.duration || Infinity) ? current : fastest,
      null as BackupRecord | null
    );

    // Trends (simplified)
    const recentBackups = filteredHistory.slice(-10);
    const olderBackups = filteredHistory.slice(-20, -10);
    
    const recentAvgDuration = recentBackups.length > 0
      ? recentBackups.reduce((sum, b) => sum + b.duration, 0) / recentBackups.length
      : 0;
    
    const olderAvgDuration = olderBackups.length > 0
      ? olderBackups.reduce((sum, b) => sum + b.duration, 0) / olderBackups.length
      : 0;

    const performanceTrend = recentAvgDuration < olderAvgDuration * 0.9 ? 'up' :
                           recentAvgDuration > olderAvgDuration * 1.1 ? 'down' : 'stable';

    setAnalytics({
      successRate,
      averageDuration: averageDuration / 1000, // Convert to seconds
      totalSize: totalSize / (1024 * 1024), // Convert to MB
      frequencyTrend: 'stable',
      performanceTrend,
      recentFailures,
      largestBackup,
      fastestBackup
    });
  };

  const generateChartData = () => {
    if (!backupHistory.length) return;

    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    // Daily backups chart
    const dailyData = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayBackups = backupHistory.filter(b => {
        const backupDate = new Date(b.timestamp);
        return backupDate >= dayStart && backupDate <= dayEnd;
      });

      dailyData.push({
        date: dayStart.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        successful: dayBackups.filter(b => b.success).length,
        failed: dayBackups.filter(b => !b.success).length,
        total: dayBackups.length
      });
    }

    // Size distribution
    const sizeRanges = [
      { range: '< 1MB', min: 0, max: 1024 * 1024, count: 0 },
      { range: '1-10MB', min: 1024 * 1024, max: 10 * 1024 * 1024, count: 0 },
      { range: '10-50MB', min: 10 * 1024 * 1024, max: 50 * 1024 * 1024, count: 0 },
      { range: '50-100MB', min: 50 * 1024 * 1024, max: 100 * 1024 * 1024, count: 0 },
      { range: '> 100MB', min: 100 * 1024 * 1024, max: Infinity, count: 0 }
    ];

    backupHistory.forEach(backup => {
      if (backup.success && backup.size) {
        const range = sizeRanges.find(r => backup.size! >= r.min && backup.size! < r.max);
        if (range) range.count++;
      }
    });

    // Performance history
    const performanceData = backupHistory
      .filter(b => b.success)
      .slice(-20)
      .map((backup, index) => ({
        backup: `#${index + 1}`,
        duration: backup.duration / 1000,
        size: (backup.size || 0) / (1024 * 1024),
        timestamp: new Date(backup.timestamp).toLocaleDateString('vi-VN')
      }));

    // Type distribution
    const typeCount = backupHistory.reduce((acc, backup) => {
      const type = backup.backupType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = Object.entries(typeCount).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: (count / backupHistory.length) * 100
    }));

    setChartData({
      dailyBackups: dailyData,
      sizeDistribution: sizeRanges.filter(r => r.count > 0),
      performanceHistory: performanceData,
      typeDistribution
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Backup Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive backup performance and trend analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button onClick={onRefresh} variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {getTrendIcon(analytics.frequencyTrend)}
              </div>
              <div className="text-2xl font-bold text-green-900">
                {analytics.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-green-700">Success Rate</div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                {getTrendIcon(analytics.performanceTrend)}
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {analytics.averageDuration.toFixed(1)}s
              </div>
              <div className="text-sm text-blue-700">Avg Duration</div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
                <Database className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {analytics.totalSize.toFixed(1)}MB
              </div>
              <div className="text-sm text-purple-700">Total Size</div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900">
                {analytics.recentFailures}
              </div>
              <div className="text-sm text-red-700">Recent Failures</div>
            </div>
          </div>

          {/* Record Holders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {analytics.largestBackup && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Largest Backup</span>
                </div>
                <div className="text-sm text-yellow-700">
                  <div>{((analytics.largestBackup.size || 0) / (1024 * 1024)).toFixed(1)} MB</div>
                  <div className="truncate">{analytics.largestBackup.filename}</div>
                  <div>{new Date(analytics.largestBackup.timestamp).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
            )}

            {analytics.fastestBackup && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Fastest Backup</span>
                </div>
                <div className="text-sm text-green-700">
                  <div>{(analytics.fastestBackup.duration / 1000).toFixed(1)} seconds</div>
                  <div className="truncate">{analytics.fastestBackup.filename}</div>
                  <div>{new Date(analytics.fastestBackup.timestamp).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Backup Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Backup Activity</CardTitle>
            <CardDescription>Backup frequency and success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyBackups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successful" stackId="a" fill="#10B981" name="Successful" />
                <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Backup Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Backup Type Distribution</CardTitle>
            <CardDescription>Distribution of different backup types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance History</CardTitle>
            <CardDescription>Backup duration trends over recent backups</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="backup" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Duration (s)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Backup Size Distribution</CardTitle>
            <CardDescription>Distribution of backup file sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.sizeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackupAnalyticsCard;