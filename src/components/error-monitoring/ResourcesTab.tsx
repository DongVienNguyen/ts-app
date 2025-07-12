import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SystemMetric } from '@/utils/errorTracking';
import { Filter } from 'lucide-react';

interface ResourcesTabProps {
  systemMetrics: SystemMetric[];
  isLoading: boolean; // Add isLoading prop
}

export function ResourcesTab({ systemMetrics, isLoading }: ResourcesTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Đang tải dữ liệu tài nguyên...</p>
      </div>
    );
  }

  if (systemMetrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Không có dữ liệu tài nguyên để hiển thị.</p>
      </div>
    );
  }

  const memoryMetrics = systemMetrics.filter(m => m.metric_type === 'memory' && m.metric_name === 'used_heap_size')
    .map(m => ({ ...m, created_at: new Date(m.created_at!).toLocaleString() }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const networkMetrics = systemMetrics.filter(m => m.metric_type === 'network' && m.metric_name === 'effective_type')
    .map(m => ({ ...m, created_at: new Date(m.created_at!).toLocaleString() }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const pageLoadMetrics = systemMetrics.filter(m => m.metric_type === 'performance' && m.metric_name === 'page_load_time')
    .map(m => ({ ...m, created_at: new Date(m.created_at!).toLocaleString() }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Sử dụng bộ nhớ Heap (bytes)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={memoryMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="metric_value" stroke="#8884d8" name="Used Heap Size" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loại kết nối mạng hiệu quả</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={networkMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="metric_value" stroke="#82ca9d" name="Effective Type" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thời gian tải trang (ms)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pageLoadMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="metric_value" stroke="#ffc658" name="Page Load Time" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}