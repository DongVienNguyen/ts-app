import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ThreatAnalysisCardProps {
  data: { date: string; successfulLogins: number; failedLogins: number; suspiciousActivities: number }[];
}

export function ThreatAnalysisCard({ data }: ThreatAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart className="w-5 h-5" />
          <span>Phân tích Mối đe dọa</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="successfulLogins" stroke="#82ca9d" name="Đăng nhập thành công" />
              <Line type="monotone" dataKey="failedLogins" stroke="#8884d8" name="Đăng nhập thất bại" />
              <Line type="monotone" dataKey="suspiciousActivities" stroke="#ffc658" name="Hoạt động đáng ngờ" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Không có đủ dữ liệu để hiển thị phân tích mối đe dọa.
          </p>
        )}
      </CardContent>
    </Card>
  );
}