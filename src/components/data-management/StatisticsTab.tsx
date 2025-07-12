import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  Database as DatabaseIcon, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Activity, 
  Users, 
  Tag, 
  LineChart as LineChartIcon,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig, FieldConfig } from '@/config/entityConfig';
import { toCSV } from '@/utils/csvUtils';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import DateInput from '@/components/DateInput';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

interface StatisticsTabProps {
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  onLoad: () => void;
}

interface KeyMetrics {
  totalTransactions: number;
  activeStaff: number;
  mostFrequentType: string;
  totalTransactionsChange?: number;
  activeStaffChange?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const MetricChange = ({ value }: { value: number | undefined }) => {
  if (value === undefined || !isFinite(value)) {
    return <p className="text-xs text-muted-foreground">Không có dữ liệu kỳ trước để so sánh</p>;
  }
  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-muted-foreground';
  const Icon = isPositive ? ArrowUp : ArrowDown;

  return (
    <p className={`text-xs flex items-center font-medium ${color}`}>
      {isPositive || isNegative ? <Icon className="h-3 w-3 mr-1" /> : null}
      {value.toFixed(1)}% so với kỳ trước
    </p>
  );
};

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ runAsAdmin, onLoad }) => {
  const [statistics, setStatistics] = useState<any[]>([]);
  const [staffTransactionStats, setStaffTransactionStats] = useState<{ name: string; count: number }[]>([]);
  const [transactionTypeStats, setTransactionTypeStats] = useState<{ name: string; value: number }[]>([]);
  const [transactionTrends, setTransactionTrends] = useState<{ date: string; count: number }[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? Infinity : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const loadStatistics = async (start: string, end: string) => {
    let stats: any[] = [];
    await runAsAdmin(async () => {
      try {
        const promises = Object.keys(entityConfig).map(async (key) => {
          const config = entityConfig[key];
          let query = supabase.from(config.entity as any).select('*', { count: 'exact', head: true });

          const dateField = config.fields.find(f => f.key === 'created_at' || f.key === 'transaction_date');
          if (dateField && start && end) {
            query = query.gte(dateField.key, start).lte(dateField.key, end);
          }

          const { count, error } = await query;
          if (error) throw error;
          return { name: config.name, count: count || 0 };
        });
        stats = await Promise.all(promises);
      } catch (error: any) {
        console.error("Error loading statistics:", error.message);
        toast.error(`Không thể tải thống kê số lượng bản ghi: ${error.message}`);
      }
    });
    return stats;
  };

  const loadStaffTransactionStats = async (start: string, end: string) => {
    let stats: { name: string; count: number }[] = [];
    await runAsAdmin(async () => {
      try {
        let query = supabase.from('asset_transactions').select('staff_code').gte('transaction_date', start).lte('transaction_date', end);
        const { data: transactions, error: transactionsError } = await query;
        if (transactionsError) throw transactionsError;

        const { data: staff, error: staffError } = await supabase.from('staff').select('username, staff_name');
        if (staffError) throw staffError;

        const staffNameMap = new Map(staff.map(s => [s.username, s.staff_name || s.username]));
        
        const transactionCounts = transactions.reduce((acc, transaction) => {
          const staffCode = transaction.staff_code;
          acc[staffCode] = (acc[staffCode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        stats = Object.entries(transactionCounts)
          .map(([staffCode, count]) => ({
            name: staffNameMap.get(staffCode) || staffCode,
            count: count,
          }))
          .sort((a, b) => b.count - a.count);
      } catch (error: any) {
        console.error("Error loading staff transaction statistics:", error.message);
        toast.error(`Không thể tải thống kê giao dịch nhân viên: ${error.message}`);
      }
    });
    return stats;
  };

  const loadTransactionTypeStats = async (start: string, end: string) => {
    let stats: { name: string; value: number }[] = [];
    await runAsAdmin(async () => {
      try {
        let query = supabase.from('asset_transactions').select('transaction_type').gte('transaction_date', start).lte('transaction_date', end);
        const { data, error } = await query;
        if (error) throw error;

        const counts = data.reduce((acc, { transaction_type }) => {
          acc[transaction_type] = (acc[transaction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        stats = Object.entries(counts).map(([name, value]) => ({ name, value }));
      } catch (error: any) {
        console.error("Error loading transaction type stats:", error.message);
        toast.error(`Không thể tải thống kê loại giao dịch: ${error.message}`);
      }
    });
    return stats;
  };

  const loadTransactionTrends = async (start: string, end: string) => {
    let trends: { date: string; count: number }[] = [];
    await runAsAdmin(async () => {
      try {
        const { data, error } = await supabase
          .from('asset_transactions')
          .select('transaction_date')
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: true });

        if (error) throw error;

        const countsByDate = data.reduce((acc, { transaction_date }) => {
          const date = format(parseISO(transaction_date), 'dd/MM');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        trends = Object.entries(countsByDate).map(([date, count]) => ({ date, count }));
      } catch (error: any) {
        console.error("Error loading transaction trends:", error.message);
        toast.error(`Không thể tải xu hướng giao dịch: ${error.message}`);
      }
    });
    return trends;
  };

  const loadAllStats = useCallback(async (start: string, end: string) => {
    if (!start || !end) return;
    setIsLoading(true);
    onLoad();
    try {
      const currentPeriodPromises = [
        loadStaffTransactionStats(start, end),
        loadTransactionTypeStats(start, end),
        loadTransactionTrends(start, end),
        loadStatistics(start, end)
      ];

      let previousPeriodPromises: Promise<any>[] = [Promise.resolve(null), Promise.resolve(null)];
      if (comparisonEnabled) {
        const startDateObj = parseISO(start);
        const endDateObj = parseISO(end);
        const diff = differenceInDays(endDateObj, startDateObj);
        const prevStartDate = format(subDays(startDateObj, diff + 1), 'yyyy-MM-dd');
        const prevEndDate = format(subDays(endDateObj, diff + 1), 'yyyy-MM-dd');
        previousPeriodPromises = [
          loadStaffTransactionStats(prevStartDate, prevEndDate),
          loadTransactionTypeStats(prevStartDate, prevEndDate),
        ];
      }

      const [
        currentStaffStats, 
        currentTypeStats, 
        currentTrends, 
        currentRecordStats,
        previousStaffStats,
      ] = await Promise.all([...currentPeriodPromises, ...previousPeriodPromises]);

      setStaffTransactionStats(currentStaffStats);
      setTransactionTypeStats(currentTypeStats);
      setTransactionTrends(currentTrends);
      setStatistics(currentRecordStats);

      const totalTransactions = currentStaffStats.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
      const activeStaff = currentStaffStats.length;
      const mostFrequentType = currentTypeStats.length > 0 ? currentTypeStats.reduce((prev: any, current: any) => (prev.value > current.value) ? prev : current).name : 'N/A';

      let metrics: KeyMetrics = { totalTransactions, activeStaff, mostFrequentType };

      if (comparisonEnabled && previousStaffStats) {
        const prevTotalTransactions = previousStaffStats.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
        const prevActiveStaff = previousStaffStats.length;
        
        metrics.totalTransactionsChange = calculatePercentageChange(totalTransactions, prevTotalTransactions);
        metrics.activeStaffChange = calculatePercentageChange(activeStaff, prevActiveStaff);
      }
      
      setKeyMetrics(metrics);

    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      toast.error("Không thể tải một số dữ liệu thống kê.");
    } finally {
      setIsLoading(false);
    }
  }, [onLoad, comparisonEnabled]);

  useEffect(() => {
    loadAllStats(startDate, endDate);
  }, [loadAllStats, startDate, endDate, comparisonEnabled]);

  const backupAllData = async () => {
    setIsBackingUp(true);
    await runAsAdmin(async () => {
      try {
        const zip = new JSZip();
        for (const key in entityConfig) {
          const config = entityConfig[key];
          const { data: tableData, error } = await supabase.from(config.entity as any).select('*');
          if (error) throw error;
          const csvContent = toCSV(tableData || [], config.fields);
          zip.file(`${key}.csv`, csvContent);
        }
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.setAttribute('download', `supabase_backup_${new Date().toISOString().slice(0, 10)}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Sao lưu toàn bộ dữ liệu thành công.");
      } catch (error: any) {
        toast.error(`Không thể sao lưu dữ liệu: ${error.message || 'Lỗi không xác định'}`);
      }
    });
    setIsBackingUp(false);
  };

  const handleExportChartData = (data: any[], fields: FieldConfig[], filename: string) => {
    if (!data || data.length === 0) {
      toast.info("Không có dữ liệu để xuất.");
      return;
    }
    try {
      const csvContent = toCSV(data, fields);
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Đã xuất dữ liệu ${filename}.`);
    } catch (error: any) {
      toast.error(`Lỗi khi xuất dữ liệu: ${error.message}`);
    }
  };

  const renderLoading = () => (
    <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-10">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <Button onClick={backupAllData} disabled={isBackingUp}>
          <Download className="mr-2 h-4 w-4" /> {isBackingUp ? 'Đang sao lưu...' : 'Sao lưu toàn bộ dữ liệu'}
        </Button>
        <div className="flex-grow" />
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex items-center space-x-2 self-end">
            <Switch
              id="comparison-mode"
              checked={comparisonEnabled}
              onCheckedChange={setComparisonEnabled}
            />
            <Label htmlFor="comparison-mode">So sánh kỳ trước</Label>
          </div>
          <div>
            <Label htmlFor="stats-start-date">Từ ngày</Label>
            <DateInput id="stats-start-date" value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <Label htmlFor="stats-end-date">Đến ngày</Label>
            <DateInput id="stats-end-date" value={endDate} onChange={setEndDate} />
          </div>
          <Button onClick={() => loadAllStats(startDate, endDate)} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Áp dụng'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : keyMetrics?.totalTransactions ?? 0}</div>
            {comparisonEnabled && <MetricChange value={keyMetrics?.totalTransactionsChange} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên hoạt động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : keyMetrics?.activeStaff ?? 0}</div>
            {comparisonEnabled && <MetricChange value={keyMetrics?.activeStaffChange} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loại giao dịch phổ biến</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : keyMetrics?.mostFrequentType ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">phổ biến nhất trong kỳ</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <LineChartIcon className="mr-2 h-5 w-5 text-indigo-600" />
              Xu hướng giao dịch theo thời gian
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleExportChartData(transactionTrends, [{key: 'date', label: 'Ngày', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}], 'xu_huong_giao_dich')}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            {transactionTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={transactionTrends} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" name="Số giao dịch" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-10">Không có dữ liệu xu hướng giao dịch.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <DatabaseIcon className="mr-2 h-5 w-5 text-blue-600" />
              Thống kê số lượng bản ghi
            </CardTitle>
             <Button variant="ghost" size="sm" onClick={() => handleExportChartData(statistics, [{key: 'name', label: 'Bảng', type: 'text'}, {key: 'count', label: 'Số bản ghi', type: 'number'}], 'thong_ke_so_luong_ban_ghi')}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            {statistics.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statistics} margin={{ top: 5, right: 20, left: 10, bottom: 75 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Số bản ghi" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-10">Không có dữ liệu thống kê.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5 text-amber-600" />
              Phân bổ loại giao dịch
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleExportChartData(transactionTypeStats, [{key: 'name', label: 'Loại giao dịch', type: 'text'}, {key: 'value', label: 'Số lượng', type: 'number'}], 'phan_bo_loai_giao_dich')}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            {transactionTypeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={transactionTypeStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {transactionTypeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-10">Không có dữ liệu thống kê.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChartIcon className="mr-2 h-5 w-5 text-green-600" />
              Thống kê giao dịch theo nhân viên
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleExportChartData(staffTransactionStats, [{key: 'name', label: 'Nhân viên', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}], 'thong_ke_giao_dich_nhan_vien')}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            {staffTransactionStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={staffTransactionStats} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#16a34a" name="Số giao dịch" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-10">Không có dữ liệu thống kê.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};