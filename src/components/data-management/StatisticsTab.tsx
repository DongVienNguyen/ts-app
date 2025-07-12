import React, { useState } from 'react';
import {
  Database as DatabaseIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig, FieldConfig } from '@/config/entityConfig';
import { toCSV } from '@/utils/csvUtils';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { DrillDownDialog } from './DrillDownDialog';
import { useStatisticsData } from '@/hooks/useStatisticsData';
import { StatisticsHeader } from './statistics/StatisticsHeader';
import { KeyMetricsGrid } from './statistics/KeyMetricsGrid';
import { ChartContainer } from './statistics/ChartContainer';

interface StatisticsTabProps {
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  onLoad: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ runAsAdmin, onLoad }) => {
  const { isLoading, chartData, keyMetrics, filters, setters } = useStatisticsData(runAsAdmin, onLoad);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [drillDown, setDrillDown] = useState<{ open: boolean; title: string; data: any[]; columns: FieldConfig[]; loading: boolean; }>({ open: false, title: '', data: [], columns: [], loading: false });

  const handleChartClick = async (payload: any, filterField: 'staff_code' | 'room' | 'transaction_type' | 'parts_day') => {
    if (!payload || !payload.originalKey) return;
  
    const filterValue = payload.originalKey;
    const title = `Chi tiết giao dịch cho: ${payload.name}`;
    
    setDrillDown({ open: true, title, data: [], columns: entityConfig.asset_transactions.fields, loading: true });
  
    await runAsAdmin(async () => {
      try {
        let query = supabase
          .from('asset_transactions')
          .select('*')
          .eq(filterField, filterValue)
          .gte('transaction_date', filters.startDate)
          .lte('transaction_date', filters.endDate);
        
        if (filters.selectedType !== 'all') {
          query = query.eq('transaction_type', filters.selectedType);
        }
  
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
  
        setDrillDown(prev => ({ ...prev, data: data || [], loading: false }));
      } catch (error: any) {
        toast.error(`Không thể tải dữ liệu chi tiết: ${error.message}`);
        setDrillDown({ open: false, title: '', data: [], columns: [], loading: false });
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
          zip.file(`${key}.csv`, `\uFEFF${csvContent}`);
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

  return (
    <div className="space-y-6">
      <DrillDownDialog 
        open={drillDown.open}
        onOpenChange={(open) => setDrillDown(prev => ({ ...prev, open }))}
        title={drillDown.title}
        data={drillDown.data}
        columns={drillDown.columns}
        loading={drillDown.loading}
      />
      <StatisticsHeader isBackingUp={isBackingUp} isLoading={isLoading} onBackup={backupAllData} filters={filters} setters={setters} />
      <KeyMetricsGrid metrics={keyMetrics} isLoading={isLoading} comparisonEnabled={filters.comparisonEnabled} />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-5">
          <ChartContainer 
            title="Xu hướng giao dịch" 
            icon={<LineChartIcon className="mr-2 h-5 w-5 text-indigo-600" />} 
            isLoading={isLoading} 
            height={350}
            exportData={chartData.transactionTrends}
            exportFields={[{key: 'date', label: 'Ngày', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}]}
            exportFilename="xu_huong_giao_dich"
          >
            <LineChart data={chartData.transactionTrends} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" name="Số giao dịch" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-3">
          <ChartContainer 
            title="Giao dịch theo nhân viên" 
            icon={<BarChartIcon className="mr-2 h-5 w-5 text-green-600" />} 
            isLoading={isLoading}
            exportData={chartData.staffTransactionStats}
            exportFields={[{key: 'name', label: 'Nhân viên', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}]}
            exportFilename="giao_dich_nhan_vien"
          >
            <BarChart data={chartData.staffTransactionStats} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={80} /><Tooltip /><Legend />
              <Bar dataKey="count" fill="#16a34a" name="Số giao dịch" onClick={(data) => handleChartClick(data, 'staff_code')} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          <ChartContainer 
            title="Phân bổ loại giao dịch" 
            icon={<PieChartIcon className="mr-2 h-5 w-5 text-amber-600" />} 
            isLoading={isLoading}
            exportData={chartData.transactionTypeStats}
            exportFields={[{key: 'name', label: 'Loại giao dịch', type: 'text'}, {key: 'value', label: 'Số lượng', type: 'number'}]}
            exportFilename="phan_bo_loai_giao_dich"
          >
            <PieChart>
              <Pie data={chartData.transactionTypeStats} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} onClick={(data) => handleChartClick(data.payload, 'transaction_type')} style={{ cursor: 'pointer' }}>
                {chartData.transactionTypeStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-3">
          <ChartContainer 
            title="Giao dịch theo phòng" 
            icon={<BarChartIcon className="mr-2 h-5 w-5 text-cyan-600" />} 
            isLoading={isLoading}
            exportData={chartData.roomTransactionStats}
            exportFields={[{key: 'name', label: 'Phòng', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}]}
            exportFilename="giao_dich_theo_phong"
          >
            <BarChart data={chartData.roomTransactionStats} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={80} /><Tooltip /><Legend />
              <Bar dataKey="count" fill="#0891b2" name="Số giao dịch" onClick={(data) => handleChartClick(data, 'room')} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          <ChartContainer 
            title="Giao dịch theo Ca" 
            icon={<BarChartIcon className="mr-2 h-5 w-5 text-purple-600" />} 
            isLoading={isLoading}
            exportData={chartData.partsDayTransactionStats}
            exportFields={[{key: 'name', label: 'Ca', type: 'text'}, {key: 'count', label: 'Số giao dịch', type: 'number'}]}
            exportFilename="giao_dich_theo_ca"
          >
            <BarChart data={chartData.partsDayTransactionStats} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Số giao dịch" onClick={(data) => handleChartClick(data, 'parts_day')} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-5">
          <ChartContainer 
            title="Số lượng bản ghi" 
            icon={<DatabaseIcon className="mr-2 h-5 w-5 text-blue-600" />} 
            isLoading={isLoading}
            exportData={chartData.statistics}
            exportFields={[{key: 'name', label: 'Bảng', type: 'text'}, {key: 'count', label: 'Số bản ghi', type: 'number'}]}
            exportFilename="so_luong_ban_ghi"
          >
            <BarChart data={chartData.statistics} margin={{ top: 5, right: 20, left: 10, bottom: 75 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} /><YAxis allowDecimals={false} /><Tooltip /><Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Số bản ghi" />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};