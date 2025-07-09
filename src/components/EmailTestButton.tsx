import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const EmailTestButton = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const testDirectEmail = async () => {
    setIsTesting(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🧪 Direct email test starting...');

      // Step 1: Get or create admin user
      let { data: adminData, error: adminError } = await supabase
        .from('staff')
        .select('email, staff_name, username')
        .eq('role', 'admin')
        .limit(1);

      console.log('📧 Admin data:', adminData);

      if (adminError) {
        throw new Error(`Admin query error: ${adminError.message}`);
      }

      // If no admin exists, create one
      if (!adminData || adminData.length === 0) {
        console.log('⚠️ No admin found, creating default admin...');
        
        const { data: newAdmin, error: createError } = await supabase
          .from('staff')
          .insert({
            username: 'admin',
            password: '$2b$10$rQJ5K8qF7mXJ9X8qF7mXJOeKqF7mXJ9X8qF7mXJOeKqF7mXJ9X8qF7',
            staff_name: 'System Administrator',
            role: 'admin',
            email: 'admin@company.com',
            account_status: 'active'
          })
          .select('email, staff_name, username')
          .single();

        if (createError) {
          throw new Error(`Cannot create admin: ${createError.message}`);
        }

        adminData = [newAdmin];
        console.log('✅ Created new admin:', newAdmin);
      }

      const adminUser = adminData[0];
      if (!adminUser.email) {
        throw new Error('Admin email chưa được cấu hình. Vui lòng vào Data Management > Cài đặt Admin để cập nhật email.');
      }

      console.log('📧 Sending test email to:', adminUser.email);

      // Step 2: Send test email
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'test',
          to: adminUser.email,
          subject: '🧪 Direct Email Test - Hệ thống Quản lý Tài sản',
          data: {
            username: 'direct-test-user',
            testType: 'direct-email-test',
            timestamp: new Date().toISOString(),
            adminInfo: {
              name: adminUser.staff_name,
              username: adminUser.username
            }
          }
        }
      });

      console.log('📧 Email result:', { emailResult, emailError });

      if (emailError) {
        throw new Error(`Email sending failed: ${emailError.message}`);
      }

      if (emailResult?.success) {
        setMessage({
          type: 'success',
          text: `✅ Email test thành công! Email đã được gửi đến: ${adminUser.email}`
        });
      } else {
        throw new Error(`Email sending failed: ${emailResult?.error || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('❌ Direct email test failed:', error);
      setMessage({
        type: 'error',
        text: `❌ Test thất bại: ${error.message}`
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

      {message.type && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
               className={
                 message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
                 message.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : ''
               }>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
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