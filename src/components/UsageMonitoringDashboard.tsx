import { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MousePointer, 
  Eye, 
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { getUsageStats, getAverageSessionDuration, UsageStats } from '@/utils/usageTracking';

interface UsageOverview {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  totalPageViews: number;
  bounceRate: number;
  activeUsers: number;
}

interface DeviceStats {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface BrowserStats {
  [browser: string]: number;
}

interface TimeRangeData {
  hourly: { hour: string; users: number; sessions: number }[];
  daily: { date: string; users: number; sessions: number }[];
  monthly: { month: string; users: number; sessions: number }[];
}

export function UsageMonitoringDashboard() {
  const [usageOverview, setUsageOverview] = useState<UsageOverview>({
    totalSessions: 0,
    uniqueUsers: 0,
    averageSessionDuration: 0,
    totalPageViews: 0,
    bounceRate: 0,
    activeUsers: 0
  });

  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    desktop: 0,
    mobile: 0,
    tablet: 0
  });

  const [browserStats, setBrowserStats] = useState<BrowserStats>({});
  const [timeRangeData, setTimeRangeData] = useState<TimeRangeData>({
    hourly: [],
    daily: [],
    monthly: []
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadUsageData();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(loadUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadUsageData = async () => {
    try {
      setIsLoading(true);

      // Get usage statistics
      const usageStats = await getUsageStats(selectedTimeRange);
      const averageSessionDuration = await getAverageSessionDuration(selectedTimeRange);

      // Get session data
      const now = new Date();
      let startDate: Date;

      switch (selectedTimeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('session_start', startDate.toISOString())
        .order('session_start', { ascending: true });

      if (error) throw error;

      // Calculate overview stats
      const totalSessions = sessions?.length || 0;
      const uniqueUsers = new Set(sessions?.map(s => s.username) || []).size;
      const totalPageViews = sessions?.reduce((sum, s) => sum + (s.pages_visited || 0), 0) || 0;
      
      // Calculate bounce rate (sessions with only 1 page view)
      const bounceSessions = sessions?.filter(s => s.pages_visited <= 1).length || 0;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

      // Active users (last 24 hours)
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const activeUsers = new Set(
        sessions?.filter(s => new Date(s.session_start) > last24Hours)
          .map(s => s.username) || []
      ).size;

      setUsageOverview({
        totalSessions,
        uniqueUsers,
        averageSessionDuration,
        totalPageViews,
        bounceRate,
        activeUsers
      });

      // Device statistics
      const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
      sessions?.forEach(session => {
        if (session.device_type) {
          deviceCounts[session.device_type as keyof DeviceStats]++;
        }
      });
      setDeviceStats(deviceCounts);

      // Browser statistics
      const browserCounts: BrowserStats = {};
      sessions?.forEach(session => {
        if (session.browser_name) {
          browserCounts[session.browser_name] = (browserCounts[session.browser_name] || 0) + 1;
        }
      });
      setBrowserStats(browserCounts);

      // Time range data
      const hourlyData: { [key: string]: { users: Set<string>; sessions: number } } = {};
      const dailyData: { [key: string]: { users: Set<string>; sessions: number } } = {};
      const monthlyData: { [key: string]: { users: Set<string>; sessions: number } } = {};

      sessions?.forEach(session => {
        const date = new Date(session.session_start);
        
        // Hourly data
        const hourKey = `${String(date.getHours()).padStart(2, '0')}:00`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { users: new Set(), sessions: 0 };
        }
        hourlyData[hourKey].users.add(session.username);
        hourlyData[hourKey].sessions++;

        // Daily data
        const dayKey = date.toISOString().split('T')[0];
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { users: new Set(), sessions: 0 };<think>Deciding which files are relevant...

[
  "src/integrations/supabase/types.ts",
  "src/integrations/supabase/client.ts",
  "src/utils/realTimeSecurityUtils.ts",
  "src/utils/errorTracking.ts",
  "src/utils/usageTracking.ts",
  "src/services/emailService.ts",
  "src/services/notificationService.ts",
  "src/services/assetSubmissionService.ts",
  "src/components/ErrorMonitoringDashboard.tsx",
  "src/components/UsageMonitoringDashboard.tsx",
  "src/components/EnhancedSecurityDashboard.tsx",
  "src/components/NavigationHeader.tsx",
  "src/components/SecurityStatusWidget.tsx",
  "src/pages/SecurityMonitor.tsx",
  "src/pages/ErrorMonitor.tsx",
  "src/pages/UsageMonitor.tsx",
  "src/App.tsx",
  "src/pages/Index.tsx"
]</think><dyad-codebase-context files="src/integrations/supabase/types.ts,src/integrations/supabase/client.ts,src/utils/realTimeSecurityUtils.ts,src/utils/errorTracking.ts,src/utils/usageTracking.ts,src/services/emailService.ts,src/services/notificationService.ts,src/services/assetSubmissionService.ts,src/components/ErrorMonitoringDashboard.tsx,src/components/UsageMonitoringDashboard.tsx,src/components/EnhancedSecurityDashboard.tsx,src/components/NavigationHeader.tsx,src/components/SecurityStatusWidget.tsx,src/pages/SecurityMonitor.tsx,src/pages/ErrorMonitor.tsx,src/pages/UsageMonitor.tsx,src/App.tsx,src/pages/Index.tsx"></dyad-codebase-context>
        }
        dailyData[dayKey].users.add(session.username);
        dailyData[dayKey].sessions++;

        // Monthly data
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { users: new Set(), sessions: 0 };
        }
        monthlyData[monthKey].users.add(session.username);
        monthlyData[monthKey].sessions++;
      });

      setTimeRangeData({
        hourly: Object.entries(hourlyData).map(([hour, data]) => ({
          hour,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.hour.localeCompare(b.hour)),
        
        daily: Object.entries(dailyData).map(([date, data]) => ({
          date,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.date.localeCompare(b.date)),
        
        monthly: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.month.localeCompare(b.month))
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const deviceChartData = [
    { name: 'Desktop', value: deviceStats.desktop, color: '#0088FE' },
    { name: 'Mobile', value: deviceStats.mobile, color: '#00C49F' },
    { name: 'Tablet', value: deviceStats.tablet, color: '#FFBB28' }
  ];

  const browserChartData = Object.entries(browserStats).map(([browser, count], index) => ({
    name: browser,
    value: count,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span>Theo dõi Sử dụng</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Thống kê và phân tích hành vi người dùng
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">24 giờ</SelectItem>
              <SelectItem value="week">7 ngày</SelectItem>
              <SelectItem value="month">30 ngày</SelectItem>
              <SelectItem value="quarter">3 tháng</SelectItem>
              <SelectItem value="year">1 năm</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500">
            Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
          </div>
          <Button onClick={loadUsageData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{usageOverview.totalSessions}</p>
                <p className="text-sm text-gray-600">Tổng phiên</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{usageOverview.uniqueUsers}</p>
                <p className="text-sm text-gray-600">Người dùng duy nhất</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatDuration(usageOverview.averageSessionDuration)}
                </p>
                <p className="text-sm text-gray-600">Thời gian TB</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{usageOverview.totalPageViews}</p>
                <p className="text-sm text-gray-600">Lượt xem trang</p>
              </div>
              <MousePointer className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{usageOverview.bounceRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Tỷ lệ thoát</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{usageOverview.activeUsers}</p>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
              </div>
              <Globe className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Xu hướng</TabsTrigger>
          <TabsTrigger value="devices">Thiết bị</TabsTrigger>
          <TabsTrigger value="browsers">Trình duyệt</TabsTrigger>
          <TabsTrigger value="detailed">Chi tiết</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Người dùng theo Giờ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeRangeData.hourly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phiên theo Giờ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeRangeData.hourly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xu hướng Hàng ngày</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeRangeData.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xu hướng Hàng tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeRangeData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố Thiết bị</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={deviceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê Thiết bị</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-6 h-6 text-blue-600" />
                      <span className="font-medium">Desktop</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{deviceStats.desktop}</div>
                      <div className="text-sm text-gray-600">
                        {((deviceStats.desktop / usageOverview.totalSessions) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-6 h-6 text-green-600" />
                      <span className="font-medium">Mobile</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{deviceStats.mobile}</div>
                      <div className="text-sm text-gray-600">
                        {((deviceStats.mobile / usageOverview.totalSessions) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Tablet className="w-6 h-6 text-yellow-600" />
                      <span className="font-medium">Tablet</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">{deviceStats.tablet}</div>
                      <div className="text-sm text-gray-600">
                        {((deviceStats.tablet / usageOverview.totalSessions) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="browsers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố Trình duyệt</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={browserChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {browserChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Trình duyệt</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={browserChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê Chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Tổng quan Phiên</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Tổng số phiên:</span>
                        <span className="font-medium">{usageOverview.totalSessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Người dùng duy nhất:</span>
                        <span className="font-medium">{usageOverview.uniqueUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phiên/Người dùng:</span>
                        <span className="font-medium">
                          {usageOverview.uniqueUsers > 0 ? (usageOverview.totalSessions / usageOverview.uniqueUsers).toFixed(1) : '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Thời gian Sử dụng</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Thời gian TB/Phiên:</span>
                        <span className="font-medium">{formatDuration(usageOverview.averageSessionDuration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trang/Phiên:</span>
                        <span className="font-medium">
                          {usageOverview.totalSessions > 0 ? (usageOverview.totalPageViews / usageOverview.totalSessions).toFixed(1) : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tỷ lệ thoát:</span>
                        <span className="font-medium">{usageOverview.bounceRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Hoạt động Hiện tại</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Đang hoạt động (24h):</span>
                        <span className="font-medium">{usageOverview.activeUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tổng lượt xem:</span>
                        <span className="font-medium">{usageOverview.totalPageViews}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}