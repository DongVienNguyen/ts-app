import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SystemError } from '@/utils/errorTracking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: SystemError | null; // Use a more specific type
  onErrorUpdated?: () => void;
}

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({ isOpen, onClose, error, onErrorUpdated }) => {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState(error?.status || 'new');
  const [resolutionNotes, setResolutionNotes] = useState(error?.resolution_notes || '');

  React.useEffect(() => {
    if (error) {
      setCurrentStatus(error.status || 'new');
      setResolutionNotes(error.resolution_notes || '');
    }
  }, [error]);

  if (!error) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào clipboard!');
  };

  const handleUpdateError = async () => {
    if (!user) {
      toast.error('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }
    
    const updateData: Partial<SystemError> = {
      status: currentStatus,
      resolution_notes: resolutionNotes,
    };

    if (currentStatus === 'resolved' && !error.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.username;
    } else if (currentStatus !== 'resolved' && error.resolved_at) {
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    const { error: updateError } = await supabase
      .from('system_errors')
      .update(updateData)
      .eq('id', error.id);

    if (updateError) {
      toast.error('Cập nhật trạng thái lỗi thất bại.');
      console.error(updateError);
    } else {
      toast.success('Lỗi đã được cập nhật thành công.');
      if (onErrorUpdated) {
        onErrorUpdated();
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chi tiết lỗi: {error.error_type}</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về lỗi hệ thống và các dữ liệu liên quan.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow p-4 border rounded-md">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Thông tin cơ bản</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>ID Lỗi:</strong> {error.id}</p>
                <p><strong>Loại Lỗi:</strong> <Badge variant="destructive">{error.error_type}</Badge></p>
                <p><strong>Thời gian:</strong> {format(new Date(error.created_at!), 'dd/MM/yyyy HH:mm:ss')}</p>
                <p><strong>Mức độ:</strong> <Badge variant={error.severity === 'high' || error.severity === 'critical' ? 'destructive' : error.severity === 'medium' ? 'secondary' : 'outline'}>{error.severity}</Badge></p>
                <p><strong>Người dùng:</strong> {error.user_id || 'N/A'}</p>
                <p><strong>Chức năng:</strong> {error.function_name || 'N/A'}</p>
                <p><strong>URL Yêu cầu:</strong> {error.request_url || 'N/A'}</p>
                {error.resolved_at && <p><strong>Giải quyết lúc:</strong> {format(new Date(error.resolved_at), 'dd/MM/yyyy HH:mm:ss')}</p>}
                {error.resolved_by && <p><strong>Giải quyết bởi:</strong> {error.resolved_by}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                Thông báo lỗi
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(error.error_message)} className="ml-2">
                  <Copy className="h-4 w-4" />
                </Button>
              </h3>
              <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap break-all">
                {error.error_message}
              </pre>
            </div>

            {error.error_stack && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  Stack Trace
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(error.error_stack)} className="ml-2">
                    <Copy className="h-4 w-4" />
                  </Button>
                </h3>
                <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap break-all">
                  {error.error_stack}
                </pre>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-lg mb-2">Thông tin môi trường</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>IP Address:</strong> {error.ip_address || 'N/A'}</p>
                <p><strong>User Agent:</strong> {error.user_agent || 'N/A'}</p>
              </div>
            </div>

            {error.error_data && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  Dữ liệu lỗi bổ sung
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(error.error_data, null, 2))} className="ml-2">
                    <Copy className="h-4 w-4" />
                  </Button>
                </h3>
                <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap break-all">
                  {JSON.stringify(error.error_data, null, 2)}
                </pre>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={currentStatus} onValueChange={setCurrentStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Mới</SelectItem>
                  <SelectItem value="in_progress">Đang xử lý</SelectItem>
                  <SelectItem value="resolved">Đã giải quyết</SelectItem>
                  <SelectItem value="archived">Đã lưu trữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution-notes">Ghi chú giải quyết</Label>
              <Textarea
                id="resolution-notes"
                placeholder="Thêm ghi chú về cách lỗi này đã được giải quyết hoặc các bước đã thực hiện..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button onClick={handleUpdateError}>
            <Save className="mr-2 h-4 w-4" />
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};