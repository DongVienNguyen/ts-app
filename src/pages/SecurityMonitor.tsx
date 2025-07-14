import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, Bell, ArrowRight, Users, TestTube, Activity, TrendingUp, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSecureAuth } from '@/contexts/AuthContext';
import { SecurityOverview } from '@/components/SecurityOverview';
import { SecurityActionsPanel } from '@/components/security/SecurityActionsPanel';
import { LiveActivityFeed } from '@/components/security/LiveActivityFeed';
import { ThreatAnalysisCard } from '@/components/security/ThreatAnalysisCard';
import { TestErrorGeneratorTab } from '@/components/security/TestErrorGeneratorTab';
import { UserManagementTab } from '@/components/security/UserManagementTab';
import { useState } from 'react';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { SecurityAlerts } from '@/components/security/SecurityAlerts';
import { Skeleton } from '@/components/ui/skeleton';

const SecurityMonitor = () => {
  const { user } = useSecureAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    recentEvents,
    threatTrends,
    isLoading: isSecurityDataLoading,
    isRefreshing,
    refreshEvents,
    forceUpdateCounter,
    securityAlerts,
    acknowledgeSystemAlert,
  } = useRealTimeSecurityMonitoring(user);

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chỉ admin mới có thể truy cập trang này.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Calculate security metrics for header
  const getSecurityMetrics = () => {
    const totalEvents = recentEvents?.length || 0;
    const activeAlerts = securityAlerts?.length || 0;
    const threatLevel = activeAlerts > 5 ? 'high' : activeAlerts > 2 ? 'medium' : 'low';
    
    return { totalEvents, activeAlerts, threatLevel };
  };

  const metrics = getSecurityMetrics();

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trung tâm Giám sát Bảo mật</h1>
              <p className="text-gray-500">Theo dõi, kiểm tra và quản lý toàn bộ khía cạnh bảo mật của hệ thống.</p>
            </div>
          </div>

          {/* Security Metrics Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Security Status */}
            <Card className={`bg-gradient-to-r ${
              metrics.threatLevel === 'low' ? 'from-green-50 to-green-100 border-green-200' :
              metrics.threatLevel === 'medium' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
              'from-red-50 to-red-100 border-red-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    metrics.threatLevel === 'low' ? 'bg-green-500' :
                    metrics.threatLevel === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      metrics.threatLevel === 'low' ? 'text-green-900' :
                      metrics.threatLevel === 'medium' ? 'text-yellow-900' :
                      'text-red-900'
                    }`}>
                      Mức độ An toàn
                    </p>
                    <p className={`text-xs ${
                      metrics.threatLevel === 'low' ? 'text-green-700' :
                      metrics.threatLevel === 'medium' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {metrics.threatLevel === 'low' ? 'An toàn' :
                       metrics.threatLevel === 'medium' ? 'Cảnh báo' :
                       'Nguy hiểm'}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      metrics.threatLevel === 'low' ? 'bg-green-100 text-green-800' :
                      metrics.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {metrics.threatLevel === 'low' ? 'LOW' :
                     metrics.threatLevel === 'medium' ? 'MED' :
                     'HIGH'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Cảnh báo Hoạt động</p>
                    <p className="text-xs text-red-700">Cần xử lý ngay</p>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {metrics.activeAlerts}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security Events */}
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Sự kiện Bảo mật</p>
                    <p className="text-xs text-blue-700">24h qua</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {metrics.totalEvents}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">Giám sát</p>
                    <p className="text-xs text-purple-700">Real-time</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ACTIVE
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Cảnh báo</span>
              {metrics.activeAlerts > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {metrics.activeAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Người dùng</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Kiểm tra</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed border-blue-200 bg-blue-50/50"
                onClick={() => setActiveTab('alerts')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-500" />
                    Cảnh báo Bảo mật Cần Xử lý
                  </CardTitle>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isSecurityDataLoading ? (
                    <Skeleton className="h-6 w-1/2" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Có <span className={`font-bold text-lg ${metrics.activeAlerts > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {metrics.activeAlerts}
                      </span> cảnh báo đang hoạt động. Nhấn để xem chi tiết và xử lý.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Main Dashboard Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Security Overview */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Tổng quan Bảo mật</h3>
                    </div>
                    <SecurityOverview />
                  </div>

                  {/* Live Activity Feed */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Hoạt động Trực tiếp</h3>
                      <Badge variant="outline" className="text-xs">Real-time</Badge>
                    </div>
                    <LiveActivityFeed
                      events={recentEvents}
                      isRealTimeEnabled={true}
                      isLoading={isSecurityDataLoading}
                      isRefreshing={isRefreshing}
                      onRefresh={refreshEvents}
                      forceUpdateCounter={forceUpdateCounter}
                    />
                  </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Security Actions */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TestTube className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Tác vụ Bảo mật</h3>
                    </div>
                    <SecurityActionsPanel />
                  </div>

                  {/* Threat Analysis */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Phân tích Mối đe dọa</h3>
                    </div>
                    <ThreatAnalysisCard
                      threatTrends={threatTrends}
                      isLoading={isSecurityDataLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Bell className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">Quản lý Cảnh báo Bảo mật</h2>
                <Badge variant="destructive" className="ml-2">
                  {metrics.activeAlerts} hoạt động
                </Badge>
              </div>
              <SecurityAlerts
                alerts={securityAlerts}
                isLoading={isSecurityDataLoading}
                onAcknowledge={acknowledgeSystemAlert}
              />
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Quản lý Người dùng</h2>
                <Badge variant="outline" className="ml-2">Admin Tools</Badge>
              </div>
              <UserManagementTab />
            </div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="mt-6">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TestTube className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900">Công cụ Kiểm tra & Phát triển</h2>
                <Badge variant="outline" className="ml-2">Dev Tools</Badge>
              </div>
              <TestErrorGeneratorTab />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium mb-1">Trung tâm Giám sát Bảo mật - Tài sản CRC</p>
              <p>Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')} | Trạng thái: {metrics.threatLevel === 'low' ? '🟢 An toàn' : metrics.threatLevel === 'medium' ? '🟡 Cảnh báo' : '🔴 Nguy hiểm'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SecurityMonitor;