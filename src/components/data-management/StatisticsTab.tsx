import React, { useState, useEffect, useCallback } from 'react';
import { Download, Database as DatabaseIcon, BarChart as BarChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV } from '@/utils/csvUtils';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DateInput from '@/components/DateInput';
import { Label } from '@/components/ui/label';
import { format, subDays } from 'date-fns';

interface StatisticsTabProps {
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  onLoad: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ runAsAdmin, onLoad }) => {
  const [statistics, setStatistics] = useState<any[]>([]);
  const [staffTransactionStats, setStaffTransactionStats] = useState<{ name: string; count: number }[]>([]);
  const [transactionTypeStats, setTransactionTypeStats] = useState<{ name: string; value: number }[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Date filter state
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const loadAllStats = useCallback(async () => {
    setIsLoading(true);
    onLoad();
    await Promise.all([
      loadStatistics(startDate, endDate),
      loadStaffTransactionStats(startDate, endDate),
      loadTransactionTypeStats(startDate, endDate)
    ]);
    setIsLoading(false);
  }, [onLoad, startDate, endDate]);

  useEffect(() => {
    loadAllStats();
  }, []); // Load stats only once on initial render

  const loadStatistics = async (start?: string, end?: string) => {
    await runAsAdmin(async () => {
      try {
        const stats = [];
        for (const key in entityConfig) {
          const config = entityConfig[key];
          let query = supabase.from(config.entity as any).select('*', { count: 'exact', head: true });

          // Apply date filter if applicable
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
        toast.error(`Không thể tải thống kê: ${error.message}`);
      }
    });
  };

  const loadStaffTransactionStats = async (start?: string, end?: string) => {
    await runAsAdmin(async () => {
      try {
        let query = supabase.from('asset_transactions').select('staff_code');
        if (start && end) {
          query = query.gte('transaction_date', start).lte('transaction_date', end);
        }
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
      } catch (error: any) {
        console.error("Error loading staff transaction statistics:", error.message);
        toast.error(`Không thể tải thống kê giao dịch nhân viên: ${error.message}`);
      }
    });
  };

  const loadTransactionTypeStats = async (start?: string, end?: string) => {
    await runAsAdmin(async () => {
      try {
        let query = supabase.from('asset_transactions').select('transaction_type');
        if (start && end) {
          query = query.gte('transaction_date', start).lte('transaction_date', end);
        }
        const { data, error } = await query;
        if (error) throw error;

        const counts = data.reduce((acc, { transaction_type }) => {
          acc[transaction_type] = (acc[transaction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const stats = Object.entries(counts).map(([name, value]) => ({ name, value }));
        setTransactionTypeStats(stats);
      } catch (error: any) {
        console.error("Error loading transaction type stats:", error.message);
        toast.error(`Không thể tải thống kê loại giao dịch: ${error.message}`);
      }
    });
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
    loadAllStats();
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
        <div className="flex gap-4 items-end">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DatabaseIcon className="mr-2 h-5 w-5 text-blue-600" />
              Thống kê số lượng bản ghi
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            {statistics.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
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

        <Card>
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

        <Card>
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
      </div>
    </div>
  );
};