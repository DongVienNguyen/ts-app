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
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chỉ admin mới có thể truy cập trang này.
          </AlertDescription>
        </Alert>
      </div>
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
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trung tâm Giám sát Bảo mật</h1>
            <p className="text-gray-500">Giám sát và phân tích các hoạt động bảo mật trong hệ thống</p>
          </div>
        </div>

        {/* Security Metrics Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Events */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Tổng sự kiện</p>
                  <p className="text-xs text-blue-700">Trong 24h qua</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {metrics.totalEvents}
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
                  <p className="text-sm font-medium text-red-900">Cảnh báo hoạt động</p>
                  <p className="text-xs text-red-700">Cần xử lý</p>
                </div>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {metrics.activeAlerts}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Threat Level */}
          <Card className={`bg-gradient-to-r ${
            metrics.threatLevel === 'high' ? 'from-red-50 to-red-100 border-red-200' :
            metrics.threatLevel === 'medium' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
            'from-green-50 to-green-100 border-green-200'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  metrics.threatLevel === 'high' ? 'bg-red-500' :
                  metrics.threatLevel === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}>
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    metrics.threatLevel === 'high' ? 'text-red-900' :
                    metrics.threatLevel === 'medium' ? 'text-yellow-900' :
                    'text-green-900'
                  }`}>
                    Mức độ đe dọa
                  </p>
                  <p className={`text-xs ${
                    metrics.threatLevel === 'high' ? 'text-red-700' :
                    metrics.threatLevel === 'medium' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {metrics.threatLevel === 'high' ? 'Cao' :
                     metrics.threatLevel === 'medium' ? 'Trung bình' :
                     'Thấp'}
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${
                    metrics.threatLevel === 'high' ? 'bg-red-100 text-red-800' :
                    metrics.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  {metrics.threatLevel.toUpperCase()}
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
                  <p className="text-sm font-medium text-purple-900">Trạng thái giám sát</p>
                  <p className="text-xs text-purple-700">
                    {isSecurityDataLoading ? 'Đang tải...' : 'Hoạt động'}
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${
                    isSecurityDataLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isSecurityDataLoading ? 'LOADING' : 'ACTIVE'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
          <TabsTrigger value="testing">Kiểm thử</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SecurityOverview />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <SecurityAlerts 
            alerts={securityAlerts}
            onAcknowledge={acknowledgeSystemAlert}
            isLoading={isSecurityDataLoading}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagementTab />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <TestErrorGeneratorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityMonitor;