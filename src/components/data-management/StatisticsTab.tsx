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
  ArrowDown,
  Home
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

interface StatisticsTabProps {
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  onLoad: () => void;
}

interface KeyMetrics {
  totalTransactions: number;
  activeStaff: number;
  mostFrequentType: string;
  mostActiveRoom: string;
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
  const [roomTransactionStats, setRoomTransactionStats] = useState<{ name: string; count: number }[]>([]);
  const [transactionTypeStats, setTransactionTypeStats] = useState<{ name: string; value: number }[]>([]);
  const [transactionTrends, setTransactionTrends] = useState<{ date: string; count: number }[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const fetchTransactionTypes = async () => {
      await runAsAdmin(async () => {
        const { data, error } = await supabase.from('asset_transactions').select('transaction_type');
        if (error) {
          toast.error("Không thể tải danh sách loại giao dịch.");
        } else if (data) {
          const uniqueTypes = [...new Set(data.map(item => item.transaction_type).filter(Boolean))] as string[];
          setTransactionTypes(uniqueTypes);
        }
      });
    };
    fetchTransactionTypes();
  }, [runAsAdmin]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? Infinity : 0;
    return ((current - previous) / previous) * 100;
  };

  const loadData = async (loader: (start: string, end: string, type: string) => Promise<any>, start: string, end: string, type: string) => {
    let result = null;
    await runAsAdmin(async () => {
      result = await loader(start, end, type);
    });
    return result;
  };

  const loadStatistics = async (start: string, end: string) => {
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
    return Promise.all(promises);
  };

  const createStatsLoader = (field: 'staff_code' | 'room' | 'transaction_type', nameMappingTable?: 'staff') => async (start: string, end: string, type: string) => {
    let query = supabase.from('asset_transactions').select(`${field}, staff_name:staff(staff_name)`).gte('transaction_date', start).lte('transaction_date', end);
    if (type !== 'all') query = query.eq('transaction_type', type);
    
    const { data, error } = await query;
    if (error) throw error;

    let staffNameMap: Map<string, string> | null = null;
    if (nameMappingTable === 'staff') {
        const { data: staffData, error: staffError } = await supabase.from('staff').select('username, staff_name');
        if (staffError) throw staffError;
        staffNameMap = new Map(staffData.map(s => [s.username, s.staff_name || s.username]));
    }

    const counts = data.reduce((acc, item) => {
      const key = item[field];
      if(key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([key, count]) => ({
        name: field === 'staff_code' && staffNameMap ? (staffNameMap.get(key) || key) : key,
        count: count,
        value: count, // for pie chart
      }))
      .sort((a, b) => b.count - a.count);
  };

  const loadStaffTransactionStats = createStatsLoader('staff_code', 'staff');
  const loadRoomTransactionStats = createStatsLoader('room');
  const loadTransactionTypeStats = createStatsLoader('transaction_type');

  const loadTransactionTrends = async (start: string, end: string, type: string) => {
    let query = supabase.from('asset_transactions').select('transaction_date').gte('transaction_date', start).lte('transaction_date', end);
    if (type !== 'all') query = query.eq('transaction_type', type);
    query = query.order('transaction_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const countsByDate = data.reduce((acc, { transaction_date }) => {
      const date = format(parseISO(transaction_date), 'dd/MM');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countsByDate).map(([date, count]) => ({ date, count }));
  };

  const loadAllStats = useCallback(async (start: string, end: string, type: string) => {
    if (!start || !end) return;
    setIsLoading(true);
    onLoad();
    try {
      const loaders = {
        staff: loadStaffTransactionStats,
        room: loadRoomTransactionStats,
        type: loadTransactionTypeStats,
        trends: loadTransactionTrends,
        records: loadStatistics,
      };

      const currentPeriodPromises = Object.values(loaders).map(loader => loadData(loader, start, end, type));
      
      let previousPeriodPromises: Promise<any>[] = [];
      if (comparisonEnabled) {
        const startDateObj = parseISO(start);
        const endDateObj = parseISO(end);
        const diff = differenceInDays(endDateObj, startDateObj);
        const prevStartDate = format(subDays(startDateObj, diff + 1), 'yyyy-MM-dd');
        const prevEndDate = format(subDays(endDateObj, diff + 1), 'yyyy-MM-dd');
        previousPeriodPromises = [loaders.staff, loaders.room].map(loader => loadData(loader, prevStartDate, prevEndDate, type));
      }

      const [
        currentStaffStats, currentRoomStats, currentTypeStats, currentTrends, currentRecordStats,
        previousStaffStats, previousRoomStats
      ] = await Promise.all([...currentPeriodPromises, ...previousPeriodPromises]);

      setStaffTransactionStats(currentStaffStats || []);
      setRoomTransactionStats(currentRoomStats || []);
      setTransactionTypeStats(currentTypeStats || []);
      setTransactionTrends(currentTrends || []);
      setStatistics(currentRecordStats || []);

      const totalTransactions = (currentStaffStats || []).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
      const activeStaff = (currentStaffStats || []).length;
      const mostFrequentType = currentTypeStats && currentTypeStats.length > 0 ? currentTypeStats[0].name : 'N/A';
      const mostActiveRoom = currentRoomStats && currentRoomStats.length > 0 ? currentRoomStats[0].name : 'N/A';

      let metrics: KeyMetrics = { totalTransactions, activeStaff, mostFrequentType, mostActiveRoom };

      if (comparisonEnabled) {
        const prevTotalTransactions = (previousStaffStats || []).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
        const prevActiveStaff = (previousStaffStats || []).length;
        metrics.totalTransactionsChange = calculatePercentageChange(totalTransactions, prevTotalTransactions);
        metrics.activeStaffChange = calculatePercentageChange(activeStaff, prevActiveStaff);
      }
      
      setKeyMetrics(metrics);

    } catch (error: any) {
      toast.error(`Không thể tải dữ liệu thống kê: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [onLoad, comparisonEnabled]);

  useEffect(() => {
    loadAllStats(startDate, endDate, selectedType);
  }, [loadAllStats, startDate, endDate, selectedType, comparisonEnabled]);

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
        <Button onClick={backupAllData} disabled={isBackingUp || isLoading}>
          <Download className="mr-2 h-4 w-4" /> {isBackingUp ? 'Đang sao lưu...' : 'Sao lưu toàn bộ dữ liệu'}
        </Button>
        <div className="flex-grow" />
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex items-center space-x-2 self-end">
            <Switch id="comparison-mode" checked={comparisonEnabled} onCheckedChange={setComparisonEnabled} />
            <Label htmlFor="comparison-mode">So sánh kỳ trước</Label>
          </div>
          <div>
            <Label>Loại giao dịch</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {transactionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stats-start-date">Từ ngày</Label>
            <DateInput id="stats-start-date" value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <Label htmlFor="stats-end-date">Đến ngày</Label>
            <DateInput id="stats-end-date" value={endDate} onChange={setEndDate} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Loại GD phổ biến</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={keyMetrics?.mostFrequentType}>{isLoading ? '...' : keyMetrics?.mostFrequentType ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">phổ biến nhất trong kỳ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phòng hoạt động nhất</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={keyMetrics?.mostActiveRoom}>{isLoading ? '...' : keyMetrics?.mostActiveRoom ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">sôi nổi nhất trong kỳ</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center"><LineChartIcon className="mr-2 h-5 w-5 text-indigo-600" />Xu hướng giao dịch</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleExportChartData(transactionTrends, [{key: 'date', label: 'Ngày', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}], 'xu_huong_giao_dich')}><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={transactionTrends} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                <Line type="monotone" dataKey="count" stroke="#4f46e5" name="Số giao dịch" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center"><BarChartIcon className="mr-2 h-5 w-5 text-green-600" />Giao dịch theo nhân viên</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleExportChartData(staffTransactionStats, [{key: 'name', label: 'Nhân viên', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}], 'giao_dich_nhan_vien')}><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={staffTransactionStats} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={80} /><Tooltip /><Legend />
                <Bar dataKey="count" fill="#16a34a" name="Số giao dịch" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-amber-600" />Phân bổ loại giao dịch</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleExportChartData(transactionTypeStats, [{key: 'name', label: 'Loại giao dịch', type: 'text'}, {key: 'value', label: 'Số lượng', type: 'number'}], 'phan_bo_loai_giao_dich')}><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={transactionTypeStats} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {transactionTypeStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center"><BarChartIcon className="mr-2 h-5 w-5 text-cyan-600" />Giao dịch theo phòng</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleExportChartData(roomTransactionStats, [{key: 'name', label: 'Phòng', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}], 'giao_dich_theo_phong')}><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={roomTransactionStats} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={80} /><Tooltip /><Legend />
                <Bar dataKey="count" fill="#0891b2" name="Số giao dịch" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center"><DatabaseIcon className="mr-2 h-5 w-5 text-blue-600" />Số lượng bản ghi</CardTitle>
             <Button variant="ghost" size="sm" onClick={() => handleExportChartData(statistics, [{key: 'name', label: 'Bảng', type: 'text'}, {key: 'count', label: 'Số bản ghi', type: 'number'}], 'so_luong_ban_ghi')}><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="relative">
            {isLoading && renderLoading()}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={statistics} margin={{ top: 5, right: 20, left: 10, bottom: 75 }}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Số bản ghi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};