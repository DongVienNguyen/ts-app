import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Lock, Unlock, Search, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/utils/dateUtils';

type Staff = Tables<'staff'>;

export function UserManagementTab() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      toast.error(`Lỗi tải danh sách người dùng: ${error.message}`);
    } else {
      setStaff(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleLock = async (user: Staff) => {
    const newStatus = user.account_status === 'locked' ? 'active' : 'locked';
    const actionText = newStatus === 'locked' ? 'khóa' : 'mở khóa';

    toast.promise(
      supabase.functions.invoke('manage-user-status', {
        body: { username: user.username, status: newStatus },
      }),
      {
        loading: `Đang ${actionText} tài khoản ${user.username}...`,
        success: (res: any) => {
          if (res.error) {
            throw new Error(res.error);
          }
          fetchStaff(); // Refresh data on success
          return `Tài khoản ${user.username} đã được ${actionText} thành công.`;
        },
        error: (err) => `Lỗi ${actionText} tài khoản: ${err.message}`,
      }
    );
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.staff_name && user.staff_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [staff, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên đăng nhập hoặc tên NV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={fetchStaff} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên nhân viên</TableHead>
              <TableHead>Tên đăng nhập</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Cập nhật lần cuối</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="p-4">
                     <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredStaff.length > 0 ? (
              filteredStaff.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.staff_name || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.account_status === 'active' ? 'default' : 'destructive'}>
                      {user.account_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatRelativeTime(user.updated_at!)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLock(user)}
                    >
                      {user.account_status === 'locked' ? (
                        <Unlock className="w-4 h-4 mr-2" />
                      ) : (
                        <Lock className="w-4 h-4 mr-2" />
                      )}
                      {user.account_status === 'locked' ? 'Mở khóa' : 'Khóa'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Không tìm thấy người dùng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}