import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Check, Trash2, Reply } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatRelativeTime } from '@/utils/dateUtils';

type Notification = Tables<'notifications'>;

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (notification: Notification) => void;
  isMarkingAsRead: boolean;
}

export function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onReply,
  isMarkingAsRead 
}: NotificationCardProps) {
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'asset_reminder':
        return 'bg-blue-100 text-blue-800';
      case 'crc_reminder':
        return 'bg-green-100 text-green-800';
      case 'transaction_result':
        return 'bg-purple-100 text-purple-800';
      case 'reply':
        return 'bg-orange-100 text-orange-800';
      case 'quick_reply':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'asset_reminder':
        return 'Nhắc nhở tài sản';
      case 'crc_reminder':
        return 'Nhắc nhở CRC';
      case 'transaction_result':
        return 'Kết quả giao dịch';
      case 'reply':
        return 'Phản hồi';
      case 'quick_reply':
        return 'Phản hồi nhanh';
      default:
        return 'Thông báo';
    }
  };

  return (
    <Card 
      id={`notification-${notification.id}`}
      className={`transition-all hover:shadow-md bg-white border-gray-200 ${
        !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getNotificationTypeColor(notification.notification_type)}>
                {getNotificationTypeLabel(notification.notification_type)}
              </Badge>
              {!notification.is_read && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Chưa đọc
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {notification.title}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {formatRelativeTime(notification.created_at!)}
            </p>
          </div>
          
          <div className="flex items-center space-x-1">
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                disabled={isMarkingAsRead}
                title="Đánh dấu đã đọc"
                className="hover:bg-gray-100"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(notification)}
              title="Trả lời"
              className="hover:bg-gray-100"
            >
              <Reply className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Xóa thông báo"
                  className="hover:bg-gray-100"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Xác nhận xóa thông báo</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(notification.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-700 leading-relaxed">
          {notification.message}
        </p>
        
        {notification.related_data && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Thông tin bổ sung:</p>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(notification.related_data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}