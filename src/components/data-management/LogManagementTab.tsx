import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SystemError, getSeverityColor } from '@/utils/errorTracking';
import { RefreshCw, Trash2, CalendarX2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SmartPagination } from '@/components/SmartPagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ITEMS_PER_PAGE = 15;

const fetchSystemErrors = async ({ pageParam = 1, searchTerm = '' }) => {
  let query = supabase.from('system_errors').select('*', { count: 'exact' });

  if (searchTerm) {
    query = query.or(`error_type.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%,function_name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((pageParam - 1) * ITEMS_PER_PAGE, pageParam * ITEMS_PER_PAGE - 1);

  if (error) throw error;
  return { data: (data as SystemError[]) || [], count: count || 0 };
};

export function LogManagementTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['system_errors_management', currentPage, debouncedSearchTerm],
    queryFn: () => fetchSystemErrors({ pageParam: currentPage, searchTerm: debouncedSearchTerm }),
    placeholderData: (previousData) => previousData,
  });

  const deleteErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      const { error } = await supabase.from('system_errors').delete().eq('id', errorId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa log lỗi thành công.');
      queryClient.invalidateQueries({ queryKey: ['system_errors_management'] });
    },
    onError: (error: any) => toast.error(`Lỗi khi xóa log: ${error.message}`),
  });

  const deleteAllErrorsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('system_errors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa tất cả log lỗi.');
      queryClient.invalidateQueries({ queryKey: ['system_errors_management'] });
    },
    onError: (error: any) => toast.error(`Lỗi khi xóa tất cả log: ${error.message}`),
  });

  const deleteOldErrorsMutation = useMutation({
    mutationFn: async (days: number) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const { error } = await supabase.from('system_errors').delete().lt('created_at', cutoffDate.toISOString());
      if (error) throw error;
    },
    onSuccess: (_, days) => {
      toast.success(`Đã xóa các log lỗi cũ hơn ${days} ngày.`);
      queryClient.invalidateQueries({ queryKey: ['system_errors_management'] });
    },
    onError: (error: any) => toast.error(`Lỗi khi xóa log cũ: ${error.message}`),
  });

  const handleRowClick = (error: SystemError) => {
    setSelectedError(error);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Logs Hệ thống</CardTitle>
          <CardDescription>Xem, tìm kiếm và quản lý các log lỗi được ghi lại trong hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Tìm kiếm theo loại lỗi, tin nhắn, tên hàm, người dùng..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-grow"
            />
            <Button onClick={() => refetch()} variant="outline" size="sm" className="flex-shrink-0">
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bạn có chắc chắn muốn xóa tất cả logs?</AlertDialogTitle>
                  <AlertDialogDescription>Hành động này không thể hoàn tác. Tất cả dữ liệu log lỗi sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAllErrorsMutation.mutate()} className="bg-red-600 hover:bg-red-700">Xóa tất cả</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><CalendarX2 className="w-4 h-4 mr-2" /> Xóa logs cũ hơn 30 ngày</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa logs cũ?</AlertDialogTitle>
                  <AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn tất cả các log lỗi cũ hơn 30 ngày.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteOldErrorsMutation.mutate(30)}>Xóa</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại Lỗi</TableHead>
                  <TableHead>Tin nhắn</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Đang tải logs...</TableCell></TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Không tìm thấy log nào.</TableCell></TableRow>
                ) : (
                  data?.data?.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>{format(new Date(error.created_at!), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                      <TableCell>{error.error_type}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{error.error_message}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleRowClick(error)}><Eye className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa log này?</AlertDialogTitle>
                              <AlertDialogDescription>Hành động này sẽ xóa vĩnh viễn log lỗi này.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={(e) => { e.stopPropagation(); deleteErrorMutation.mutate(error.id!); }} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {data && data.count > ITEMS_PER_PAGE && (
            <SmartPagination
              totalCount={data.count}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Chi tiết Log Lỗi</DialogTitle>
            <DialogDescription>Thông tin chi tiết về log lỗi hệ thống.</DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="grid gap-4 py-4 text-sm max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">ID:</Label><span className="col-span-3 font-mono text-xs">{selectedError.id}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Thời gian:</Label><span className="col-span-3">{format(new Date(selectedError.created_at!), 'dd/MM/yyyy HH:mm:ss')}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Loại Lỗi:</Label><span className="col-span-3">{selectedError.error_type}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Tin nhắn:</Label><span className="col-span-3">{selectedError.error_message}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Mức độ:</Label><span className={`col-span-3 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedError.severity)}`}>{selectedError.severity}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Tên Hàm:</Label><span className="col-span-3">{selectedError.function_name || 'N/A'}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Người dùng:</Label><span className="col-span-3">{selectedError.user_id || 'N/A'}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">URL:</Label><span className="col-span-3 break-all">{selectedError.request_url || 'N/A'}</span></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">User Agent:</Label><span className="col-span-3 break-all">{selectedError.user_agent || 'N/A'}</span></div>
              <div className="grid grid-cols-4 items-start gap-4"><Label className="text-right pt-2">Stack Trace:</Label><Textarea readOnly value={selectedError.error_stack || 'N/A'} className="col-span-3 font-mono text-xs h-32" /></div>
              <div className="grid grid-cols-4 items-start gap-4"><Label className="text-right pt-2">Dữ liệu:</Label><Textarea readOnly value={selectedError.error_data ? JSON.stringify(selectedError.error_data, null, 2) : 'N/A'} className="col-span-3 font-mono text-xs h-32" /></div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}