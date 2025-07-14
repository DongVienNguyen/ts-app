import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { SystemMetric } from '@/utils/errorTracking';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface RealTimeMonitorProps {
  systemMetrics: SystemMetric[];
  isLoading: boolean;
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ systemMetrics, isLoading }) => {
  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  const cpuMetrics = systemMetrics
    .filter(m => m.metric_name === 'cpu_usage')
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

  const memoryMetrics = systemMetrics
    .filter(m => m.metric_name === 'used_heap_size')
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

  const networkMetrics = systemMetrics
    .filter(m => m.metric_name === 'effective_type')
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>CPU Usage</CardTitle>
          <CardDescription>Real-time CPU utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cpuMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" tickFormatter={formatTimestamp} />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Area type="monotone" dataKey="metric_value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
          <CardDescription>Heap size over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={memoryMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" tickFormatter={formatTimestamp} />
              <YAxis tickFormatter={(value: number) => `${(value / (1024 * 1024)).toFixed(1)} MB`} />
              <Tooltip formatter={(value: number) => `${(value / (1024 * 1024)).toFixed(2)} MB`} />
              <Area type="monotone" dataKey="metric_value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Type</CardTitle>
          <CardDescription>Effective network connection type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={networkMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" tickFormatter={formatTimestamp} />
              <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} tickFormatter={(value: number) => `${value}G`} />
              <Tooltip formatter={(value: number) => `${value}G`} />
              <Line type="monotone" dataKey="metric_value" stroke="#ffc658" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};