import React, { useState, useEffect, useCallback } from 'react';
import { Download, Database as DatabaseIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, Activity, Users, Tag, LineChart as LineChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV } from '@/utils/csvUtils';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import DateInput from '@/components/DateInput';
import { Label } from '@/components/ui/label';
import { format, subDays, parseISO } from 'date-fns';

interface StatisticsTabProps {
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  onLoad: () => void;
}

interface KeyMetrics {
  totalTransactions: number;
  activeStaff: number;
  mostFrequentType: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ runAsAdmin, onLoad }) => {
  const [statistics, setStatistics] = useState<any[]>([]);
  const [staffTransactionStats, setStaffTransactionStats] = useState<{ name: string; count: number }[]>([]);
  const [transactionTypeStats, setTransactionTypeStats] = useState<{ name: string; value: number }[]>([]);
  const [transactionTrends, setTransactionTrends] = useState<{ date: string; count: number }[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const calculateKeyMetrics = (staffStats: { count: number }[], typeStats: { name: string; value: number }[]) => {
    const totalTransactions = staffStats.reduce((acc, curr) => acc + curr.count, 0);
    const activeStaff = staffStats.length;
    const mostFrequentType = typeStats.length > 0 ? typeStats.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : 'N/A';
    
    setKeyMetrics({ totalTransactions, activeStaff, mostFrequentType });
  };

  const loadAllStats = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    onLoad();
    try {
      const [staffStats, typeStats, trends] = await Promise.all([
        loadStaffTransactionStats(start, end),
        loadTransactionTypeStats(start, end),
        loadTransactionTrends(start, end),
        loadStatistics(start, end) // This runs in parallel but doesn't return data for key metrics
      ]);
      
      if (staffStats && typeStats) {
        calculateKeyMetrics(staffStats, typeStats);
      }
      if (trends) {
        setTransactionTrends(trends);
      }

    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      toast.error("Không thể tải một số dữ liệu thống kê.");
    } finally {
      setIsLoading(false);
    }
  }, [onLoad]);

  useEffect(() => {
    loadAllStats(startDate, endDate);
  }, []);

  const loadStatistics = async (start: string, end: string) => {
    await runAsAdmin(async () => {
      try {
        const stats = [];
        for (const key in entityConfig) {
          const config = entityConfig[key];
          let query = supabase.from(config.entity as any).select('*', { count: 'exact', head: true });

          const dateField = config.fields.find(f => f.key === 'created_at' || f.key === 'transaction_date');
          if (dateField && start && end) {
            query = query.gte(dateField.key, start).lte(dateField.key, end);
          }

          const { count, error } = await query;
          if (error) throw error;
          stats.push({ name: config.name, count: count || 0 });
        }
        setStatistics(stats);
      } catch (error: any) {
        console.error("Error loading statistics:", error.message);
        toast.error(`Không thể tải thống kê số lượng bản ghi: ${error.message}`);
      }
    });
  };

  const loadStaffTransactionStats = async (start: string, end: string) => {
    let dataToReturn: { name: string; count: number }[] = [];
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

        const stats = Object.entries(transactionCounts)
          .map(([staffCode, count]) => ({
            name: staffNameMap.get(staffCode) || staffCode,
            count: count,
          }))
          .sort((a, b) => b.count - a.count);

        setStaffTransactionStats(stats);
        dataToReturn = stats;
      } catch (error: any) {
        console.error("Error loading staff transaction statistics:", error.message);
        toast.error(`Không thể tải thống kê giao dịch nhân viên: ${error.message}`);
      }
    });
    return dataToReturn;
  };

  const loadTransactionTypeStats = async (start: string, end: string) => {
    let dataToReturn: { name: string; value: number }[] = [];
    await runAsAdmin(async () => {
      try {
        let query = supabase.from('asset_transactions').select('transaction_type').gte('transaction_date', start).lte('transaction_date', end);
        const { data, error } = await query;
        if (error) throw error;

        const counts = data.reduce((acc, { transaction_type }) => {
          acc[transaction_type] = (acc[transaction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const stats = Object.entries(counts).map(([name, value]) => ({ name, value }));
        setTransactionTypeStats(stats);
        dataToReturn = stats;
      } catch (error: any) {
        console.error("Error loading transaction type stats:", error.message);
        toast.error(`Không thể tải thống kê loại giao dịch: ${error.message}`);
      }
    });
    return dataToReturn;
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

  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.");
      return;
    }
    loadAllStats(startDate, endDate);
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
          <div>
            <Label htmlFor="stats-start-date">Từ ngày</Label>
            <DateInput id="stats-start-date" value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <Label htmlFor="stats-end-date">Đến ngày</Label>
            <DateInput id="stats-end-date" value={endDate} onChange={setEndDate} />
          </div>
          <Button onClick={handleFilter} disabled={isLoading}>
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
            <p className="text-xs text-muted-foreground">trong khoảng thời gian đã chọn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhân viên hoạt động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : keyMetrics?.activeStaff ?? 0}</div>
            <p className="text-xs text-muted-foreground">đã thực hiện giao dịch</p>
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
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChartIcon className="mr-2 h-5 w-5 text-indigo-600" />
              Xu hướng giao dịch theo thời gian
            </CardTitle>
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
          <CardHeader>
            <CardTitle className="flex items-center">
              <DatabaseIcon className="mr-2 h-5 w-5 text-blue-600" />
              Thống kê số lượng bản ghi
            </CardTitle>
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
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5 text-amber-600" />
              Phân bổ loại giao dịch
            </CardTitle>
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
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartIcon className="mr-2 h-5 w-5 text-green-600" />
              Thống kê giao dịch theo nhân viên
            </CardTitle>
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