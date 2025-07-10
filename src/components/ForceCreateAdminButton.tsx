import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ForceCreateAdminButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const forceCreateAdmin = async () => {
    setIsCreating(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🔥 Force creating admin user via Edge Function...');

      console.log('🔧 Calling Edge Function to force create admin...');
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-admin-user', {
        body: {
          username: 'admin',
          password: 'admin123',
          staff_name: 'System Administrator',
          email: 'admin@company.com',
          department: 'IT'
        }
      });

      console.log('📧 Edge Function result:', { createResult, createError });

      if (createError) {
        console.error('❌ Edge Function error:', createError);
        throw new Error(`Edge Function error: ${createError.message}`);
      }

      if (!createResult?.success) {
        throw new Error(`Edge Function failed: ${createResult?.error || 'Unknown error'}`);
      }

      console.log('✅ Force created admin user via Edge Function:', createResult.data);
      setMessage({
        type: 'success',
        text: `🔥 Force tạo admin thành công! Username: admin, Password: admin123, Email: ${createResult.data.email}`
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error force creating admin:', error);
      setMessage({
        type: 'error',
        text: `❌ Lỗi force tạo admin: ${error.message}`
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-red-800">🔥 Force Tạo Admin</h3>
          <p className="text-sm text-red-600 mt-1">
            Xóa admin cũ và tạo mới (sử dụng Edge Function bypass RLS)
          </p>
        </div>
        <Button 
          onClick={forceCreateAdmin}
          disabled={isCreating}
          className="bg-red-600 hover:bg-red-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isCreating ? 'Đang tạo...' : 'Force Tạo'}
        </Button>
      </div>

      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
               className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-2">⚠️ Cảnh báo:</h4>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• Sẽ xóa admin hiện tại (nếu có)</li>
          <li>• Tạo admin mới với thông tin mặc định</li>
          <li>• Trang sẽ tự động reload sau khi tạo</li>
          <li>• Chỉ dùng khi có vấn đề với admin</li>
          <li>• <strong>Sử dụng Edge Function bypass RLS</strong></li>
        </ul>
      </div>
    </div>
  );
};