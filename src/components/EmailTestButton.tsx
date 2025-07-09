import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const EmailTestButton = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ type: string; message: string } | null>(null);

  const testDirectEmail = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      console.log('🧪 Direct email test starting...');

      // Step 1: Check if admin exists and get email
      console.log('🔍 Step 1: Checking for admin user...');
      const { data: adminData, error: adminError } = await supabase
        .from('staff')
        .select('username, email, staff_name, role')
        .eq('role', 'admin')
        .limit(1);

      console.log('📧 Admin query result:', { adminData, adminError });

      if (adminError) {
        throw new Error(`Database error: ${adminError.message}`);
      }

      if (!adminData || adminData.length === 0) {
        // Try to create admin user
        console.log('⚠️ No admin found, attempting to create one...');
        
        const { data: createResult, error: createError } = await supabase
          .from('staff')
          .insert({
            username: 'admin',
            password: '$2b$10$rQJ5K8qF7mXJ9X8qF7mXJOeKqF7mXJ9X8qF7mXJOeKqF7mXJ9X8qF7', // Default hashed password
            staff_name: 'System Administrator',
            role: 'admin',
            email: 'admin@company.com',
            account_status: 'active'
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Cannot create admin user: ${createError.message}`);
        }

        console.log('✅ Admin user created:', createResult);
        setResult({
          type: 'warning',
          message: '⚠️ Đã tạo tài khoản admin mới với email: admin@company.com. Vui lòng cập nhật email admin trong cài đặt.'
        });
        return;
      }

      const adminUser = adminData[0];
      console.log('✅ Admin user found:', adminUser);

      if (!adminUser.email) {
        throw new Error('Admin user exists but email is not configured');
      }

      // Step 2: Test email sending
      console.log('📧 Step 2: Sending test email to:', adminUser.email);
      
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'test',
          to: adminUser.email,
          subject: '🧪 Direct Email Test - Hệ thống Quản lý Tài sản',
          data: {
            username: adminUser.username,
            testType: 'direct-test',
            timestamp: new Date().toISOString(),
            adminInfo: {
              name: adminUser.staff_name,
              email: adminUser.email
            }
          }
        }
      });

      console.log('📧 Email function result:', { emailResult, emailError });

      if (emailError) {
        throw new Error(`Email function error: ${emailError.message}`);
      }

      if (emailResult?.success) {
        setResult({
          type: 'success',
          message: `✅ Test email thành công! Email đã được gửi đến: ${adminUser.email}`
        });
      } else {
        throw new Error(`Email sending failed: ${emailResult?.error || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('❌ Direct email test failed:', error);
      setResult({
        type: 'error',
        message: `❌ Test thất bại: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Test Email Trực tiếp</h4>
          <p className="text-sm text-gray-600">Gửi email test ngay lập tức</p>
        </div>
        <Button 
          onClick={testDirectEmail}
          disabled={isTesting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isTesting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang test...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Test Ngay
            </>
          )}
        </Button>
      </div>

      {result && (
        <Alert variant={result.type === 'error' ? 'destructive' : 'default'} 
               className={
                 result.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
                 result.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : ''
               }>
          {result.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <h5 className="font-semibold text-purple-800 text-sm mb-1">🔧 Test này sẽ:</h5>
        <ul className="text-xs text-purple-700 space-y-1">
          <li>• Kiểm tra admin user trong database</li>
          <li>• Tạo admin user nếu chưa có</li>
          <li>• Gửi email test trực tiếp qua Edge Function</li>
          <li>• Hiển thị kết quả chi tiết</li>
        </ul>
      </div>
    </div>
  );
};