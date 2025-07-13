import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCheck } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatRelativeTime } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Notification = Tables<'notifications'>;

interface NotificationCardProps {
  notification: Notification;
  onMarkAsSeen: (id: string) => void;
  isSent: boolean;
}

export function NotificationCard({ 
  notification, 
  onMarkAsSeen,
  isSent,
}: NotificationCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.8 }, true);

  useEffect(() => {
    if (isIntersecting && !isSent && !notification.is_seen) {
      onMarkAsSeen(notification.id);
    }
  }, [isIntersecting, isSent, notification.is_seen, notification.id, onMarkAsSeen]);

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
            <div className="flex justify-end items-center mt-2">
              <span className="text-xs text-gray-500">
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
      </div>
    </div>
  );
}