import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Play, Settings, AlertTriangle, CheckCircle, XCircle, TestTube, Database } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface CleanupResult {
  table: string;
  success: boolean;
  deleted_count: number;
  error?: string;
  message?: string;
  retention_days?: number;
  cutoff_date?: string;
}

interface CleanupResponse {
  success: boolean;
  message: string;
  total_deleted: number;
  policies_processed: number;
  results: CleanupResult[];
}

export function CleanupTestPanel() {
  const queryClient = useQueryClient();
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [isSettingUpPolicies, setIsSettingUpPolicies] = useState(false);
  const [isResettingPolicies, setIsResettingPolicies] = useState(false);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);
  const [isRunningTestCleanup, setIsRunningTestCleanup] = useState(false);
  const [isCleaningTestData, setIsCleaningTestData] = useState(false);
  const [testDaysOld, setTestDaysOld] = useState('7');
  const [cleanupResults, setCleanupResults] = useState<CleanupResponse | null>(null);
  const [setupResults, setSetupResults] = useState<any>(null);

  // Tạo dữ liệu test cũ
  const createTestData = async () => {
    setIsCreatingTestData(true);
    
    try {
      const daysOld = parseInt(testDaysOld);
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - daysOld);
      const oldDateISO = oldDate.toISOString();

      // Tạo test data cho các bảng chính
      const testTables = [
        'notifications',
        'system_metrics', 
        'system_alerts',
        'security_events',
        'sent_asset_reminders'
      ];

      let totalCreated = 0;

      for (const tableName of testTables) {
        try {
          let testData: any[] = [];

          switch (tableName) {
            case 'notifications':
              testData = Array.from({ length: 5 }, (_, i) => ({
                recipient_username: 'test_user',
                title: `Test Notification ${i + 1}`,
                message: `This is a test notification created for cleanup testing`,
                notification_type: 'test',
                created_at: oldDateISO
              }));
              break;

            case 'system_metrics':
              testData = Array.from({ length: 5 }, (_, i) => ({
                metric_type: 'test',
                metric_name: `test_metric_${i + 1}`,
                metric_value: Math.random() * 100,
                metric_unit: 'count',
                created_at: oldDateISO
              }));
              break;

            case 'system_alerts':
              testData = Array.from({ length: 3 }, (_, i) => ({
                alert_id: `test_alert_${Date.now()}_${i}`,
                rule_id: 'test_rule',
                rule_name: 'Test Alert Rule',
                metric: 'test_metric',
                current_value: 50,
                threshold: 100,
                severity: 'low',
                message: `Test alert ${i + 1} for cleanup testing`,
                created_at: oldDateISO
              }));
              break;

            case 'security_events':
              testData = Array.from({ length: 3 }, (_, i) => ({
                event_type: 'test_event',
                username: 'test_user',
                event_data: { test: true, index: i + 1 },
                user_agent: 'Test Agent',
                ip_address: '127.0.0.1',
                created_at: oldDateISO
              }));
              break;

            case 'sent_asset_reminders':
              testData = Array.from({ length: 3 }, (_, i) => ({
                ten_ts: `Test Asset ${i + 1}`,
                ngay_den_han: '2024-01-01',
                cbqln: 'Test CBQLN',
                cbkh: 'Test CBKH',
                is_sent: true,
                sent_date: oldDate.toISOString().split('T')[0],
                created_at: oldDateISO
              }));
              break;
          }

          if (testData.length > 0) {
            const { data, error } = await supabase
              .from(tableName)
              .insert(testData)
              .select('id');

            if (error) {
              console.error(`Error creating test data for ${tableName}:`, error);
            } else {
              totalCreated += data?.length || 0;
              console.log(`Created ${data?.length || 0} test records in ${tableName}`);
            }
          }
        } catch (error) {
          console.error(`Error processing ${tableName}:`, error);
        }
      }

      toast.success(`Đã tạo ${totalCreated} bản ghi test cũ ${daysOld} ngày!`);
      
      // Refresh table counts
      queryClient.invalidateQueries({ queryKey: ['logTableCounts'] });

    } catch (error: any) {
      console.error('Error creating test data:', error);
      toast.error(`Lỗi tạo dữ liệu test: ${error.message}`);
    } finally {
      setIsCreatingTestData(false);
    }
  };

  // Chạy cleanup với thời gian test ngắn
  const runTestCleanup = async () => {
    setIsRunningTestCleanup(true);
    setCleanupResults(null);
    
    try {
      // Tạm thời cập nhật policies với thời gian ngắn để test
      const testRetentionDays = parseInt(testDaysOld) - 1; // Ngắn hơn 1 ngày so với dữ liệu test
      
      const testTables = ['system_metrics', 'system_alerts', 'sent_asset_reminders'];
      
      // Cập nhật policies tạm thời
      for (const tableName of testTables) {
        await supabase.from('log_cleanup_policies').upsert({
          table_name: tableName,
          is_enabled: true,
          retention_days: testRetentionDays
        }, { onConflict: 'table_name' });
      }

      // Chạy cleanup
      const { data, error } = await supabase.functions.invoke('auto-cleanup-logs');
      
      if (error) {
        throw error;
      }
      
      setCleanupResults(data);
      
      if (data.success) {
        toast.success(`Test cleanup hoàn tất! Đã xóa ${data.total_deleted} bản ghi.`);
      } else {
        toast.error(`Test cleanup thất bại: ${data.message}`);
      }

      // Refresh table counts
      queryClient.invalidateQueries({ queryKey: ['logTableCounts'] });

    } catch (error: any) {
      console.error('Test cleanup error:', error);
      toast.error(`Lỗi khi chạy test cleanup: ${error.message}`);
    } finally {
      setIsRunningTestCleanup(false);
    }
  };

  const runCleanup = async () => {
    setIsRunningCleanup(true);
    setCleanupResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-cleanup-logs');
      
      if (error) {
        throw error;
      }
      
      setCleanupResults(data);
      
      if (data.success) {
        toast.success(`Dọn dẹp hoàn tất! Đã xóa ${data.total_deleted} bản ghi.`);
      } else {
        toast.error(`Dọn dẹp thất bại: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(`Lỗi khi chạy dọn dẹp: ${error.message}`);
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const setupPolicies = async () => {
    setIsSettingUpPolicies(true);
    setSetupResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('setup-cleanup-policies');
      
      if (error) {
        throw error;
      }
      
      setSetupResults(data);
      
      if (data.success) {
        toast.success(`Thiết lập hoàn tất! ${data.successful} policies đã được tạo.`);
      } else {
        toast.error(`Thiết lập thất bại: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(`Lỗi khi thiết lập policies: ${error.message}`);
    } finally {
      setIsSettingUpPolicies(false);
    }
  };

  const resetPolicies = async () => {
    setIsResettingPolicies(true);
    setSetupResults(null);
    
    try {
      // First delete all existing policies
      const { error: deleteError } = await supabase
        .from('log_cleanup_policies')
        .delete()
        .neq('table_name', ''); // Delete all records
      
      if (deleteError) {
        console.warn('Warning deleting existing policies:', deleteError);
      }
      
      // Then setup new policies
      const { data, error } = await supabase.functions.invoke('setup-cleanup-policies');
      
      if (error) {
        throw error;
      }
      
      setSetupResults(data);
      
      if (data.success) {
        toast.success(`Reset hoàn tất! ${data.successful} policies đã được tạo lại.`);
        // Refresh the policies in the parent component
        queryClient.invalidateQueries({ queryKey: ['logCleanupPolicies'] });
      } else {
        toast.error(`Reset thất bại: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      toast.error(`Lỗi khi reset policies: ${error.message}`);
    } finally {
      setIsResettingPolicies(false);
    }
  };

  // Xóa tất cả dữ liệu test
  const cleanTestData = async () => {
    setIsCleaningTestData(true);
    
    try {
      const testTables = [
        'notifications',
        'system_metrics', 
        'system_alerts',
        'security_events',
        'sent_asset_reminders'
      ];

      let totalDeleted = 0;

      for (const tableName of testTables) {
        try {
          let deleteCondition: any = {};

          switch (tableName) {
            case 'notifications':
              deleteCondition = { notification_type: 'test' };
              break;
            case 'system_metrics':
              deleteCondition = { metric_type: 'test' };
              break;
            case 'system_alerts':
              deleteCondition = { rule_id: 'test_rule' };
              break;
            case 'security_events':
              deleteCondition = { event_type: 'test_event' };
              break;
            case 'sent_asset_reminders':
              // Xóa những bản ghi có tên bắt đầu bằng "Test Asset"
              const { data: testReminders, error: fetchError } = await supabase
                .from(tableName)
                .select('id')
                .like('ten_ts', 'Test Asset%');
              
              if (!fetchError && testReminders && testReminders.length > 0) {
                const { data: deletedReminders, error: deleteError } = await supabase
                  .from(tableName)
                  .delete()
                  .in('id', testReminders.map(r => r.id))
                  .select('id');
                
                if (!deleteError) {
                  totalDeleted += deletedReminders?.length || 0;
                }
              }
              continue; // Skip the general delete below
          }

          const { data: deletedData, error } = await supabase
            .from(tableName)
            .delete()
            .match(deleteCondition)
            .select('id');

          if (error) {
            console.error(`Error deleting test data from ${tableName}:`, error);
          } else {
            totalDeleted += deletedData?.length || 0;
            console.log(`Deleted ${deletedData?.length || 0} test records from ${tableName}`);
          }
        } catch (error) {
          console.error(`Error processing ${tableName}:`, error);
        }
      }

      toast.success(`Đã xóa ${totalDeleted} bản ghi test!`);
      
      // Refresh table counts
      queryClient.invalidateQueries({ queryKey: ['logTableCounts'] });

    } catch (error: any) {
      console.error('Error cleaning test data:', error);
      toast.error(`Lỗi xóa dữ liệu test: ${error.message}`);
    } finally {
      setIsCleaningTestData(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kiểm tra chức năng tự động dọn dẹp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={setupPolicies} 
              disabled={isSettingUpPolicies}
              variant="outline"
            >
              {isSettingUpPolicies ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Thiết lập Policies mặc định
            </Button>
            
            <Button 
              onClick={resetPolicies} 
              disabled={isResettingPolicies}
              variant="outline"
              className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
            >
              {isResettingPolicies ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Reset tất cả Policies
            </Button>
            
            <Button 
              onClick={runCleanup} 
              disabled={isRunningCleanup}
            >
              {isRunningCleanup ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Chạy dọn dẹp thủ công
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Lưu ý:</strong> Chức năng này sẽ xóa vĩnh viễn dữ liệu cũ theo cấu hình thời gian lưu trữ. 
              Hãy đảm bảo bạn đã backup dữ liệu quan trọng trước khi chạy.
              <br />
              <strong>Reset Policies:</strong> Sẽ xóa tất cả cấu hình hiện tại và tạo lại với giá trị mặc định (bao gồm 15 ngày cho notifications).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <TestTube className="h-5 w-5" />
            Test Cleanup với dữ liệu giả lập
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tạo dữ liệu cũ:</label>
              <Select value={testDaysOld} onValueChange={setTestDaysOld}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ngày</SelectItem>
                  <SelectItem value="3">3 ngày</SelectItem>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="15">15 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={createTestData} 
              disabled={isCreatingTestData}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 border-green-300"
            >
              {isCreatingTestData ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Tạo dữ liệu test cũ {testDaysOld} ngày
            </Button>
            
            <Button 
              onClick={runTestCleanup} 
              disabled={isRunningTestCleanup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunningTestCleanup ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Chạy Test Cleanup
            </Button>

            <Button 
              onClick={cleanTestData} 
              disabled={isCleaningTestData}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 border-red-300"
            >
              {isCleaningTestData ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Xóa dữ liệu test
            </Button>
          </div>

          <Alert className="bg-blue-100 border-blue-300">
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              <strong>Cách test:</strong>
              <br />1. Chọn số ngày cũ (ví dụ: 7 ngày)
              <br />2. Nhấn "Tạo dữ liệu test cũ" để tạo dữ liệu với ngày tạo 7 ngày trước
              <br />3. Nhấn "Chạy Test Cleanup" - hệ thống sẽ tạm thời đặt retention = 6 ngày để xóa dữ liệu 7 ngày
              <br />4. Xem kết quả - bây giờ sẽ có dữ liệu bị xóa thực tế!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {setupResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {setupResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Kết quả thiết lập Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Tổng số policies:</strong> {setupResults.total_policies}</p>
              <p><strong>Thành công:</strong> {setupResults.successful}</p>
              <p><strong>Thất bại:</strong> {setupResults.failed}</p>
              
              {setupResults.results && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Chi tiết:</h4>
                  <div className="space-y-1">
                    {setupResults.results.map((result: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{result.table}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.action}
                          </Badge>
                          {result.retention_days && (
                            <span className="text-sm text-gray-600">
                              {result.retention_days} ngày
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {cleanupResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {cleanupResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Kết quả dọn dẹp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Tổng số bản ghi đã xóa:</strong> {cleanupResults.total_deleted}</p>
              <p><strong>Số policies đã xử lý:</strong> {cleanupResults.policies_processed}</p>
              <p><strong>Thông báo:</strong> {cleanupResults.message}</p>
              
              {cleanupResults.results && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Chi tiết theo bảng:</h4>
                  <div className="space-y-2">
                    {cleanupResults.results.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.table}</span>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "Thành công" : "Thất bại"}
                          </Badge>
                        </div>
                        
                        {result.success ? (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Đã xóa: <strong className={result.deleted_count > 0 ? "text-red-600" : ""}>{result.deleted_count}</strong> bản ghi</p>
                            {result.retention_days && (
                              <p>Thời gian lưu trữ: {result.retention_days} ngày</p>
                            )}
                            {result.cutoff_date && (
                              <p>Ngày cắt: {new Date(result.cutoff_date).toLocaleDateString('vi-VN')}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            <p>Lỗi: {result.error}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}