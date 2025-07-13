import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Play, Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [isSettingUpPolicies, setIsSettingUpPolicies] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<CleanupResponse | null>(null);
  const [setupResults, setSetupResults] = useState<any>(null);

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
          <div className="flex gap-4">
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
                            <p>Đã xóa: {result.deleted_count} bản ghi</p>
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