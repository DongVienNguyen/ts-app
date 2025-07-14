import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
  topErrorTypes: { type: string; count: number }[];
  errorTrend: { date: string; count: number }[];
  byType: { [key: string]: number };
  bySeverity: { [key: string]: number };
  byBrowser: { [key: string]: number };
  byOS: { [key: string]: number };
}

interface ErrorAnalyticsTabProps {
  errorStats: ErrorStats;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

// Định nghĩa mã màu hex hợp lệ cho từng mức độ nghiêm trọng
const SEVERITY_HEX_COLORS: { [key: string]: string } = {
  critical: '#EF4444', // red-500
  high: '#F97316',     // orange-500
  medium: '#F59E0B',    // yellow-500
  low: '#22C55E',      // green-500
  unknown: '#6B7280',  // gray-500 (màu mặc định nếu không khớp)
};

export function ErrorAnalyticsTab({ errorStats, isLoading }: ErrorAnalyticsTabProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full lg:col-span-2" />
      </div>
    );
  }

  const { totalErrors, criticalErrors, resolvedErrors, errorRate, topErrorTypes, errorTrend, byType, bySeverity, byBrowser, byOS } = errorStats;

  const severityData = Object.entries(bySeverity).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));
  const browserData = Object.entries(byBrowser).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);
  const osData = Object.entries(byOS).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);

  // Prepare errorTrend data for Recharts LineChart
  const trendData = errorTrend.map((item: { date: string; count: number }) => ({
    date: new Date(item.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
    count: item.count,
  }));

  console.log('ErrorAnalyticsTab - Severity Data:', severityData);
  console.log('ErrorAnalyticsTab - Browser Data:', browserData);
  console.log('ErrorAnalyticsTab - OS Data:', osData);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lỗi</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              {criticalErrors} lỗi nghiêm trọng
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ lỗi nghiêm trọng</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 000-4-4V21"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 000-3-3h-6a4 4 000-3-3V21"></path>
              <circle cx="16" cy="7" r="3"></circle>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              trong tổng số lỗi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lỗi đã giải quyết</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2"></rect>
              <path d="M2 10h20"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedErrors}</div>
            <p className="text-xs text-muted-foreground">
              trong tổng số lỗi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lỗi phổ biến nhất</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topErrorTypes.length > 0 ? topErrorTypes[0].type : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              ({topErrorTypes.length > 0 ? topErrorTypes[0].count : 0} lần)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng lỗi (7 ngày qua)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Số lượng lỗi" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lỗi theo mức độ nghiêm trọng</CardTitle>
          </CardHeader>
          <CardContent>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_HEX_COLORS[entry.name] || SEVERITY_HEX_COLORS.unknown} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Không có dữ liệu để hiển thị.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lỗi theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Số lượng lỗi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lỗi theo trình duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            {browserData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={browserData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {browserData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Không có dữ liệu để hiển thị.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lỗi theo hệ điều hành</CardTitle>
          </CardHeader>
          <CardContent>
            {osData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={osData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {osData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Không có dữ liệu để hiển thị.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}