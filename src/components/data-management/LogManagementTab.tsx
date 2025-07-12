import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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
  BarChart3,
  RefreshCw,
  Settings,
  Clock,
  Server,
  Bell,
  Bug // Added Bug icon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { captureError } from '@/utils/errorTracking';

interface LogStats {
  security_events: number;
  system_errors: number;
  system_metrics: number;
  user_sessions: number;
  notifications: number;
  asset_transactions: number;
  sent_asset_reminders: number;
  sent_crc_reminders: number;
  system_status: number;
  system_alerts: number;
  total: number;
}

interface AutoCleanupSettings {
  [key: string]: {
    enabled: boolean;
    retentionDays: number;
  };
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
    sent_asset_reminders: 0,
    sent_crc_reminders: 0,
    system_status: 0,
    system_alerts: 0,
    total: 0
  });
  const [retentionPeriod, setRetentionPeriod] = useState<'90' | '365'>('90');
  const [processingTable, setProcessingTable] = useState<string | null>(null);
  const [autoCleanupSettings, setAutoCleanupSettings] = useState<AutoCleanupSettings>({});

  const [showLogViewer, setShowLogViewer] = useState(false);
  const [viewedLogs, setViewedLogs] = useState<any[]>([]);
  const [viewedLogTableName, setViewedLogTableName] = useState('');
  const [viewedLogDisplayName, setViewedLogDisplayName] = useState('');

  useEffect(() => {
    loadLogStats();
    loadAutoCleanupSettings();
  }, []);

  const loadAutoCleanupSettings = () => {
    try {
      const saved = localStorage.getItem('log_auto_cleanup_settings');
      if (saved) {
        setAutoCleanupSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading auto cleanup settings:', error);
    }
  };

  const saveAutoCleanupSettings = (settings: AutoCleanupSettings) => {
    try {
      localStorage.setItem('log_auto_cleanup_settings', JSON.stringify(settings));
      setAutoCleanupSettings(settings);
    } catch (error) {
      console.error('Error saving auto cleanup settings:', error);
      toast.error('Lỗi khi lưu cài đặt tự động dọn dẹp');
    }
  };

  const toggleAutoCleanup = (tableName: string, enabled: boolean) => {
    const newSettings = {
      ...autoCleanupSettings,
      [tableName]: {
        enabled,
        retentionDays: autoCleanupSettings[tableName]?.retentionDays || 90
      }
    };
    saveAutoCleanupSettings(newSettings);
    
    if (enabled) {
      toast.success(`Đã bật tự động dọn dẹp cho ${tableName}`);
    } else {
      toast.success(`Đã tắt tự động dọn dẹp cho ${tableName}`);
    }
  };

  const updateRetentionDays = (tableName: string, days: number) => {
    const newSettings = {
      ...autoCleanupSettings,
      [tableName]: {
        enabled: autoCleanupSettings[tableName]?.enabled || false,
        retentionDays: days
      }
    };
    saveAutoCleanupSettings(newSettings);
    toast.success(`Đã cập nhật thời gian lưu trữ cho ${tableName}: ${days} ngày`);
  };

  const loadLogStats = async () => {
    try {
      setLoading(true);
      
      const tables = [
        'security_events',
        'system_errors', 
        'system_metrics',
        'user_sessions',
        'notifications',
        'asset_transactions',
        'sent_asset_reminders',
        'sent_crc_reminders',
        'system_status',
        'system_alerts'
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
        'sent_crc_reminders',
        'system_status',
        'system_alerts'
      ];

      let deletedCount = 0;
      const errors: string[] = [];

      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
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
        { name: 'sent_crc_reminders', dateField: 'created_at' },
        { name: 'system_status', dateField: 'created_at' },
        { name: 'system_alerts', dateField: 'created_at' }
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

      await loadLogStats();
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      toast.error('Lỗi khi dọn dẹp logs cũ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecificLog = async (tableName: string, displayName: string) => {
    if (!confirm(`⚠️ Xóa tất cả logs "${displayName}"? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      setProcessingTable(tableName);
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error(`Error deleting ${tableName}:`, error);
        toast.error(`Lỗi khi xóa ${displayName}: ${error.message}`);
      } else {
        toast.success(`✅ Đã xóa thành công tất cả logs "${displayName}"!`);
        await loadLogStats();
      }
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      toast.error(`Lỗi khi xóa ${displayName}`);
    } finally {
      setProcessingTable(null);
    }
  };

  const handleCleanupSpecificLog = async (tableName: string, displayName: string, dateField: string) => {
    const days = parseInt(retentionPeriod);
    const periodText = days === 90 ? '90 ngày' : '1 năm';
    
    if (!confirm(`Dọn dẹp logs "${displayName}" cũ hơn ${periodText}?`)) {
      return;
    }

    try {
      setProcessingTable(tableName);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISO = cutoffDate.toISOString();

      const { count, error } = await supabase
        .from(tableName)
        .delete()
        .lt(dateField, cutoffISO);

      if (error) {
        console.error(`Error cleaning up ${tableName}:`, error);
        toast.error(`Lỗi khi dọn dẹp ${displayName}: ${error.message}`);
      } else {
        const deletedCount = count || 0;
        toast.success(`✅ Đã xóa ${deletedCount} bản ghi "${displayName}" cũ hơn ${periodText}!`);
        await loadLogStats();
      }
    } catch (error) {
      console.error(`Error cleaning up ${tableName}:`, error);
      toast.error(`Lỗi khi dọn dẹp ${displayName}`);
    } finally {
      setProcessingTable(null);
    }
  };

  const handleViewLogs = async (tableName: string, displayName: string, dateField: string) => {
    try {
      setProcessingTable(tableName);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(dateField, { ascending: false })
        .limit(50);

      if (error) {
        console.error(`Error fetching logs for ${tableName}:`, error);
        toast.error(`Lỗi khi tải logs cho ${displayName}: ${error.message}`);
      } else {
        setViewedLogs(data || []);
        setViewedLogTableName(tableName);
        setViewedLogDisplayName(displayName);
        setShowLogViewer(true);
      }
    } catch (error) {
      console.error(`Error viewing logs for ${tableName}:`, error);
      toast.error(`Lỗi khi xem logs cho ${displayName}`);
    } finally {
      setProcessingTable(null);
    }
  };

  const createTestError = async () => {
    toast.info("Đang tạo lỗi test...");
    try {
      await captureError(new Error("Đây là lỗi test được tạo thủ công để kiểm tra biểu đồ."), {
        functionName: 'createTestErrorButton',
        severity: 'medium',
        additionalData: { test: true, triggeredBy: 'admin' }
      });
      toast.success("Lỗi test đã được tạo và ghi lại thành công!");
      await loadLogStats();
    } catch (e) {
      toast.error("Không thể tạo lỗi test.");
      console.error(e);
    }
  };

  const logCategories = [
    {
      name: 'Sự kiện bảo mật',
      key: 'security_events',
      tableName: 'security_events',
      dateField: 'created_at',
      count: stats.security_events,
      icon: Shield,
      color: 'bg-red-500',
      description: 'Đăng nhập, đăng xuất, cảnh báo bảo mật'
    },
    {
      name: 'Lỗi hệ thống',
      key: 'system_errors',
      tableName: 'system_errors',
      dateField: 'created_at',
      count: stats.system_errors,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      description: 'Lỗi ứng dụng, exception, crash logs'
    },
    {
      name: 'Metrics hệ thống',
      key: 'system_metrics',
      tableName: 'system_metrics',
      dateField: 'created_at',
      count: stats.system_metrics,
      icon: BarChart3,
      color: 'bg-blue-500',
      description: 'Hiệu suất, tài nguyên, thống kê'
    },
    {
      name: 'Phiên người dùng',
      key: 'user_sessions',
      tableName: 'user_sessions',
      dateField: 'created_at',
      count: stats.user_sessions,
      icon: Users,
      color: 'bg-green-500',
      description: 'Lịch sử đăng nhập, thời gian sử dụng'
    },
    {
      name: 'Thông báo',
      key: 'notifications',
      tableName: 'notifications',
      dateField: 'created_at',
      count: stats.notifications,
      icon: Activity,
      color: 'bg-purple-500',
      description: 'Thông báo đã gửi, trạng thái đọc'
    },
    {
      name: 'Giao dịch tài sản',
      key: 'asset_transactions',
      tableName: 'asset_transactions',
      dateField: 'created_at',
      count: stats.asset_transactions,
      icon: Database,
      color: 'bg-indigo-500',
      description: 'Lịch sử mượn/trả tài sản'
    },
    {
      name: 'Nhắc tài sản đã gửi',
      key: 'sent_asset_reminders',
      tableName: 'sent_asset_reminders',
      dateField: 'created_at',
      count: stats.sent_asset_reminders,
      icon: Activity,
      color: 'bg-teal-500',
      description: 'Lịch sử gửi nhắc tài sản'
    },
    {
      name: 'Nhắc CRC đã gửi',
      key: 'sent_crc_reminders',
      tableName: 'sent_crc_reminders',
      dateField: 'created_at',
      count: stats.sent_crc_reminders,
      icon: Activity,
      color: 'bg-cyan-500',
      description: 'Lịch sử gửi nhắc CRC'
    },
    {
      name: 'Trạng thái hệ thống',
      key: 'system_status',
      tableName: 'system_status',
      dateField: 'created_at',
      count: stats.system_status,
      icon: Server,
      color: 'bg-pink-500',
      description: 'Trạng thái, thời gian phản hồi của các dịch vụ'
    },
    {
      name: 'Cảnh báo hệ thống',
      key: 'system_alerts',
      tableName: 'system_alerts',
      dateField: 'created_at',
      count: stats.system_alerts,
      icon: Bell,
      color: 'bg-yellow-500',
      description: 'Các cảnh báo được tạo bởi hệ thống giám sát'
    }
  ];

  return (
    <div className="space-y-6">
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
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cảnh báo:</strong> Việc xóa logs sẽ mất vĩnh viễn dữ liệu theo dõi. 
          Hãy cân nhắc kỹ trước khi thực hiện.
        </AlertDescription>
      </Alert>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Tự động dọn dẹp:</strong> Bật tính năng này để tự động xóa logs cũ theo lịch trình. 
          Cài đặt sẽ được lưu trong trình duyệt của bạn.
        </AlertDescription>
      </Alert>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Calendar className="w-5 h-5" />
            <span>Cài đặt thời gian lưu trữ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Thời gian lưu trữ logs:
            </label>
            <Select value={retentionPeriod} onValueChange={(value: '90' | '365') => setRetentionPeriod(value)}>
              <SelectTrigger className="w-48 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="90">90 ngày gần nhất</SelectItem>
                <SelectItem value="365">1 năm gần nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {logCategories.map((category) => {
          const settings = autoCleanupSettings[category.tableName] || { enabled: false, retentionDays: 90 };
          
          return (
            <Card key={category.key} className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                      <category.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-gray-900">{category.name}</span>
                      <p className="text-sm text-gray-500 font-normal">{category.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {category.count.toLocaleString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Tự động dọn dẹp</span>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(enabled) => toggleAutoCleanup(category.tableName, enabled)}
                    />
                  </div>
                  
                  {settings.enabled && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Lưu trữ:</span>
                      <Select 
                        value={settings.retentionDays.toString()} 
                        onValueChange={(value) => updateRetentionDays(category.tableName, parseInt(value))}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="30">30 ngày</SelectItem>
                          <SelectItem value="90">90 ngày</SelectItem>
                          <SelectItem value="180">180 ngày</SelectItem>
                          <SelectItem value="365">1 năm</SelectItem>
                        </SelectContent>
                      </Select>
                      {settings.enabled && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          Đã bật
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleViewLogs(category.tableName, category.name, category.dateField)}
                    disabled={processingTable === category.tableName || category.count === 0}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    {processingTable === category.tableName && (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    Xem Logs
                  </Button>
                  <Button
                    onClick={() => handleCleanupSpecificLog(category.tableName, category.name, category.dateField)}
                    disabled={processingTable === category.tableName || category.count === 0}
                    size="sm"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {processingTable === category.tableName && (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    Dọn dẹp cũ
                  </Button>
                  <Button
                    onClick={() => handleDeleteSpecificLog(category.tableName, category.name)}
                    disabled={processingTable === category.tableName || category.count === 0}
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    {processingTable === category.tableName && (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    )}
                    Xóa tất cả
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900">
            <Bug className="w-5 h-5 text-red-600" />
            <span>Tạo Lỗi Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Nhấn nút này để tạo một bản ghi lỗi hệ thống mới với thông tin trình duyệt hiện tại của bạn. 
            Điều này sẽ giúp kiểm tra các biểu đồ phân tích lỗi trên trang Giám sát Hệ thống.
          </p>
          <Button onClick={createTestError} variant="destructive" className="bg-red-600 hover:bg-red-700">
            <Bug className="w-4 h-4 mr-2" />
            Tạo Lỗi Test
          </Button>
        </CardContent>
      </Card>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Calendar className="w-5 h-5" />
              <span>Dọn dẹp tất cả Logs cũ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Xóa tất cả logs cũ hơn {retentionPeriod === '90' ? '90 ngày' : '1 năm'} từ tất cả các bảng
            </p>

            <Button
              onClick={handleCleanupOldLogs}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Dọn dẹp tất cả logs cũ hơn {retentionPeriod === '90' ? '90 ngày' : '1 năm'}
            </Button>
          </CardContent>
        </Card>

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
                ⚠️ Hành động cực kỳ nguy hiểm
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

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Đang xử lý...</span>
        </div>
      )}

      <Dialog open={showLogViewer} onOpenChange={setShowLogViewer}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Logs: {viewedLogDisplayName}</DialogTitle>
            <DialogDescription>
              Hiển thị 50 bản ghi log gần nhất từ bảng `{viewedLogTableName}`.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow p-4 border rounded-md bg-gray-50">
            {viewedLogs.length > 0 ? (
              <pre className="text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(viewedLogs, null, 2)}
              </pre>
            ) : (
              <p className="text-center text-gray-500">Không có logs nào để hiển thị.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};