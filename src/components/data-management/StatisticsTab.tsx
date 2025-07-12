import React, { useState, useEffect } from 'react';
import { Download, Database as DatabaseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV } from '@/utils/csvUtils';
import JSZip from 'jszip';
import { toast } from 'sonner'; // Import toast

interface StatisticsTabProps {
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  // setMessage: (message: { type: string; text: string }) => void; // Removed
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
        toast.error(`Không thể tải thống kê: ${error.message}`); // Changed to toast
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
        toast.error(`Không thể tải thống kê giao dịch nhân viên: ${error.message}`); // Changed to toast
      }
    });
  };

  const backupAllData = async () => {
    setIsBackingUp(true);
    // setMessage({ type: '', text: '' }); // Removed
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
        toast.success("Sao lưu toàn bộ dữ liệu thành công."); // Changed to toast
      } catch (error: any) {
        toast.error(`Không thể sao lưu dữ liệu: ${error.message || 'Lỗi không xác định'}`); // Changed to toast
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
          <CardTitle>Thống kê số lượng bản ghi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statistics.length > 0 ? (
            statistics.map((stat) => (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                  <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <p className="text-xs text-muted-foreground">bản ghi</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p>Không có dữ liệu thống kê.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Thống kê giao dịch theo nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên nhân viên</TableHead>
                <TableHead className="text-right">Số lượng giao dịch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffTransactionStats.length > 0 ? (
                staffTransactionStats.map((stat) => (
                  <TableRow key={stat.name}>
                    <TableCell className="font-medium">{stat.name}</TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Không có dữ liệu thống kê.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};