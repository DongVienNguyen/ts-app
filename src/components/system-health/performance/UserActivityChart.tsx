import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import { PerformanceMetric } from './types';

interface UserActivityChartProps {
  metrics: PerformanceMetric[];
}

export const UserActivityChart: React.FC<UserActivityChartProps> = ({ metrics }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-4 w-4" />
          Active Users Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="activeUsers" fill="#06B6D4" name="Active Users" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};