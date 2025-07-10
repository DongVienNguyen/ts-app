import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, ExternalLink, Search, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type Notification = Tables<'notifications'>;

export function NotificationBell() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchNotifications = async (): Promise<Notification[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_username', user.username)
      .order('created_at', { ascending: false })
      .limit(10); // Tăng lên 10 thông báo gần nhất

    if (error) {
      console.error('Lỗi tải thông báo:', error);
      return [];
    }
    return (data as Notification[]) || [];
  };

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.username],
    queryFn: fetchNotifications,
    enabled: !!user,
    refetchInterval: 30000, // Tự động làm mới mỗi 30 giây
    staleTime: 10000, // Dữ liệu cũ sau 10 giây
  });

  // Realtime subscription với cải thiện
  useEffect(() => {
    if (!user?.username) return;

    const channelName = `notifications_bell_${user.username}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_username=eq.${user.username}`,
        },
        (payload) => {
          console.log('📨 Thông báo mới:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user.username] });
          
          // Hiển thị toast cho thông báo mới
          if (payload.eventType === 'INSERT' && payload.new) {
            const newNotification = payload.new as Notification;
            toast.info(`🔔 ${newNotification.title}`, {
              description: newNotification.message,
              duration: 5000,
              action: {
                label: 'Xem',
                onClick: () => window.location.href = '/notifications'
              }
            });
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Kênh thông báo '${channelName}' đã kết nối!`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Lỗi kênh thông báo:', err);
          // Thử kết nối lại sau 5 giây
          setTimeout(() => {
            channel.unsubscribe();
          }, 5000);
        }
      });

    return () => {
      console.log(`🧹 Đóng kênh: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [user?.username, queryClient]);

  // Lọc thông báo theo tìm kiếm và loại
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'unread' && !notification.is_read) ||
      (filterType === 'read' && notification.is_read) ||
      notification.notification_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (notificationId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã đánh dấu đã đọc');
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const markAllAsRead = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_username', user.username)
        .eq('is_read', false);
      
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã đánh dấu tất cả đã đọc');
    } catch (error) {
      console.error('Lỗi đánh dấu tất cả:', error);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const deleteAllNotifications = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!user) return;
    
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('recipient_username', user.username);
        
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
        toast.success('Đã xóa tất cả thông báo');
        setIsDropdownOpen(false);
      } catch (error) {
        console.error('Lỗi xóa thông báo:', error);
        toast.error('Không thể xóa tất cả thông báo');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'asset_reminder':
        return '📦';
      case 'crc_reminder':
        return '✅';
      case 'transaction_result':
        return '💼';
      case 'reply':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 transition-colors">
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-blue-600 animate-pulse' : 'text-gray-600'}`} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600 animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-hidden">
        {/* Header với tìm kiếm và bộ lọc */}
        <DropdownMenuLabel className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-lg">Thông báo</span>
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead} 
                  title="Đánh dấu tất cả đã đọc"
                  className="h-8 w-8 p-0"
                >
                  <CheckCheck className="h-4 w-4 text-green-600" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={deleteAllNotifications} 
                title="Xóa tất cả thông báo"
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
          
          {/* Thanh tìm kiếm */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-8 h-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Bộ lọc */}
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Tất cả', count: notifications.length },
              { key: 'unread', label: 'Chưa đọc', count: unreadCount },
              { key: 'asset_reminder', label: 'Tài sản', count: notifications.filter(n => n.notification_type === 'asset_reminder').length },
              { key: 'crc_reminder', label: 'CRC', count: notifications.filter(n => n.notification_type === 'crc_reminder').length }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={filterType === filter.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType(filter.key)}
                className="h-7 text-xs"
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </DropdownMenuLabel>
        
        {/* Danh sách thông báo */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <DropdownMenuItem disabled className="text-center py-8 flex-col">
              <Bell className="h-12 w-12 text-gray-300 mb-2" />
              <span className="text-gray-500">
                {searchTerm || filterType !== 'all' ? 'Không tìm thấy thông báo' : 'Không có thông báo'}
              </span>
            </DropdownMenuItem>
          ) : (
            filteredNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  !notification.is_read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                }}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate pr-2">
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {getTimeAgo(notification.created_at!)}
                      </span>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Đánh dấu đã đọc
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {/* Footer với link đến trang chi tiết */}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="p-0">
          <Link 
            to="/notifications" 
            className="w-full text-center font-medium text-blue-600 hover:text-blue-800 py-3 flex items-center justify-center hover:bg-blue-50 transition-colors"
            onClick={() => setIsDropdownOpen(false)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Xem tất cả thông báo ({notifications.length})
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}