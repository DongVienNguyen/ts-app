import React from 'react';
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
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: any; // Use a more specific type if available, e.g., SystemError
  onErrorUpdated?: () => void;
}

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({ isOpen, onClose, error, onErrorUpdated }) => {
  const { user } = useAuth();

  if (!error) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào clipboard!');
  };

  const handleUpdateStatus = async (status: 'resolved' | 'open') => {
    if (!user) {
      toast.error('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }
    
    const { error: updateError } = await supabase
      .from('system_errors')
      .update({ 
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        resolved_by: status === 'resolved' ? user.username : null,
      })
      .eq('id', error.id);

    if (updateError) {
      toast.error('Cập nhật trạng thái lỗi thất bại.');
      console.error(updateError);
    } else {
      toast.success(`Lỗi đã được đánh dấu là ${status === 'resolved' ? 'đã giải quyết' : 'mở'}.`);
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
                <p><strong>Thời gian:</strong> {format(new Date(error.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                <p><strong>Mức độ:</strong> <Badge variant={error.severity === 'high' ? 'destructive' : error.severity === 'medium' ? 'secondary' : 'outline'}>{error.severity}</Badge></p>
                <p><strong>Trạng thái:</strong> <Badge variant={error.status === 'open' ? 'destructive' : 'default'}>{error.status}</Badge></p>
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
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          {error.status !== 'resolved' ? (
            <Button onClick={() => handleUpdateStatus('resolved')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Đánh dấu là đã giải quyết
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => handleUpdateStatus('open')}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Mở lại lỗi này
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};