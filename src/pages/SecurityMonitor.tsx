import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, TestTube, BookOpen, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/contexts/AuthContext';
import { RealTimeSecurityMonitor } from '@/components/RealTimeSecurityMonitor';
import { EnhancedSecurityDashboard } from '@/components/EnhancedSecurityDashboard';
import { SecurityTestPanel } from '@/components/SecurityTestPanel';
import { SecurityDocumentation } from '@/components/SecurityDocumentation';
import { SecurityImplementationSummary } from '@/components/SecurityImplementationSummary';
import { SecurityWorkflowDemo } from '@/components/SecurityWorkflowDemo';

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

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="dashboard"><Shield className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="realtime"><Activity className="w-4 h-4 mr-2" />Giám sát</TabsTrigger>
            <TabsTrigger value="test"><TestTube className="w-4 h-4 mr-2" />Test</TabsTrigger>
            <TabsTrigger value="docs"><BookOpen className="w-4 h-4 mr-2" />Tài liệu</TabsTrigger>
            <TabsTrigger value="summary"><CheckCircle className="w-4 h-4 mr-2" />Tổng kết</TabsTrigger>
            <TabsTrigger value="workflow"><ArrowRight className="w-4 h-4 mr-2" />Demo</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <EnhancedSecurityDashboard />
          </TabsContent>
          <TabsContent value="realtime" className="mt-6">
            <RealTimeSecurityMonitor />
          </TabsContent>
          <TabsContent value="test" className="mt-6">
            <SecurityTestPanel />
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