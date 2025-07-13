import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { formatRelativeTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Check } from 'lucide-react';

type Notification = Tables<'notifications'>;

interface NotificationCardProps {
  notification: Notification;
  onMarkAsSeen: (id: string) => void;
  isSent: boolean;
  onQuickAction: (data: { notification: Notification, action: string }) => void;
}

export function NotificationCard({ 
  notification, 
  onMarkAsSeen,
  isSent,
  onQuickAction,
}: NotificationCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.8 }, true);

  useEffect(() => {
    if (isIntersecting && !isSent && !notification.is_seen) {
      onMarkAsSeen(notification.id);
    }
  }, [isIntersecting, isSent, notification.is_seen, notification.id, onMarkAsSeen]);

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    onQuickAction({ notification, action });
  };

  return (
    <div ref={ref} className={cn("flex w-full", isSent ? "justify-end" : "justify-start")}>
      <div className="max-w-lg w-full">
        <Card 
          id={`notification-${notification.id}`}
          className={cn(
            'transition-all shadow-sm rounded-xl',
            isSent 
              ? 'bg-blue-100 text-gray-800' 
              : 'bg-white',
            !notification.is_read && !isSent ? 'border-blue-500 border-2' : 'border'
          )}
        >
          <CardContent className="px-4 py-3">
            <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">
              {notification.message}
            </p>
            <div className="flex items-end justify-end mt-2 text-xs">
              <div className="flex items-center text-gray-500 mr-2">
                <span className="mr-1">
                  {formatRelativeTime(notification.created_at!)}
                </span>
                {isSent && notification.is_seen && (
                  <span className="text-blue-600 font-medium">
                    Đã xem
                  </span>
                )}
              </div>
              {!isSent && notification.notification_type !== 'read_receipt' && (
                <div className="flex flex-col space-y-1">
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs bg-white" onClick={(e) => handleQuickAction(e, 'acknowledged')}>
                    <ThumbsUp className="h-3 w-3 mr-1" /> Đã biết
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs bg-white" onClick={(e) => handleQuickAction(e, 'processed')}>
                    <Check className="h-3 w-3 mr-1" /> Đã xử lý
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}