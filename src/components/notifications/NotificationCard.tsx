import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Reply, ThumbsUp, CheckCheck } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatRelativeTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Notification = Tables<'notifications'>;

interface NotificationCardProps {
  notification: Notification;
  onMarkAsSeen: (id: string) => void;
  onReply: (notification: Notification) => void;
  onQuickAction: (notification: Notification, action: string) => void;
  isSent: boolean;
}

export function NotificationCard({ 
  notification, 
  onMarkAsSeen,
  onReply,
  onQuickAction,
  isSent,
}: NotificationCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.8 }, true);

  useEffect(() => {
    if (isIntersecting && !isSent && !notification.is_seen) {
      onMarkAsSeen(notification.id);
    }
  }, [isIntersecting, isSent, notification.is_seen, notification.id, onMarkAsSeen]);

  const showActions = !isSent && notification.notification_type !== 'read_receipt' && notification.notification_type !== 'seen_receipt';

  return (
    <div ref={ref} className={cn("flex w-full", isSent ? "justify-end" : "justify-start")}>
      <div className="max-w-lg w-full">
        <Card 
          id={`notification-${notification.id}`}
          className={cn(
            'transition-all shadow-sm',
            isSent 
              ? 'bg-blue-50 text-gray-800' 
              : 'bg-white',
            !notification.is_read && !isSent ? 'border-blue-500 border' : ''
          )}
        >
          <CardHeader className="pb-2 pt-3 px-4">
            <p className="text-xs text-gray-500">
              {isSent ? "Bạn đã gửi" : `Gửi bởi ${((notification.related_data as any)?.sender || 'Hệ thống')}`}
            </p>
          </CardHeader>
          
          <CardContent className="px-4 pb-3">
            <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">
              {notification.message}
            </p>
            <div className="flex justify-end items-center mt-2">
              <span className="text-xs text-gray-400">
                {formatRelativeTime(notification.created_at!)}
              </span>
              {isSent && notification.is_seen && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CheckCheck className="h-4 w-4 ml-2 text-blue-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{`Đã xem lúc ${new Date(notification.seen_at!).toLocaleString('vi-VN')}`}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardContent>
        </Card>
        {showActions && (
          <div className="flex justify-start space-x-2 mt-1 pl-2">
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => onQuickAction(notification, 'acknowledged')}>
              <ThumbsUp className="h-3 w-3 mr-1" /> Đã biết
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => onQuickAction(notification, 'processed')}>
              <Check className="h-3 w-3 mr-1" /> Đã xử lý
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => onReply(notification)}>
              <Reply className="h-3 w-3 mr-1" /> Trả lời
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}