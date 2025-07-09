import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Bell, Check, CheckCheck, Trash2, Reply, Send, RefreshCw } from 'lucide-react';
import { formatRelativeTime } from '@/utils/dateUtils';
import { toast } from 'sonner';

type Notification = Tables<'notifications'>;

export default function Notifications() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.username],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_username', user.username)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã đánh dấu đã đọc');
    },
    onError: (error) => {
      console.error('Error marking as read:', error);
      toast.error('Không thể đánh dấu đã đọc');
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_username', user.username)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã đánh dấu tất cả đã đọc');
    },
    onError: (error) => {
      console.error('Error marking all as read:', error);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã xóa thông báo');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error('Không thể xóa thông báo');
    }
  });

  // Delete all notifications mutation
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_username', user.username);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã xóa tất cả thông báo');
    },
    onError: (error) => {
      console.error('Error deleting all notifications:', error);
      toast.error('Không thể xóa tất cả thông báo');
    }
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ notificationId, replyText }: { notificationId: string; replyText: string }) => {
      // Create a new notification as reply (simplified approach)
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_username: 'admin', // Send to admin or original sender
          title: `Phản hồi: ${selectedNotification?.title}`,
          message: replyText,
          notification_type: 'reply',
          related_data: { 
            original_notification_id: notificationId,
            replied_by: user?.username 
          }
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyText('');
      setIsReplying(false);
      toast.success('Đã gửi phản hồi');
    },
    onError: (error) => {
      console.error('Error sending reply:', error);
      toast.error('Không thể gửi phản hồi');
    }
  });

  // Real-time subscription with improved error handling
  useEffect(() => {
    if (!user?.username) return;

    const channelName = `notifications_page_${user.username}_${Date.now()}`;
    
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
          console.log('📨 Notification page change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user.username] });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Notifications page channel '${channelName}' subscribed successfully!`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Notifications page channel error:', err);
        }
        if (status === 'TIMED_OUT') {
          console.warn('⌛ Notifications page channel timed out.');
        }
      });

    return () => {
      console.log(`🧹 Cleaning up notifications page channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [user?.username, queryClient]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
      default:
        return 'Thông báo';
    }
  };

  if (!user) {
    return <div>Vui lòng đăng nhập để xem thông báo</div>;
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
            
            {notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tất cả
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa tất cả thông báo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa tất cả thông báo? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAllNotificationsMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Xóa tất cả
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông báo</h3>
              <p className="text-gray-500 text-center">
                Bạn chưa có thông báo nào. Các thông báo mới sẽ xuất hiện ở đây.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all hover:shadow-md ${
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
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedNotification(notification)}
                            title="Phản hồi"
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Phản hồi thông báo</DialogTitle>
                            <DialogDescription>
                              Gửi phản hồi cho thông báo này. Phản hồi sẽ được gửi đến quản trị viên.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            <Textarea
                              placeholder="Nhập phản hồi của bạn..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={4}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReplyText('');
                                  setSelectedNotification(null);
                                }}
                              >
                                Hủy
                              </Button>
                              <Button
                                onClick={() => replyMutation.mutate({ 
                                  notificationId: notification.id, 
                                  replyText 
                                })}
                                disabled={!replyText.trim() || replyMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Gửi phản hồi
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xóa thông báo"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa thông báo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
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
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}