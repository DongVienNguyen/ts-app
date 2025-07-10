import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bug, 
  Server, 
  Wifi, 
  Mail, 
  Bell,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { SystemError, SystemMetric, SystemStatus, checkServiceHealth, monitorResources } from '@/utils/errorTracking';

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
  topErrorTypes: { type: string; count: number }[];
  errorTrend: { date: string; count: number }[];
}

interface ServiceHealth {
  database: SystemStatus;
  email: SystemStatus;
  pushNotification: SystemStatus;
  api: SystemStatus;
}

export function ErrorMonitoringDashboard() {
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    errorRate: 0,
    topErrorTypes: [],
    errorTrend: []
  });

  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    database: { service_name: 'database', status: 'online', uptime_percentage: 100 },
    email: { service_name: 'email', status: 'online', uptime_percentage: 100 },
    pushNotification: { service_name: 'push_notification', status: 'online', uptime_percentage: 100 },
    api: { service_name: 'api', status: 'online', uptime_percentage: 100 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadErrorData();
    loadSystemMetrics();
    checkAllServices();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      loadErrorData();
      loadSystemMetrics();
      checkAllServices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadErrorData = async () => {
    try {
      setIsLoading(true);

      // Get error statistics
      const { data: errors, error } = await supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentErrors24h = errors?.filter(e => new Date(e.created_at) > last24Hours) || [];
      const criticalErrors = errors?.filter(e => e.severity === 'critical') || [];
      const resolvedErrors = errors?.filter(e => e.status === 'resolved') || [];

      // Calculate error rate (errors per hour in last 24h)
      const errorRate = recentErrors24h.length / 24;

      // Top error types
      const errorTypeCounts: { [key: string]: number } = {};
      errors?.forEach(error => {
        errorTypeCounts[error.error_type] = (errorTypeCounts[error.error_type] || 0) + 1;
      });

      const topErrorTypes = Object.entries(errorTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Error trend (last 7 days)
      const errorTrend: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayErrors = errors?.filter(e => {
          const errorDate = new Date(e.created_at);
          return errorDate >= dayStart && errorDate <= dayEnd;
        }) || [];

        errorTrend.push({
          date: dateStr,
          count: dayErrors.length
        });
      }

      setErrorStats({
        totalErrors: errors?.length || 0,
        criticalErrors: criticalErrors.length,
        resolvedErrors: resolvedErrors.length,
        errorRate,
        topErrorTypes,
        errorTrend
      });

      setRecentErrors(errors?.slice(0, 20) || []);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading error data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const { data: metrics, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSystemMetrics(metrics || []);

      // Monitor current resources
      await monitorResources();
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const checkAllServices = async () => {
    try {
      const [database, email, pushNotification, api] = await Promise.all([
        checkServiceHealth('database'),
        checkServiceHealth('email'),
        checkServiceHealth('push_notification'),
        checkServiceHealth('api')
      ]);

      setServiceHealth({
        database,
        email,
        pushNotification,
        api
      });
    } catch (error) {
      console.error('Error checking service health:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertCircle className="w-4 h-4" />;
      case 'offline': return <XCircle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Bug className="w-8 h-8 text-red-600" />
            <span>Theo dõi Lỗi Hệ thống</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Giám sát và phân tích lỗi, hiệu suất và trạng thái dịch vụ
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
          </div>
          <Button onClick={() => {
            loadErrorData();
            loadSystemMetrics();
            checkAllServices();
          }} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{errorStats.totalErrors}</p>
                <p className="text-sm text-gray-600">Tổng số lỗi</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{errorStats.criticalErrors}</p>
                <p className="text-sm text-gray-600">Lỗi nghiêm trọng</p>
              </div>
              <XCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{errorStats.resolvedErrors}</p>
                <p className="text-sm text-gray-600">Đã giải quyết</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{errorStats.errorRate.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Lỗi/giờ (24h)</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="errors">Danh sách Lỗi</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          <TabsTrigger value="services">Trạng thái Dịch vụ</TabsTrigger>
          <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lỗi Gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : recentErrors.length > 0 ? (
                <div className="space-y-3">
                  {recentErrors.map((error) => (
                    <div key={error.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{error.error_type}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(error.created_at!).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {error.error_message}
                          </h4>
                          {error.function_name && (
                            <p className="text-sm text-gray-600">
                              Chức năng: {error.function_name}
                            </p>
                          )}
                          {error.user_id && (
                            <p className="text-sm text-gray-600">
                              Người dùng: {error.user_id}
                            </p>
                          )}
                        </div>
                        <Badge variant={error.status === 'resolved' ? 'default' : 'destructive'}>
                          {error.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không có lỗi nào được ghi nhận</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng Lỗi (7 ngày qua)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={errorStats.errorTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Loại Lỗi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={errorStats.topErrorTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Cơ sở dữ liệu</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trạng thái:</span>
                    <Badge className={getStatusColor(serviceHealth.database.status)}>
                      {getStatusIcon(serviceHealth.database.status)}
                      <span className="ml-1">{serviceHealth.database.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="font-medium">{serviceHealth.database.uptime_percentage}%</span>
                  </div>
                  <Progress value={serviceHealth.database.uptime_percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trạng thái:</span>
                    <Badge className={getStatusColor(serviceHealth.email.status)}>
                      {getStatusIcon(serviceHealth.email.status)}
                      <span className="ml-1">{serviceHealth.email.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="font-medium">{serviceHealth.email.uptime_percentage}%</span>
                  </div>
                  <Progress value={serviceHealth.email.uptime_percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Push Notification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trạng thái:</span>
                    <Badge className={getStatusColor(serviceHealth.pushNotification.status)}>
                      {getStatusIcon(serviceHealth.pushNotification.status)}
                      <span className="ml-1">{serviceHealth.pushNotification.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="font-medium">{serviceHealth.pushNotification.uptime_percentage}%</span>
                  </div>
                  <Progress value={serviceHealth.pushNotification.uptime_percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5" />
                  <span>API</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trạng thái:</span>
                    <Badge className={getStatusColor(serviceHealth.api.status)}>
                      {getStatusIcon(serviceHealth.api.status)}
                      <span className="ml-1">{serviceHealth.api.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="font-medium">{serviceHealth.api.uptime_percentage}%</span>
                  </div>
                  <Progress value={serviceHealth.api.uptime_percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sử dụng Bộ nhớ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics
                    .filter(m => m.metric_type === 'memory')
                    .slice(0, 5)
                    .map((metric, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{metric.metric_name}:</span>
                        <span className="font-medium">
                          {(metric.metric_value / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hiệu suất Mạng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics
                    .filter(m => m.metric_type === 'network')
                    .slice(0, 5)
                    .map((metric, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{metric.metric_name}:</span>
                        <span className="font-medium">
                          {metric.metric_value} {metric.metric_unit}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}