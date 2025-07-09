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
      console.log('👤 Creating admin user...');

      // Check if admin already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('staff')
        .select('id, username, email')
        .eq('role', 'admin')
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (existingAdmin && existingAdmin.length > 0) {
        setMessage({
          type: 'warning',
          text: `⚠️ Admin đã tồn tại: ${existingAdmin[0].username} (${existingAdmin[0].email || 'chưa có email'})`
        });
        return;
      }

      // Create new admin user
      const { data: newAdmin, error: createError } = await supabase
        .from('staff')
        .insert({
          username: 'admin',
          password: '$2b$10$rQJ5K8qF7mXJ9X8qF7mXJOeKqF7mXJ9X8qF7mXJOeKqF7mXJ9X8qF7', // Default password: admin123
          staff_name: 'System Administrator',
          role: 'admin',
          email: 'admin@company.com',
          account_status: 'active',
          department: 'IT'
        })
        .select('id, username, email, staff_name')
        .single();

      if (createError) {
        throw createError;
      }

      console.log('✅ Admin user created:', newAdmin);
      setMessage({
        type: 'success',
        text: `✅ Đã tạo admin thành công! Username: admin, Password: admin123, Email: ${newAdmin.email}`
      });

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
            Tạo tài khoản admin mặc định nếu chưa có
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
      </div>
    </div>
  );
};