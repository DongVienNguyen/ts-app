import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const CreateAdminButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const createAdminUser = async () => {
    setIsCreating(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('👤 Creating admin user via Edge Function...');

      // Check if admin already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('staff')
        .select('id, username, email')
        .eq('role', 'admin')
        .limit(1);

      if (checkError) {
        console.log('Check error (might be normal):', checkError.message);
      }

      if (existingAdmin && existingAdmin.length > 0) {
        setMessage({
          type: 'warning',
          text: `⚠️ Admin đã tồn tại: ${existingAdmin[0].username} (${existingAdmin[0].email || 'chưa có email'})`
        });
        return;
      }

      // Use Edge Function to create admin (bypasses RLS completely)
      console.log('🔧 Calling Edge Function to create admin...');
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

      console.log('✅ Admin user created via Edge Function:', createResult.data);
      setMessage({
        type: 'success',
        text: `✅ Đã tạo admin thành công! Username: admin, Password: admin123, Email: ${createResult.data.email}`
      });

      // Reload page after 2 seconds to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error creating admin:', error);
      setMessage({
        type: 'error',
        text: `❌ Lỗi tạo admin: ${error.message}`
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Tạo tài khoản Admin</h3>
          <p className="text-sm text-gray-600 mt-1">
            Tạo tài khoản admin mặc định nếu chưa có (sử dụng Edge Function)
          </p>
        </div>
        <Button 
          onClick={createAdminUser}
          disabled={isCreating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isCreating ? 'Đang tạo...' : 'Tạo Admin'}
        </Button>
      </div>

      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
               className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
                         message.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : ''}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-800 mb-2">👤 Thông tin Admin mặc định:</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• <strong>Username:</strong> admin</li>
          <li>• <strong>Password:</strong> admin123</li>
          <li>• <strong>Email:</strong> admin@company.com</li>
          <li>• <strong>Role:</strong> admin</li>
          <li>• <strong>Department:</strong> IT</li>
        </ul>
        <p className="text-xs text-purple-600 mt-2">
          ⚠️ Nhớ đổi password và email sau khi tạo!
        </p>
        <p className="text-xs text-green-600 mt-1">
          🔧 Sử dụng Edge Function để bypass RLS
        </p>
      </div>
    </div>
  );
};