import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ForceCreateAdminButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const forceCreateAdmin = async () => {
    setIsCreating(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🔥 Force creating admin user...');

      // First delete any existing admin
      const { error: deleteError } = await supabase
        .from('staff')
        .delete()
        .eq('username', 'admin');

      if (deleteError) {
        console.log('Delete error (might be normal):', deleteError);
      }

      // Create new admin user
      const { data: newAdmin, error: createError } = await supabase
        .from('staff')
        .insert({
          username: 'admin',
          password: 'admin123', // Use plain text, will be hashed by trigger
          staff_name: 'System Administrator',
          role: 'admin',
          email: 'admin@company.com',
          account_status: 'active',
          department: 'IT'
        })
        .select('id, username, email, staff_name, role')
        .single();

      if (createError) {
        throw createError;
      }

      console.log('✅ Force created admin user:', newAdmin);
      setMessage({
        type: 'success',
        text: `🔥 Force tạo admin thành công! Username: admin, Password: admin123, Email: ${newAdmin.email}`
      });

      // Reload page after 2 seconds
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
            Xóa admin cũ và tạo mới (chỉ dùng khi debug)
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
        </ul>
      </div>
    </div>
  );
};