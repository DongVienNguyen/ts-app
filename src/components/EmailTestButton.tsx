import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const EmailTestButton = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ type: string; message: string } | null>(null);

  const testEmailDirect = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      console.log('🧪 Direct email test starting...');

      // Test 1: Check admin email
      const { data: adminData, error: adminError } = await supabase
        .from('staff')
        .select('email, staff_name, username')
        .eq('role', 'admin')
        .limit(1);

      console.log('📧 Admin data:', adminData);

      if (adminError || !adminData || adminData.length === 0) {
        setResult({ 
          type: 'error', 
          message: `Không tìm thấy admin: ${adminError?.message || 'No admin found'}` 
        });
        return;
      }

      if (!adminData[0].email) {
        setResult({ 
          type: 'error', 
          message: 'Email admin chưa được cấu hình. Vui lòng cập nhật email trong cài đặt.' 
        });
        return;
      }

      // Test 2: Call edge function directly
      console.log('📧 Calling edge function directly...');
      
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'test',
          to: adminData[0].email,
          subject: '🧪 Direct Email Test - Hệ thống Quản lý Tài sản',
          data: {
            username: adminData[0].username,
            testType: 'direct',
            timestamp: new Date().toISOString()
          }
        }
      });

      console.log('📧 Edge function response:', { data, error });

      if (error) {
        setResult({ 
          type: 'error', 
          message: `Lỗi gửi email: ${error.message}` 
        });
        return;
      }

      setResult({ 
        type: 'success', 
        message: `✅ Email test thành công! Đã gửi đến: ${adminData[0].email}` 
      });

    } catch (error: any) {
      console.error('❌ Direct email test error:', error);
      setResult({ 
        type: 'error', 
        message: `Lỗi hệ thống: ${error.message}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={testEmailDirect}
        disabled={isTesting}
        className="bg-purple-600 hover:bg-purple-700"
      >
        <TestTube className="w-4 h-4 mr-2" />
        {isTesting ? 'Đang test...' : 'Test Email Trực tiếp'}
      </Button>

      {result && (
        <Alert variant={result.type === 'error' ? 'destructive' : 'default'} 
               className={result.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}>
          {result.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Test này sẽ:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Kiểm tra cấu hình email admin</li>
          <li>Gọi trực tiếp Edge Function</li>
          <li>Gửi email test qua Resend API</li>
          <li>Hiển thị log chi tiết trong Console</li>
        </ul>
      </div>
    </div>
  );
};