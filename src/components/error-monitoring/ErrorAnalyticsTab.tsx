import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface ErrorStats {
  errorTrend: { date: string; count: number }[];
  topErrorTypes: { type: string; count: number }[];
  bySeverity: { [key: string]: number };
  byBrowser: { [key: string]: number };
  byOS: { [key: string]: number };
}

interface ErrorAnalyticsTabProps {
  errorStats: ErrorStats;
}

export function ErrorAnalyticsTab({ errorStats }: ErrorAnalyticsTabProps) {
  const severityData = Object.entries(errorStats.bySeverity || {}).map(([name, value]) => ({ name, value }));
  const browserData = Object.entries(errorStats.byBrowser || {}).map(([name, value]) => ({ name, value }));
  const osData = Object.entries(errorStats.byOS || {}).map(([name, value]) => ({ name, value }));
  
  const SEVERITY_COLORS: { [key: string]: string } = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
    unknown: '#6b7280',
  };

  const GENERIC_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF80E2'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Xu hướng Lỗi (7 ngày qua)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorStats.errorTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ef4444" name="Số lỗi" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Loại Lỗi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorStats.topErrorTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" name="Số lần xuất hiện" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân bố lỗi theo mức độ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {severityData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={SEVERITY_COLORS[entry.name.toLowerCase()] || SEVERITY_COLORS.unknown} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} lỗi`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân bố lỗi theo trình duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={browserData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {browserData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={GENERIC_COLORS[index % GENERIC_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} lỗi`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân bố lỗi theo hệ điều hành</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={osData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {osData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={GENERIC_COLORS[index % GENERIC_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} lỗi`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}