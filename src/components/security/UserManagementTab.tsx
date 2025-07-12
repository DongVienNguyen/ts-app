import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Lock, Unlock, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/utils/dateUtils';
import { EditDialog } from '@/components/data-management/EditDialog';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Staff = Tables<'staff'>;

const userFormSchema = z.object({
  staff_name: z.string().min(1, "Tên nhân viên không được để trống"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal('')),
  role: z.enum(['user', 'admin'], { required_error: "Vai trò là bắt buộc" }),
  department: z.string().optional(),
});

export function UserManagementTab() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);

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
          fetchStaff();
          return `Tài khoản ${user.username} đã được ${actionText} thành công.`;
        },
        error: (err) => `Lỗi ${actionText} tài khoản: ${err.message}`,
      }
    );
  };

  const handleEdit = (user: Staff) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: Staff) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveUser = async (updatedData: any) => {
    if (!selectedUser) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('staff')
      .update({
        staff_name: updatedData.staff_name,
        email: updatedData.email,
        role: updatedData.role,
        department: updatedData.department,
      })
      .eq('id', selectedUser.id);

    setIsSaving(false);
    if (error) {
      toast.error(`Lỗi cập nhật người dùng: ${error.message}`);
    } else {
      toast.success('Cập nhật người dùng thành công.');
      setIsEditDialogOpen(false);
      fetchStaff();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', selectedUser.id);

    if (error) {
      toast.error(`Lỗi xóa người dùng: ${error.message}`);
    } else {
      toast.success('Xóa người dùng thành công.');
      setIsDeleteDialogOpen(false);
      fetchStaff();
    }
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.staff_name && user.staff_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [staff, searchTerm]);

  const editFields = [
    { name: 'staff_name', label: 'Tên nhân viên', type: 'text' as const, schema: userFormSchema.shape.staff_name },
    { name: 'email', label: 'Email', type: 'email' as const, schema: userFormSchema.shape.email },
    { name: 'role', label: 'Vai trò', type: 'select' as const, options: ['user', 'admin'], schema: userFormSchema.shape.role },
    { name: 'department', label: 'Phòng ban', type: 'text' as const, schema: userFormSchema.shape.department },
  ];

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
              <TableHead>Cập nhật</TableHead>
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
                    <Button variant="ghost" size="icon" onClick={() => handleToggleLock(user)}>
                      {user.account_status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(user)}>
                      <Trash2 className="w-4 h-4" />
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

      {selectedUser && (
        <EditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveUser}
          title="Chỉnh sửa người dùng"
          description={`Chỉnh sửa thông tin cho ${selectedUser.username}.`}
          fields={editFields}
          initialData={{
            staff_name: selectedUser.staff_name,
            email: selectedUser.email,
            role: selectedUser.role,
            department: selectedUser.department,
          }}
          isLoading={isSaving}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn người dùng
              <span className="font-bold"> {selectedUser?.username} </span>
              khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}