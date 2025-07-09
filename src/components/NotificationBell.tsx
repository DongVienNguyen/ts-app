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
import { Link, useNavigate } from 'react-router-dom';

type Notification = Tables<'notifications'>;

export function NotificationBell() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

    const channel = supabase
      .channel(`notifications:${user.username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_username=eq.${user.username}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.username] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime channel 'notifications:${user.username}' subscribed successfully!`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error:', err);
        }
        if (status === 'TIMED_OUT') {
          console.warn('⌛ Realtime channel connection timed out.');
        }
      });

    return () => {
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

  // Handle bell click - navigate to notifications page
  const handleBellClick = () => {
    navigate('/notifications');
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell button with click handler */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={handleBellClick}
        title="Xem tất cả thông báo"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown menu for quick actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute -right-2 -top-1 h-4 w-4 p-0 opacity-70 hover:opacity-100"
            title="Menu thông báo"
          >
            <span className="text-xs">▼</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Thông báo nhanh</span>
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
          
          {/* Quick link to full notifications page */}
          <DropdownMenuItem asChild>
            <Link 
              to="/notifications" 
              className="w-full flex items-center justify-center font-medium text-blue-600 hover:text-blue-800 py-3"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Xem trang thông báo đầy đủ
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {notifications.length === 0 ? (
            <DropdownMenuItem disabled>Không có thông báo</DropdownMenuItem>
          ) : (
            <>
              {notifications.slice(0, 3).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    if (!notification.is_read) markAsRead(notification.id);
                    navigate('/notifications');
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
              
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link 
                  to="/notifications" 
                  className="w-full text-center font-medium text-green-600 hover:text-green-800"
                >
                  Xem tất cả {notifications.length} thông báo →
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}