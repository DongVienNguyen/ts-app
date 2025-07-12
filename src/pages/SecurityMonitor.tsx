import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, TestTube, BookOpen, CheckCircle, ArrowRight, Activity, BarChart3, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/contexts/AuthContext';
import { SecurityOverview } from '@/components/SecurityOverview';
import { SecurityTestPanel } from '@/components/SecurityTestPanel';
import { SecurityDocumentation } from '@/components/SecurityDocumentation';
import { SecurityImplementationSummary } from '@/components/SecurityImplementationSummary';
import { SecurityWorkflowDemo } from '@/components/SecurityWorkflowDemo';
import { RealTimeSecurityDashboard } from '@/components/RealTimeSecurityDashboard';
import { LogManagementTab } from '@/components/data-management/LogManagementTab';

const SecurityMonitor = () => {
  const { user } = useSecureAuth();

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

        <Tabs defaultValue="realtime" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="realtime"><Activity className="w-4 h-4 mr-2" />Thời gian thực</TabsTrigger>
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-2" />Tổng hợp</TabsTrigger>
            <TabsTrigger value="actions"><TestTube className="w-4 h-4 mr-2" />Tác vụ</TabsTrigger>
            <TabsTrigger value="logs"><Trash2 className="w-4 h-4 mr-2" />Quản lý Logs</TabsTrigger>
            <TabsTrigger value="docs"><BookOpen className="w-4 h-4 mr-2" />Tài liệu</TabsTrigger>
            <TabsTrigger value="summary"><CheckCircle className="w-4 h-4 mr-2" />Tổng kết</TabsTrigger>
            <TabsTrigger value="workflow"><ArrowRight className="w-4 h-4 mr-2" />Demo</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="mt-6">
            <RealTimeSecurityDashboard />
          </TabsContent>
          <TabsContent value="overview" className="mt-6">
            <SecurityOverview />
          </TabsContent>
          <TabsContent value="actions" className="mt-6">
            <SecurityTestPanel />
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <LogManagementTab />
          </TabsContent>
          <TabsContent value="docs" className="mt-6">
            <SecurityDocumentation />
          </TabsContent>
          <TabsContent value="summary" className="mt-6">
            <SecurityImplementationSummary />
          </TabsContent>
          <TabsContent value="workflow" className="mt-6">
            <SecurityWorkflowDemo />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SecurityMonitor;