import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const EmailTestButton = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ type: string; message: string } | null>(null);

  const testDirectEmail = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      console.log('🧪 Direct email test starting...');

      // Step 1: Check if admin exists and get/create admin email
      console.log('📧 Checking admin user...');
      let { data: adminData, error: adminError } = await supabase
        .from('staff')
        .select('username, email, staff_name, role')
        .eq('role', 'admin')
        .limit(1);

      console.log('📧 Admin data:', adminData);

      if (adminError) {
        console.error('❌ Admin query error:', adminError);
        throw new Error(`Lỗi truy vấn admin: ${adminError.message}`);
      }

      // If no admin found, create one
      if (!adminData || adminData.length === 0) {
        console.log('🔧 No admin found, creating admin user...');
        
        const { data: newAdmin, error: createError } = await supabase
          .from('staff')
          .insert({
            username: 'admin',
            password: '$2b$10$rQZ9QmZ9QmZ9QmZ9QmZ9Qu', // Default hashed password
            staff_name: 'System Administrator',
            role: 'admin',
            email: 'admin@caremylife.me',
            account_status: 'active'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating admin:', createError);
          throw new Error(`Không thể tạo admin: ${createError.message}`);
        }

        adminData = [newAdmin];
        console.log('✅ Admin user created:', newAdmin);
      }

      const admin = adminData[0];
      let adminEmail = admin.email;

      // If admin doesn't have email, set default
      if (!adminEmail) {
        console.log('📧 Admin has no email, setting default...');
        adminEmail = 'admin@caremylife.me';
        
        const { error: updateError } = await supabase
          .from('staff')
          .update({ email: adminEmail })
          .eq('username', admin.username);

        if (updateError) {
          console.error('❌ Error updating admin email:', updateError);
          // Continue anyway with default email
        } else {
          console.log('✅ Admin email updated to:', adminEmail);
        }
      }

      console.log('📧 Using admin email:', adminEmail);

      // Step 2: Test email sending
      console.log('📧 Sending test email...');
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'test',
          to: adminEmail,
          subject: '🧪 Direct Email Test - Hệ thống Quản lý Tài sản',
          data: {
            testType: 'direct-test',
            adminUser: admin.username,
            timestamp: new Date().toISOString(),
            testId: Math.random().toString(36).substr(2, 9)
          }
        }
      });

      console.log('📧 Email result:', emailResult);

      if (emailError) {
        console.error('❌ Email sending error:', emailError);
        throw new Error(`Lỗi gửi email: ${emailError.message}`);
      }

      if (emailResult?.success) {
        setResult({
          type: 'success',
          message: `✅ Email test thành công! Email đã được gửi đến: ${adminEmail}`
        });
      } else {
        throw new Error('Email function không trả về success');
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
          <h4 className="font-medium">Test email trực tiếp</h4>
          <p className="text-sm text-gray-600">Gửi email test ngay lập tức</p>
        </div>
        <Button 
          onClick={testDirectEmail}
          disabled={isTesting}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <TestTube className="w-4 h-4 mr-2" />
          {isTesting ? 'Đang test...' : 'Test ngay'}
        </Button>
      </div>

      {result && (
        <Alert variant={result.type === 'error' ? 'destructive' : 'default'} 
               className={result.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}>
          {result.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <h5 className="font-semibold text-purple-800 text-sm mb-1">🔧 Test này sẽ:</h5>
        <ul className="text-xs text-purple-700 space-y-1">
          <li>• Kiểm tra/tạo admin user nếu chưa có</li>
          <li>• Thiết lập email admin mặc định</li>
          <li>• Gửi email test trực tiếp</li>
          <li>• Báo cáo kết quả chi tiết</li>
        </ul>
      </div>
    </div>
  );
};