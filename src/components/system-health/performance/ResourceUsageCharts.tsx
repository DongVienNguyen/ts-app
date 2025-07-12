import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PerformanceMetric } from './types';
import { SystemHealth } from '@/components/system-health/types'; // Import SystemHealth

interface ResourceUsageChartsProps {
  metrics: PerformanceMetric[];
  health: SystemHealth | null; // Sử dụng kiểu SystemHealth
}

export const ResourceUsageCharts: React.FC<ResourceUsageChartsProps> = ({ metrics, health }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Lấy chỉ số hiệu suất mới nhất để thể hiện mức sử dụng hiện tại
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  // Giá trị mặc định trong trường hợp không có dữ liệu
  const currentCpuUsage = latestMetric?.cpuUsage ?? 0;
  const currentMemoryUsage = latestMetric?.memoryUsage ?? 0;
  const currentStorageUsage = health?.storage?.percentage ?? 0;

  // Tính toán phần trăm còn lại
  const totalUsed = currentCpuUsage + currentMemoryUsage + currentStorageUsage;
  const availablePercentage = Math.max(0, 100 - totalUsed);

  const resourceDistribution = [
    { name: 'CPU Usage', value: currentCpuUsage },
    { name: 'Memory Usage', value: currentMemoryUsage },
    { name: 'Storage Usage', value: currentStorageUsage },
    { name: 'Available', value: availablePercentage }
  ].filter(item => item.value > 0); // Lọc bỏ các mục có giá trị 0 để biểu đồ rõ ràng hơn

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resource Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="cpuUsage" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="CPU Usage (%)" />
              <Area type="monotone" dataKey="memoryUsage" stackId="2" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Memory Usage (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Resource Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {resourceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={resourceDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {resourceDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Không có dữ liệu phân phối tài nguyên.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};