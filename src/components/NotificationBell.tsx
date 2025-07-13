import { useState, useEffect } from 'react';
import { Bell, ThumbsUp, Check, CheckCircle, Package, ClipboardList, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useSystemNotificationStats } from '@/hooks/useSystemNotificationStats';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_data?: any;
}

interface NotificationRelatedData {
  sender?: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();
  const { unprocessedCount: unprocessedSystemCount } = useSystemNotificationStats();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) throw error;
      return notificationId;
    },
    onSuccess: (notificationId) => {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
    },
    onError: (error: any) => console.error('Error marking as read from bell:', error),
  });

  const sendReadReceiptMutation = useMutation({
    mutationFn: async (notification: Notification) => {
      const relatedData = notification.related_data as NotificationRelatedData | null;
      const originalSender = relatedData?.sender;
      const recipient = user?.username;

      if (!originalSender || !recipient || !['reply', 'quick_reply'].includes(notification.notification_type)) {
        return null;
      }
      const { error } = await supabase.from('notifications').insert({
        recipient_username: originalSender,
        title: `Đã xem: ${notification.title.substring(0, 50)}`,
        message: `${recipient} đã xem thông báo của bạn.`,
        notification_type: 'read_receipt',
        related_data: { original_notification_id: notification.id }
      });
      if (error) throw error;
    },
    onError: (error: any) => console.error('Error sending read receipt from bell:', error),
  });

  const quickActionMutation = useMutation({
    mutationFn: async ({ notification, action }: { notification: Notification, action: string }) => {
      if (!user) throw new Error("User not authenticated");
      const originalSender = (notification.related_data as any)?.sender || 'admin';
      const actionMessages: { [key: string]: string } = {
        'acknowledged': '👍 Đã biết.',
        'processed': '✅ Đã xử lý.'
      };
      const { error } = await supabase.from('notifications').insert({
        recipient_username: originalSender,
        title: `Phản hồi nhanh: ${notification.title}`,
        message: actionMessages[action] || action,
        notification_type: 'quick_reply',
        related_data: { original_notification_id: notification.id, replied_by: user.username, sender: user.username }
      });
      if (error) throw error;
      return notification;
    },
    onSuccess: (notification) => {
      if (notification) sendReadReceiptMutation.mutate(notification);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
    },
    onError: (error: any) => console.error('Error sending quick action from bell:', error),
  });

  const loadNotifications = async () => {
    if (!user) return;
    if (!isOpen) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_username', user.username)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!user || !isVisible) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user, isVisible]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_username=eq.${user.username}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
      sendReadReceiptMutation.mutate(notification);
    }
    const correspondent = (notification.related_data as any)?.sender || 'Hệ thống';
    navigate(`/notifications?conversation=${correspondent}`);
    setIsOpen(false);
  };

  const handleQuickAction = (notification: Notification, action: string) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    quickActionMutation.mutate({ notification, action });
  };

  const handleViewAllNotifications = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "h-5 w-5" };
    switch (type) {
      case 'asset_reminder': return <Package {...iconProps} />;
      case 'crc_reminder': return <ClipboardList {...iconProps} />;
      case 'system_error': return <AlertTriangle {...iconProps} />;
      case 'reply': return <MessageSquare {...iconProps} />;
      case 'quick_reply': return <ThumbsUp {...iconProps} />;
      case 'read_receipt': return <CheckCircle {...iconProps} />;
      default: return <Bell {...iconProps} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative hover:bg-green-50 text-gray-600 hover:text-green-700">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-green-500 hover:bg-green-600">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white border border-green-100 shadow-xl" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unprocessedSystemCount > 0 && (
                <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600" title={`${unprocessedSystemCount} tin nhắn hệ thống chưa xử lý`}>
                  {unprocessedSystemCount} Cần xử lý
                </Badge>
              )}
              <Button onClick={handleViewAllNotifications} variant="ghost" size="sm" className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50">
                Xem tất cả
              </Button>
            </div>
          </div>
          <ScrollArea className="h-64">
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div></div>
            ) : notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${notification.is_read ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-green-50 border-green-200 hover:bg-green-100'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-1">{getNotificationIcon(notification.notification_type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate text-gray-900">{notification.title}</h4>
                          {!notification.is_read && (<div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at!).toLocaleString('vi-VN')}</p>
                        {notification.notification_type !== 'read_receipt' && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); handleQuickAction(notification, 'acknowledged'); }}>
                              <ThumbsUp className="h-3 w-3 mr-1" /> Đã biết
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); handleQuickAction(notification, 'processed'); }}>
                              <Check className="h-3 w-3 mr-1" /> Đã xử lý
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không có thông báo mới</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}