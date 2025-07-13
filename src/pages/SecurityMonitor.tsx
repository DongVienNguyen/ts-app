import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, TestTube, BookOpen, CheckCircle, ArrowRight, Activity, BarChart3, Trash2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/contexts/AuthContext';
import { SecurityOverview } from '@/components/SecurityOverview';
import { SecurityActionsPanel } from '@/components/security/SecurityActionsPanel';
import { LiveActivityFeed } from '@/components/security/LiveActivityFeed';
import { ThreatAnalysisCard } from '@/components/security/ThreatAnalysisCard';
import { TestErrorGeneratorTab } from '@/components/security/TestErrorGeneratorTab';
import { SecurityDocumentation } from '@/components/SecurityDocumentation';
import { SecurityImplementationSummary } from '@/components/SecurityImplementationSummary';
import { SecurityWorkflowDemo } from '@/components/SecurityWorkflowDemo';
import { RealTimeSecurityDashboard } from '@/components/RealTimeSecurityDashboard';
import { LogManagementTab } from '@/components/data-management/LogManagementTab';
import { UserManagementTab } from '@/components/security/UserManagementTab';
import { useState } from 'react';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { SecurityAlerts } from '@/components/security/SecurityAlerts'; // Import SecurityAlerts

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

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trung tâm Giám sát Bảo mật</h1>
            <p className="text-gray-500">Theo dõi, kiểm tra và quản lý toàn bộ khía cạnh bảo mật của hệ thống.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
            <TabsTrigger value="users">Quản lý người dùng</TabsTrigger>
            <TabsTrigger value="test_errors">Tạo Lỗi Test</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <SecurityOverview />
              <SecurityActionsPanel />
              <LiveActivityFeed
                events={recentEvents}
                isRealTimeEnabled={true} // Assuming real-time is always enabled here
                isLoading={isSecurityDataLoading}
                isRefreshing={isRefreshing}
                onRefresh={refreshEvents}
                forceUpdateCounter={forceUpdateCounter}
              />
              <ThreatAnalysisCard
                threatTrends={threatTrends}
                isLoading={isSecurityDataLoading}
              />
            </div>
          </TabsContent>
          <TabsContent value="alerts" className="mt-6">
            <SecurityAlerts
              alerts={securityAlerts}
              isLoading={isSecurityDataLoading}
            />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UserManagementTab />
          </TabsContent>
          <TabsContent value="test_errors" className="mt-6">
            <TestErrorGeneratorTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SecurityMonitor;