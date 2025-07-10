import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityDashboard } from './SecurityDashboard';
import { RealTimeSecurityMonitor } from './RealTimeSecurityMonitor';
import { Shield, Activity, BarChart3, Settings } from 'lucide-react';

export function EnhancedSecurityDashboard() {
  const [activeTab, setActiveTab] = useState('realtime');

  return (
    <div className="container mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Theo dõi Thời gian Thực</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Tổng quan Bảo mật</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Phân tích</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Cài đặt</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="mt-6">
          <RealTimeSecurityMonitor />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Phân tích Bảo mật</h3>
            <p className="text-gray-500">Tính năng phân tích chi tiết sẽ được phát triển trong phiên bản tiếp theo</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Cài đặt Bảo mật</h3>
            <p className="text-gray-500">Tính năng cài đặt nâng cao sẽ được phát triển trong phiên bản tiếp theo</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}