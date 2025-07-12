import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, PieChart } from 'recharts';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell, Line } from 'recharts';
import { SystemError } from '@/utils/errorTracking';
import { Filter, Download } from 'lucide-react'; // Import Download icon
import { Button } from '@/components/ui/button'; // Import Button component
import { toast } from 'sonner'; // Import toast for notifications
import { convertToCSV, downloadCSV } from '@/utils/csvUtils'; // Import CSV utilities

interface ErrorAnalyticsTabProps {
  errorStats: {
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
    recent: SystemError[];
  };
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19B7'];

export function ErrorAnalyticsTab({ errorStats, isLoading }: ErrorAnalyticsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Đang tải dữ liệu phân tích...</p>
      </div>
    );
  }

  if (errorStats.totalErrors === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Không có dữ liệu lỗi để phân tích.</p>
      </div>
    );
  }

  const severityData = Object.entries(errorStats.bySeverity).map(([name, value]) => ({ name, value }));
  const typeData = Object.entries(errorStats.byType).map(([name, value]) => ({ name, value }));
  const browserData = Object.entries(errorStats.byBrowser).map(([name, value]) => ({ name, value }));
  const osData = Object.entries(errorStats.byOS).map(([name, value]) => ({ name, value }));

  const handleExport = (data: any[], headers: string[], filename: string) => {
    if (data.length === 0) {
      toast.info('Không có dữ liệu để xuất.');
      return;
    }
    try {
      const csv = convertToCSV(data, headers);
      downloadCSV(csv, filename);
      toast.success(`Đã xuất dữ liệu ${filename}.csv thành công!`);
    } catch (error) {
      console.error('Lỗi khi xuất CSV:', error);
      toast.error('Không thể xuất dữ liệu CSV.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Xu hướng lỗi (7 ngày qua)</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => handleExport(errorStats.errorTrend, ['date', 'count'], 'error_trend')}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorStats.errorTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Số lỗi" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lỗi theo mức độ nghiêm trọng</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => handleExport(severityData, ['name', 'value'], 'error_by_severity')}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
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
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lỗi theo loại</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => handleExport(typeData, ['name', 'value'], 'error_by_type')}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name="Số lỗi" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lỗi theo trình duyệt</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => handleExport(browserData, ['name', 'value'], 'error_by_browser')}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={browserData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#ffc658" name="Số lỗi" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lỗi theo hệ điều hành</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => handleExport(osData, ['name', 'value'], 'error_by_os')}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={osData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#a4de6c" name="Số lỗi" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}