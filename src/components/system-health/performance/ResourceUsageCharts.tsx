import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PerformanceMetric } from './types';

interface ResourceUsageChartsProps {
  metrics: PerformanceMetric[];
  health: any;
}

export const ResourceUsageCharts: React.FC<ResourceUsageChartsProps> = ({ metrics, health }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const resourceDistribution = [
    { name: 'CPU Usage', value: health.memory.percentage },
    { name: 'Memory Usage', value: health.memory.percentage },
    { name: 'Storage Usage', value: health.storage.percentage },
    { name: 'Available', value: Math.max(0, 100 - health.memory.percentage - health.storage.percentage) }
  ];

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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={resourceDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {resourceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};