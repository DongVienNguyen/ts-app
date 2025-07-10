import { useState } from 'react';
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

      let adminEmail = '';
      let adminUser = null;

      const { data: existingAdmin, error: queryError } = await supabase
        .from('staff')
        .select('email, staff_name, username, id')
        .eq('role', 'admin')
        .limit(1);

      console.log('📧 Existing admin query:', { existingAdmin, queryError });

      if (queryError) {
        throw new Error(`Database query error: ${queryError.message}`);
      }

      if (existingAdmin && existingAdmin.length > 0) {
        adminUser = existingAdmin[0];
        adminEmail = adminUser.email;
        console.log('✅ Found existing admin:', adminUser.username);
      }

      if (!adminUser || !adminEmail) {
        console.log('🔧 Creating/updating admin with email...');
        
        if (!adminUser) {
          const { data: newAdmin, error: createError } = await supabase
            .from('staff')
            .insert({
              username: 'admin',
              password: 'admin123',
              staff_name: 'System Administrator',
              role: 'admin',
              email: 'admin@company.com',
              account_status: 'active',
              department: 'IT'
            })
            .select('email, staff_name, username, id')
            .single();

          if (createError) {
            console.error('❌ Create admin error:', createError);
            throw new Error(`Cannot create admin: ${createError.message}`);
          }

          adminUser = newAdmin;
          adminEmail = newAdmin.email;
          console.log('✅ Created new admin:', newAdmin);
          
        } else if (!adminEmail) {
          const { data: updatedAdmin, error: updateError } = await supabase
            .from('staff')
            .update({ email: 'admin@company.com' })
            .eq('id', adminUser.id)
            .select('email, staff_name, username, id')
            .single();

          if (updateError) {
            console.error('❌ Update admin error:', updateError);
            throw new Error(`Cannot update admin email: ${updateError.message}`);
          }

          adminUser = updatedAdmin;
          adminEmail = updatedAdmin.email;
          console.log('✅ Updated admin email:', updatedAdmin);
        }
      }

      if (!adminEmail) {
        throw new Error('Admin email vẫn chưa được cấu hình sau khi tạo/cập nhật');
      }

      console.log('📧 Sending test email to:', adminEmail);

      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'test',
          to: adminEmail,
          subject: '🧪 Direct Email Test - Hệ thống Quản lý Tài sản',
          data: {
            username: 'direct-test-user',
            testType: 'direct-email-test',
            timestamp: new Date().toISOString(),
            adminInfo: {
              name: adminUser.staff_name,
              username: adminUser.username,
              id: adminUser.id
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
          text: `✅ Email test thành công! Email đã được gửi đến: ${adminEmail}`
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
          <p className="text-sm text-gray-600">Gửi email test ngay lập tức (tự động tạo admin nếu cần)</p>
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
          <li>• Tìm admin trong database</li>
          <li>• Tạo admin mới nếu không tồn tại</li>
          <li>• Cập nhật email admin nếu thiếu</li>
          <li>• Gửi email test qua Edge Function</li>
          <li>• Hiển thị kết quả chi tiết</li>
        </ul>
      </div>
    </div>
  );
};