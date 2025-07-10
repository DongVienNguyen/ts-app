import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Trash2, 
  Database, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogStats {
  security_events: number;
  system_errors: number;
  system_metrics: number;
  user_sessions: number;
  notifications: number;
  asset_transactions: number;
  total: number;
}

export const LogManagementTab = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<LogStats>({
    security_events: 0,
    system_errors: 0,
    system_metrics: 0,
    user_sessions: 0,
    notifications: 0,
    asset_transactions: 0,
    total: 0
  });
  const [retentionPeriod, setRetentionPeriod] = useState<'90' | '365'>('90');

  useEffect(() => {
    loadLogStats();
  }, []);

  const loadLogStats = async () => {
    try {
      setLoading(true);
      
      // Get counts from each table
      const tables = [
        'security_events',
        'system_errors', 
        'system_metrics',
        'user_sessions',
        'notifications',
        'asset_transactions'
      ];

      const counts: any = {};
      let total = 0;

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.warn(`Error counting ${table}:`, error);
            counts[table] = 0;
          } else {
            counts[table] = count || 0;
            total += count || 0;
          }
        } catch (err) {
          console.warn(`Error accessing ${table}:`, err);
          counts[table] = 0;
        }
      }

      setStats({
        ...counts,
        total
      });
    } catch (error) {
      console.error('Error loading log stats:', error);
      toast.error('Lỗi khi tải thống kê logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllLogs = async () => {
    if (!confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ logs? Hành động này không thể hoàn tác!')) {
      return;
    }

    if (!confirm('Xác nhận lần cuối: Xóa tất cả logs sẽ mất toàn bộ lịch sử theo dõi. Tiếp tục?')) {
      return;
    }

    try {
      setLoading(true);
      
      const tables = [
        'security_events',
        'system_errors',
        'system_metrics', 
        'user_sessions',
        'sent_asset_reminders',
        'sent_crc_reminders'
      ];

      let deletedCount = 0;
      const errors: string[] = [];

      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
          
          if (error) {
            errors.push(`${table}: ${error.message}`);
          } else {
            deletedCount++;
          }
        } catch (err) {
          errors.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        console.error('Errors during deletion:', errors);
        toast.error(`Xóa hoàn tất với một số lỗi. Đã xóa ${deletedCount}/${tables.length} bảng.`);
      } else {
        toast.success(`✅ Đã xóa thành công tất cả logs từ ${deletedCount} bảng!`);
      }

      // Reload stats
      await loadLogStats();
    } catch (error) {
      console.error('Error deleting all logs:', error);
      toast.error('Lỗi khi xóa logs');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOldLogs = async () => {
    const days = parseInt(retentionPeriod);
    const periodText = days === 90 ? '90 ngày' : '1 năm';
    
    if (!confirm(`Xóa tất cả logs cũ hơn ${periodText}? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      setLoading(true);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISO = cutoffDate.toISOString();

      const tables = [
        { name: 'security_events', dateField: 'created_at' },
        { name: 'system_errors', dateField: 'created_at' },
        { name: 'system_metrics', dateField: 'created_at' },
        { name: 'user_sessions', dateField: 'created_at' },
        { name: 'sent_asset_reminders', dateField: 'created_at' },
        { name: 'sent_crc_reminders', dateField: 'created_at' }
      ];

      let totalDeleted = 0;
      const errors: string[] = [];

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table.name)
            .delete()
            .lt(table.dateField, cutoffISO);
          
          if (error) {
            errors.push(`${table.name}: ${error.message}`);
          } else {
            totalDeleted += count || 0;
          }
        } catch (err) {
          errors.push(`${table.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        console.error('Errors during cleanup:', errors);
        toast.error(`Dọn dẹp hoàn tất với một số lỗi. Đã xóa ${totalDeleted} bản ghi.`);
      } else {
        toast.success(`✅ Đã xóa ${totalDeleted} bản ghi logs cũ hơn ${periodText}!`);
      }

      // Reload stats
      await loadLogStats();
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      toast.error('Lỗi khi dọn dẹp logs cũ');
    } finally {
      setLoading(false);
    }
  };

  const logCategories = [
    {
      name: 'Sự kiện bảo mật',
      key: 'security_events',
      count: stats.security_events,
      icon: Shield,
      color: 'bg-red-500',
      description: 'Đăng nhập, đăng xuất, cảnh báo bảo mật'
    },
    {
      name: 'Lỗi hệ thống',
      key: 'system_errors', 
      count: stats.system_errors,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      description: 'Lỗi ứng dụng, exception, crash logs'
    },
    {
      name: 'Metrics hệ thống',
      key: 'system_metrics',
      count: stats.system_metrics,
      icon: BarChart3,
      color: 'bg-blue-500',
      description: 'Hiệu suất, tài nguyên, thống kê'
    },
    {
      name: 'Phiên người dùng',
      key: 'user_sessions',
      count: stats.user_sessions,
      icon: Users,
      color: 'bg-green-500',
      description: 'Lịch sử đăng nhập, thời gian sử dụng'
    },
    {
      name: 'Thông báo',
      key: 'notifications',
      count: stats.notifications,
      icon: Activity,
      color: 'bg-purple-500',
      description: 'Thông báo đã gửi, trạng thái đọc'
    },
    {
      name: 'Giao dịch tài sản',
      key: 'asset_transactions',
      count: stats.asset_transactions,
      icon: Database,
      color: 'bg-indigo-500',
      description: 'Lịch sử mượn/trả tài sản'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Logs</h2>
          <p className="text-gray-600">Quản lý và dọn dẹp logs hệ thống</p>
        </div>
        <Button 
          onClick={loadLogStats}
          disabled={loading}
          variant="outline"
        >
          Làm mới
        </Button>
      </div>

      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cảnh báo:</strong> Việc xóa logs sẽ mất vĩnh viễn dữ liệu theo dõi. 
          Hãy cân nhắc kỹ trước khi thực hiện.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {logCategories.map((category) => (
          <Card key={category.key} className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{category.name}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {category.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
                <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Database className="w-6 h-6" />
            <span>Tổng quan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900 mb-2">
            {stats.total.toLocaleString()} bản ghi
          </div>
          <p className="text-blue-700">
            Tổng số logs trong hệ thống
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cleanup Old Logs */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Calendar className="w-5 h-5" />
              <span>Dọn dẹp Logs cũ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Xóa logs cũ để tiết kiệm dung lượng và cải thiện hiệu suất
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Thời gian lưu trữ:
              </label>
              <Select value={retentionPeriod} onValueChange={(value: '90' | '365') => setRetentionPeriod(value)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="90">90 ngày gần nhất</SelectItem>
                  <SelectItem value="365">1 năm gần nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCleanupOldLogs}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Dọn dẹp logs cũ hơn {retentionPeriod === '90' ? '90 ngày' : '1 năm'}
            </Button>
          </CardContent>
        </Card>

        {/* Delete All Logs */}
        <Card className="bg-white border border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-900">
              <Trash2 className="w-5 h-5" />
              <span>Xóa tất cả Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-red-700 font-medium">
                ⚠️ Hành động nguy hiểm
              </p>
              <p className="text-gray-600">
                Xóa toàn bộ logs trong hệ thống. Hành động này không thể hoàn tác.
              </p>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sẽ xóa tất cả: Security events, System errors, Metrics, User sessions, 
                Sent reminders và các logs khác.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleDeleteAllLogs}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa tất cả Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang xử lý...</span>
        </div>
      )}
    </div>
  );
};