import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Check, Trash2, Reply, Package, ClipboardList, AlertTriangle, Bell, MessageSquare, ThumbsUp } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatRelativeTime } from '@/utils/dateUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type Notification = Tables<'notifications'>;

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (notification: Notification) => void;
  onQuickAction: (notification: Notification, action: string) => void;
  isMarkingAsRead: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  const iconProps = { className: "h-5 w-5" };
  switch (type) {
    case 'asset_reminder': return <Package {...iconProps} />;
    case 'crc_reminder': return <ClipboardList {...iconProps} />;
    case 'system_error': return <AlertTriangle {...iconProps} />;
    case 'reply': return <MessageSquare {...iconProps} />;
    case 'quick_reply': return <ThumbsUp {...iconProps} />;
    default: return <Bell {...iconProps} />;
  }
};

const getNotificationIconColor = (type: string) => {
  switch (type) {
    case 'asset_reminder': return 'text-blue-500 bg-blue-100';
    case 'crc_reminder': return 'text-green-500 bg-green-100';
    case 'system_error': return 'text-red-500 bg-red-100';
    case 'reply': return 'text-purple-500 bg-purple-100';
    case 'quick_reply': return 'text-teal-500 bg-teal-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

export function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onReply,
  onQuickAction,
  isMarkingAsRead,
  isSelected,
  onToggleSelect
}: NotificationCardProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-5 pl-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(notification.id)}
          aria-label={`Select notification ${notification.id}`}
        />
      </div>
      <Card 
        id={`notification-${notification.id}`}
        className={cn(
          'flex-1 transition-all hover:shadow-md bg-white border-l-4',
          !notification.is_read && 'border-l-blue-500',
          notification.is_read && 'border-l-transparent',
          isSelected && 'bg-blue-50 border-blue-300'
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${getNotificationIconColor(notification.notification_type)}`}>
              {getNotificationIcon(notification.notification_type)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-gray-900">
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
                  size="icon"
                  onClick={() => onMarkAsRead(notification.id)}
                  disabled={isMarkingAsRead}
                  title="Đánh dấu đã đọc"
                  className="h-8 w-8 hover:bg-gray-100"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Xóa" className="h-8 w-8 hover:bg-red-50 text-gray-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                    <AlertDialogDescription>Bạn có chắc muốn xóa thông báo này?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(notification.id)} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pl-14 pb-3">
          <p className="text-gray-700 leading-relaxed text-sm">
            {notification.message}
          </p>
        </CardContent>

        <CardFooter className="pl-14 pb-3 flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => onQuickAction(notification, 'acknowledged')}>
            <ThumbsUp className="h-4 w-4 mr-2" />
            Đã biết
          </Button>
          <Button variant="default" size="sm" onClick={() => onReply(notification)}>
            <Reply className="h-4 w-4 mr-2" />
            Trả lời
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}