import React, { useState, useEffect } from 'react';
import { Download, Database as DatabaseIcon, BarChart as BarChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV } from '@/utils/csvUtils';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatisticsTabProps {
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  onLoad: () => void;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ runAsAdmin, onLoad }) => {
  const [statistics, setStatistics] = useState<any[]>([]);
  const [staffTransactionStats, setStaffTransactionStats] = useState<{ name: string; count: number }[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    onLoad();
    loadStatistics();
    loadStaffTransactionStats();
  }, [onLoad]);

  const loadStatistics = async () => {
    await runAsAdmin(async () => {
      try {
        const stats = [];
        for (const key in entityConfig) {
          const { count, error } = await supabase
            .from(entityConfig[key].entity as any)
            .select('*', { count: 'exact', head: true });
          if (error) throw error;
          stats.push({ name: entityConfig[key].name, count: count || 0 });
        }
        setStatistics(stats);
      } catch (error: any) {
        console.error("Error loading statistics:", error.message);
        toast.error(`Không thể tải thống kê: ${error.message}`);
      }
    });
  };

  const loadStaffTransactionStats = async () => {
    await runAsAdmin(async () => {
      try {
        const { data: transactions, error: transactionsError } = await supabase
          .from('asset_transactions')
          .select('staff_code');
        if (transactionsError) throw transactionsError;

        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('username, staff_name');
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

  return (
    <div className="space-y-6">
      <Button onClick={backupAllData} disabled={isBackingUp} className="mb-4">
        <Download className="mr-2 h-4 w-4" /> {isBackingUp ? 'Đang sao lưu...' : 'Sao lưu toàn bộ dữ liệu'}
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DatabaseIcon className="mr-2 h-5 w-5 text-blue-600" />
            Thống kê số lượng bản ghi
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <p>Không có dữ liệu thống kê.</p>
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
        <CardContent>
          {staffTransactionStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={staffTransactionStats} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#16a34a" name="Số giao dịch" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Không có dữ liệu thống kê.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};