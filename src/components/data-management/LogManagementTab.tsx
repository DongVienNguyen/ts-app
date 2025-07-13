import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Trash2, Eye, Database, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TableName } from '@/config/entityConfig';
import { CleanupTestPanel } from './CleanupTestPanel';

const LOG_TABLES: TableName[] = [
  'crc_reminders', 'notifications', 'push_subscriptions', 'security_events',
  'sent_asset_reminders', 'sent_crc_reminders', 'system_alerts', 'system_errors',
  'system_metrics', 'system_status', 'user_sessions'
];

const RETENTION_OPTIONS = [
  { label: '15 ngày', value: 15 },
  { label: '30 ngày', value: 30 },
  { label: '90 ngày', value: 90 },
  { label: '1 năm', value: 365 },
];

interface LogPolicy {
  table_name: string;
  is_enabled: boolean;
  retention_days: number;
}

interface TableStats {
  name: TableName;
  count: number | null;
  policy: LogPolicy | null;
}

interface LogManagementTabProps {
  onNavigateToTable: (table: TableName) => void;
}

// Fetch functions
const fetchTableCounts = async (tables: TableName[]) => {
  const promises = tables.map(table =>
    supabase.from(table).select('*', { count: 'exact', head: true })
  );
  const results = await Promise.all(promises);
  const counts: Record<string, number> = {};
  results.forEach((res, index) => {
    if (res.error) console.error(`Error fetching count for ${tables[index]}:`, res.error);
    counts[tables[index]] = res.count ?? 0;
  });
  return counts;
};

const fetchLogPolicies = async () => {
  const { data, error } = await supabase.from('log_cleanup_policies').select('*');
  if (error) throw error;
  return data as LogPolicy[];
};

export function LogManagementTab({ onNavigateToTable }: LogManagementTabProps) {
  const queryClient = useQueryClient();

  const { data: counts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['logTableCounts'],
    queryFn: () => fetchTableCounts(LOG_TABLES),
  });

  const { data: policies, isLoading: isLoadingPolicies } = useQuery({
    queryKey: ['logCleanupPolicies'],
    queryFn: fetchLogPolicies,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (policy: Partial<LogPolicy> & { table_name: string }) => {
      const { error } = await supabase.from('log_cleanup_policies').upsert(policy);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật chính sách dọn dẹp.');
      queryClient.invalidateQueries({ queryKey: ['logCleanupPolicies'] });
    },
    onError: (error: any) => toast.error(`Lỗi cập nhật chính sách: ${error.message}`),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (tableName: TableName) => {
      const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Placeholder to delete all
      if (error) throw error;
    },
    onSuccess: (_, tableName) => {
      toast.success(`Đã xóa tất cả bản ghi trong bảng ${tableName}.`);
      queryClient.invalidateQueries({ queryKey: ['logTableCounts'] });
    },
    onError: (error: any, tableName) => toast.error(`Lỗi khi xóa bảng ${tableName}: ${error.message}`),
  });

  const tableStats: TableStats[] = LOG_TABLES.map(name => ({
    name,
    count: counts ? counts[name] : null,
    policy: policies?.find(p => p.table_name === name) || null,
  }));

  const isLoading = isLoadingCounts || isLoadingPolicies;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Dữ liệu Logs</CardTitle>
          <CardDescription>
            Cấu hình chính sách tự động dọn dẹp và quản lý các bảng ghi log của hệ thống.
            Chức năng tự động xóa sẽ được thực thi hàng ngày bởi một tác vụ nền.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="ml-4 text-gray-600">Đang tải thông tin các bảng...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tableStats.map(({ name, count, policy }) => (
                <Card key={name} className="flex flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="h-5 w-5 text-gray-600" />
                      {name}
                    </CardTitle>
                    <CardDescription>
                      Tổng số bản ghi: {typeof count === 'number' ? count.toLocaleString('vi-VN') : <Loader2 className="h-4 w-4 animate-spin inline-block" />}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <label htmlFor={`switch-${name}`} className="font-medium text-sm">Tự động xóa</label>
                      <Switch
                        id={`switch-${name}`}
                        checked={policy?.is_enabled ?? false}
                        onCheckedChange={(checked) => {
                          updatePolicyMutation.mutate({ table_name: name, is_enabled: checked, retention_days: policy?.retention_days ?? 30 });
                        }}
                        disabled={updatePolicyMutation.isPending}
                      />
                    </div>
                    <Select
                      value={String(policy?.retention_days ?? 30)}
                      onValueChange={(value) => {
                        updatePolicyMutation.mutate({ table_name: name, is_enabled: policy?.is_enabled ?? false, retention_days: Number(value) });
                      }}
                      disabled={!(policy?.is_enabled ?? false) || updatePolicyMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Thời gian lưu trữ" />
                      </SelectTrigger>
                      <SelectContent>
                        {RETENTION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                  <div className="p-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onNavigateToTable(name)}>
                      <Eye className="h-4 w-4 mr-2" /> Xem dữ liệu
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-2" /> Xóa tất cả
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Bạn có chắc chắn?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này sẽ xóa vĩnh viễn TẤT CẢ bản ghi trong bảng <strong>{name}</strong>. Thao tác này không thể hoàn tác.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAllMutation.mutate(name)} className="bg-red-600 hover:bg-red-700">
                            Tôi hiểu, Xóa tất cả
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add the cleanup test panel */}
      <CleanupTestPanel />
    </div>
  );
}