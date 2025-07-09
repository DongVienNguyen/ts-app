import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AdminChecker = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [adminStatus, setAdminStatus] = useState<{
    exists: boolean;
    hasEmail: boolean;
    data?: any;
    message: string;
  } | null>(null);

  const checkAdminStatus = async () => {
    setIsChecking(true);
    setAdminStatus(null);

    try {
      console.log('🔍 Checking admin status...');

      const { data: adminData, error: adminError } = await supabase
        .from('staff')
        .select('username, email, staff_name, role, account_status')
        .eq('role', 'admin');

      console.log('👤 Admin query result:', { adminData, adminError });

      if (adminError) {
        throw adminError;
      }

      if (!adminData || adminData.length === 0) {
        setAdminStatus({
          exists: false,
          hasEmail: false,
          message: 'Không tìm thấy tài khoản admin nào trong hệ thống'
        });
      } else {
        const admin = adminData[0];
        setAdminStatus({
          exists: true,
          hasEmail: !!admin.email,
          data: admin,
          message: admin.email 
            ? `Admin tồn tại với email: ${admin.email}`
            : 'Admin tồn tại nhưng chưa có email'
        });
      }
    } catch (error: any) {
      console.error('❌ Error checking admin:', error);
      setAdminStatus({
        exists: false,
        hasEmail: false,
        message: `Lỗi kiểm tra admin: ${error.message}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  const createAdmin = async () => {
    setIsChecking(true);
    try {
      console.log('🔧 Creating admin user...');

      const { data: newAdmin, error: createError } = await supabase
        .from('staff')
        .insert({
          username: 'admin',
          password: '$2b$10$rQZ9QmZ9QmZ9QmZ9QmZ9Qu',
          staff_name: 'System Administrator',
          role: 'admin',
          email: 'admin@caremylife.me',
          account_status: 'active'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      console.log('✅ Admin created:', newAdmin);
      setAdminStatus({
        exists: true,
        hasEmail: true,
        data: newAdmin,
        message: `Admin đã được tạo thành công với email: ${newAdmin.email}`
      });
    } catch (error: any) {
      console.error('❌ Error creating admin:', error);
      setAdminStatus({
        exists: false,
        hasEmail: false,
        message: `Lỗi tạo admin: ${error.message}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Kiểm tra Admin User</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Trạng thái tài khoản Admin</h3>
            <p className="text-sm text-gray-600 mt-1">
              Kiểm tra xem có tài khoản admin trong hệ thống không
            </p>
          </div>
          <Button 
            onClick={checkAdminStatus}
            disabled={isChecking}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <User className="w-4 h-4 mr-2" />
            {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra Admin'}
          </Button>
        </div>

        {adminStatus && (
          <Alert variant={adminStatus.exists ? 'default' : 'destructive'} 
                 className={adminStatus.exists && adminStatus.hasEmail ? 'bg-green-100 border-green-400 text-green-800' : ''}>
            {adminStatus.exists && adminStatus.hasEmail ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              <div>
                <p className="font-medium">{adminStatus.message}</p>
                {adminStatus.data && (
                  <div className="mt-2 text-sm">
                    <p><strong>Username:</strong> {adminStatus.data.username}</p>
                    <p><strong>Tên:</strong> {adminStatus.data.staff_name}</p>
                    <p><strong>Email:</strong> {adminStatus.data.email || 'Chưa có'}</p>
                    <p><strong>Trạng thái:</strong> {adminStatus.data.account_status}</p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {adminStatus && !adminStatus.exists && (
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div>
              <h4 className="font-medium text-yellow-800">Tạo tài khoản Admin</h4>
              <p className="text-sm text-yellow-700">Tạo tài khoản admin mặc định với email</p>
            </div>
            <Button 
              onClick={createAdmin}
              disabled={isChecking}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo Admin
            </Button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Thông tin Admin mặc định:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Username:</strong> admin</li>
            <li>• <strong>Password:</strong> admin (mặc định)</li>
            <li>• <strong>Email:</strong> admin@caremylife.me</li>
            <li>• <strong>Role:</strong> admin</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};