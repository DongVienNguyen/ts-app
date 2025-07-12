import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Settings } from 'lucide-react';
import { SecurityFeaturesSummary } from './SecurityFeaturesSummary';

export function EnhancedSecurityDashboard() {
  return (
    <div className="container mx-auto p-0">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <SecurityFeaturesSummary />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phân tích Bảo mật</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Sắp ra mắt</h3>
              <p className="text-sm text-gray-500">Tính năng phân tích chi tiết sẽ được phát triển trong phiên bản tiếp theo.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cài đặt Bảo mật</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Sắp ra mắt</h3>
              <p className="text-sm text-gray-500">Tính năng cài đặt nâng cao sẽ được phát triển trong phiên bản tiếp theo.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}