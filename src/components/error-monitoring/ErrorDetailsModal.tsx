import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SystemError } from '@/utils/errorTracking';
import { useState } from 'react';
import { getAuthenticatedSupabaseClient } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ErrorDetailsModalProps {
  error: SystemError | null;
  isOpen: boolean;
  onClose: () => void;
  onErrorUpdated: () => void;
}

type ErrorStatus = 'open' | 'investigating' | 'resolved' | 'ignored';

export function ErrorDetailsModal({ error, isOpen, onClose, onErrorUpdated }: ErrorDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<ErrorStatus>((error?.status as ErrorStatus) || 'open');
  const [notes, setNotes] = useState('');

  if (!error) return null;

  const handleUpdateError = async () => {
    try {
      setIsUpdating(true);
      const client = getAuthenticatedSupabaseClient();
      
      const updateData: any = {
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        resolved_by: status === 'resolved' ? 'admin' : null
      };

      if (notes.trim()) {
        updateData.error_data = {
          ...error.error_data,
          resolution_notes: notes
        };
      }

      const { error: updateError } = await client
        .from('system_errors')
        .update(updateData)
        .eq('id', error.id);

      if (updateError) throw updateError;

      toast.success('Cập nhật lỗi thành công');
      onErrorUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating error:', error);
      toast.error('Không thể cập nhật lỗi');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as ErrorStatus);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Chi tiết Lỗi</span>
            <Badge className={getSeverityColor(error.severity)}>
              {error.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline">{error.error_type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Thông tin cơ bản</h3>
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {error.id}</div>
                <div><strong>Thời gian:</strong> {new Date(error.created_at!).toLocaleString('vi-VN')}</div>
                <div><strong>Loại lỗi:</strong> {error.error_type}</div>
                <div><strong>Mức độ:</strong> {error.severity}</div>
                <div><strong>Trạng thái:</strong> {error.status}</div>
                {error.function_name && (
                  <div><strong>Chức năng:</strong> {error.function_name}</div>
                )}
                {error.user_id && (
                  <div><strong>Người dùng:</strong> {error.user_id}</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Thông tin kỹ thuật</h3>
              <div className="space-y-2 text-sm">
                {error.request_url && (
                  <div><strong>URL:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{error.request_url}</code></div>
                )}
                {error.ip_address && (
                  <div><strong>IP:</strong> {error.ip_address}</div>
                )}
                {error.user_agent && (
                  <div><strong>User Agent:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{error.user_agent}</code></div>
                )}
                {error.resolved_at && (
                  <div><strong>Giải quyết lúc:</strong> {new Date(error.resolved_at).toLocaleString('vi-VN')}</div>
                )}
                {error.resolved_by && (
                  <div><strong>Giải quyết bởi:</strong> {error.resolved_by}</div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div>
            <h3 className="font-medium mb-2">Thông báo lỗi</h3>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <code className="text-red-800 text-sm">{error.error_message}</code>
            </div>
          </div>

          {/* Stack Trace */}
          {error.error_stack && (
            <div>
              <h3 className="font-medium mb-2">Stack Trace</h3>
              <div className="bg-gray-50 border rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{error.error_stack}</pre>
              </div>
            </div>
          )}

          {/* Additional Data */}
          {error.error_data && (
            <div>
              <h3 className="font-medium mb-2">Dữ liệu bổ sung</h3>
              <div className="bg-gray-50 border rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-700">{JSON.stringify(error.error_data, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Update Section */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-4">Cập nhật trạng thái</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Trạng thái</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú giải quyết</label>
                <Textarea
                  placeholder="Mô tả cách giải quyết lỗi..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button onClick={handleUpdateError} disabled={isUpdating}>
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}