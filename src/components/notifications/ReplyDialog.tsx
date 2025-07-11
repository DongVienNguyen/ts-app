import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Users, MessageCircle, CheckCircle2, Info, Send } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Notification = Tables<'notifications'>;

interface ReplyDialogProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onSendReply: (notificationId: string, replyText: string, replyType: 'sender' | 'all') => void;
  onQuickAction: (notificationId: string, action: string) => void;
  isReplying: boolean;
  isQuickActioning: boolean;
}

export function ReplyDialog({
  notification,
  isOpen,
  onClose,
  onSendReply,
  onQuickAction,
  isReplying,
  isQuickActioning
}: ReplyDialogProps) {
  const [replyText, setReplyText] = useState('');
  const [replyType, setReplyType] = useState<'sender' | 'all'>('sender');

  const handleClose = () => {
    setReplyText('');
    setReplyType('sender');
    onClose();
  };

  const handleSendReply = () => {
    if (!notification || !replyText.trim()) return;
    onSendReply(notification.id, replyText, replyType);
    setReplyText('');
  };

  const handleQuickAction = (action: string) => {
    if (!notification) return;
    onQuickAction(notification.id, action);
  };

  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Trả lời thông báo</DialogTitle>
          <DialogDescription className="text-gray-600">
            Gửi phản hồi cho thông báo này. Chọn gửi cho người gửi hoặc tất cả người nhận.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={replyType === 'sender' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReplyType('sender')}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Trả lời người gửi
            </Button>
            <Button
              variant={replyType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReplyType('all')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Trả lời tất cả
            </Button>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-3">Phản hồi nhanh:</p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('processed')}
                disabled={isQuickActioning}
                className="flex-1 bg-white hover:bg-green-50 border-green-200 text-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Đã xử lý xong
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('acknowledged')}
                disabled={isQuickActioning}
                className="flex-1 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
              >
                <Info className="h-4 w-4 mr-2" />
                Đã biết
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phản hồi chi tiết (tùy chọn):
            </label>
            <Textarea
              placeholder="Nhập phản hồi chi tiết của bạn..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="bg-white border-gray-300"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim() || isReplying}
              className="min-w-[120px]"
            >
              {isReplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi phản hồi
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}