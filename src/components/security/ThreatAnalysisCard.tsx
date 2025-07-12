import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ThreatAnalysisCardProps {
  data: {
    date: string;
    successfulLogins: number;
    failedLogins: number;
    suspiciousActivities: number;
  }[];
  isLoading: boolean;
}

export function ThreatAnalysisCard({ data, isLoading }: ThreatAnalysisCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Phân tích Mối đe dọa</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 20,
                left: -10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="failedLogins" name="Thất bại" stroke="#ef4444" />
              <Line type="monotone" dataKey="suspiciousActivities" name="Đáng ngờ" stroke="#f97316" />
              <Line type="monotone" dataKey="successfulLogins" name="Thành công" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 h-[220px] flex items-center justify-center">
            <p className="text-gray-500">Không có đủ dữ liệu để phân tích.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}