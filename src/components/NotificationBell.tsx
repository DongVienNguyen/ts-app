import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';

type Notification = Tables<'notifications'>;

export function NotificationBell() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();

  const fetchNotifications = async (): Promise<Notification[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_username', user.username)
      .order('created_at', { ascending: false })
      .limit(5); // Only show recent 5 in dropdown

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return (data as Notification[]) || [];
  };

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.username],
    queryFn: fetchNotifications,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.username) return;

    // Create a unique channel name to avoid conflicts
    const channelName = `notifications_${user.username}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'notifications',
          filter: `recipient_username=eq.${user.username}`,
        },
        (payload) => {
          console.log('📨 Notification change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user.username] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime channel '${channelName}' subscribed successfully!`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error:', err);
          // Retry subscription after delay
          setTimeout(() => {
            channel.unsubscribe();
            // Will be recreated on next effect run
          }, 5000);
        }
        if (status === 'TIMED_OUT') {
          console.warn('⌛ Realtime channel connection timed out.');
          // Retry subscription
          setTimeout(() => {
            channel.unsubscribe();
          }, 1000);
        }
        if (status === 'CLOSED') {
          console.log('🔒 Realtime channel closed');
        }
      });

    return () => {
      console.log(`🧹 Cleaning up channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [user?.username, queryClient]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_username', user.username)
      .eq('is_read', false);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
  };

  const deleteAllNotifications = async () => {
    if (!user) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      await supabase
        .from('notifications')
        .delete()
        .eq('recipient_username', user.username);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Thông báo</span>
          <div className="space-x-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="icon" onClick={markAllAsRead} title="Đánh dấu tất cả đã đọc">
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={deleteAllNotifications} title="Xóa tất cả thông báo">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-center py-8">
            Không có thông báo
          </DropdownMenuItem>
        ) : (
          <>
            {notifications.slice(0, 4).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <h4 className="font-medium text-sm truncate flex-1">{notification.title}</h4>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                <span className="text-xs text-gray-400 mt-2">
                  {new Date(notification.created_at!).toLocaleString('vi-VN')}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link 
            to="/notifications" 
            className="w-full text-center font-medium text-blue-600 hover:text-blue-800 py-2 flex items-center justify-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Xem tất cả thông báo
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}