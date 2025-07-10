import { useState, useEffect } from 'react';
import { Bell, Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityNotifications } from '@/hooks/useSecurityNotifications';
import { Link, useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  related_data?: any;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Security notifications hook
  const {
    notifications: securityNotifications,
    unreadCount: securityUnreadCount,
    markAsRead: markSecurityAsRead,
    markAllAsRead: markAllSecurityAsRead,
    isAdmin
  } = useSecurityNotifications();

  const loadNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_username', user.username)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_username=eq.${user.username}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_username', user?.username)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      markAllSecurityAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'asset_reminder':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'crc_reminder':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'system':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSecurityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Shield className="w-4 h-4 text-yellow-500" />;
      default:
        return <Shield className="w-4 h-4 text-blue-500" />;
    }
  };

  const unreadRegularCount = notifications.filter(n => !n.is_read).length;
  const totalUnreadCount = unreadRegularCount + (isAdmin ? securityUnreadCount : 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative bg-white hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-700" />
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white border border-gray-200" align="end">
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-3 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-900">Thông báo</CardTitle>
              <div className="flex items-center space-x-2">
                {totalUnreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Đánh dấu đã đọc
                  </Button>
                )}
                <Button
                  onClick={handleViewAllNotifications}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Xem tất cả
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Security Notifications (Admin only) */}
                  {isAdmin && securityNotifications.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-red-50 border-b">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Cảnh báo Bảo mật</span>
                          <Link 
                            to="/security-monitor" 
                            className="text-xs text-red-600 hover:underline ml-auto"
                            onClick={() => setIsOpen(false)}
                          >
                            Xem tất cả
                          </Link>
                        </div>
                      </div>
                      {securityNotifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                            notification.severity === 'critical' ? 'border-red-500' :
                            notification.severity === 'high' ? 'border-orange-500' :
                            notification.severity === 'medium' ? 'border-yellow-500' :
                            'border-blue-500'
                          } ${!notification.read ? 'bg-red-25' : ''}`}
                          onClick={() => markSecurityAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            {getSecurityIcon(notification.severity)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Sự kiện bảo mật
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.event.type} - {notification.event.username || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.timestamp.toLocaleString('vi-VN')}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                      <Separator />
                    </>
                  )}

                  {/* Regular Notifications */}
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                          !notification.is_read ? 'bg-blue-25' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.notification_type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    !isAdmin || securityNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Không có thông báo mới</p>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}