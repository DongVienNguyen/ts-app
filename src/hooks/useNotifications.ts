import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { getCachedNotifications, invalidateNotifications } from '@/utils/databaseCache';

export type Notification = Tables<'notifications'>; // Exported Notification type

interface NotificationRelatedData {
  sender?: string;
  recipients?: string[];
  [key: string]: any;
}

export function useNotifications() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  // Fetch notifications with caching
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.username],
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];
      
      console.log('📨 Fetching notifications with cache for user:', user.username);
      
      // Use cached query for better performance
      const data = await getCachedNotifications(user.username);
      
      console.log(`✅ Retrieved ${data?.length || 0} notifications from cache`);
      return (data as Notification[]) || [];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (renamed from cacheTime)
  });

  // Mark as read mutation with cache invalidation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate cache for this user
      if (user?.username) {
        invalidateNotifications(user.username);
      }
      
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã đánh dấu đã đọc');
    },
    onError: (error) => {
      console.error('Error marking as read:', error);
      toast.error('Không thể đánh dấu đã đọc');
    }
  });

  // Mark all as read mutation with cache invalidation
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
      // Invalidate cache for this user
      if (user?.username) {
        invalidateNotifications(user.username);
      }
      
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã đánh dấu tất cả đã đọc');
    },
    onError: (error) => {
      console.error('Error marking all as read:', error);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  });

  // Delete notification mutation with cache invalidation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate cache for this user
      if (user?.username) {
        invalidateNotifications(user.username);
      }
      
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã xóa thông báo');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error('Không thể xóa thông báo');
    }
  });

  // Delete all notifications mutation with cache invalidation
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
      // Invalidate cache for this user
      if (user?.username) {
        invalidateNotifications(user.username);
      }
      
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.username] });
      toast.success('Đã xóa tất cả thông báo');
    },
    onError: (error) => {
      console.error('Error deleting all notifications:', error);
      toast.error('Không thể xóa tất cả thông báo');
    }
  });

  // Reply mutation with cache invalidation
  const replyMutation = useMutation({
    mutationFn: async ({ notificationId, replyText, replyType }: { 
      notificationId: string; 
      replyText: string; 
      replyType: 'sender' | 'all' 
    }) => {
      if (!selectedNotification) return;

      // Get original sender and recipients with proper type casting
      const relatedData = selectedNotification.related_data as NotificationRelatedData | null;
      const originalSender = relatedData?.sender || 'admin';
      const originalRecipients = relatedData?.recipients || [originalSender];
      
      // Determine recipients based on reply type
      const recipients = replyType === 'all' 
        ? [originalSender, ...originalRecipients.filter((r: string) => r !== user?.username)]
        : [originalSender];

      // Send reply to each recipient
      const promises = recipients.map((recipient: string) => 
        supabase.from('notifications').insert({
          recipient_username: recipient,
          title: `Phản hồi: ${selectedNotification.title}`,
          message: replyText,
          notification_type: 'reply',
          related_data: { 
            original_notification_id: notificationId,
            replied_by: user?.username,
            reply_type: replyType,
            original_sender: originalSender,
            original_recipients: originalRecipients
          }
        } as TablesInsert<'notifications'>)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to send ${errors.length} replies`);
      }
    },
    onSuccess: () => {
      // Invalidate notifications cache for all affected users
      invalidateNotifications(); // Clear all notifications cache
      
      setIsReplyDialogOpen(false);
      setSelectedNotification(null);
      toast.success('Đã gửi phản hồi');
    },
    onError: (error) => {
      console.error('Error sending reply:', error);
      toast.error('Không thể gửi phản hồi');
    }
  });

  // Quick action mutation with cache invalidation
  const quickActionMutation = useMutation({
    mutationFn: async ({ notificationId, action }: { notificationId: string; action: string }) => {
      if (!selectedNotification) return;

      const relatedData = selectedNotification.related_data as NotificationRelatedData | null;
      const originalSender = relatedData?.sender || 'admin';
      const actionMessages = {
        'processed': '✅ Đã xử lý xong.',
        'acknowledged': '👍 Đã biết.'
      };

      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_username: originalSender,
          title: `Phản hồi: ${selectedNotification.title}`,
          message: actionMessages[action as keyof typeof actionMessages] || action,
          notification_type: 'quick_reply',
          related_data: { 
            original_notification_id: notificationId,
            replied_by: user?.username,
            action_type: action,
            original_sender: originalSender
          }
        } as TablesInsert<'notifications'>);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate notifications cache
      invalidateNotifications();
      
      setIsReplyDialogOpen(false);
      setSelectedNotification(null);
      toast.success('Đã gửi phản hồi nhanh');
    },
    onError: (error) => {
      console.error('Error sending quick action:', error);
      toast.error('Không thể gửi phản hồi');
    }
  });

  // Real-time subscription with cache invalidation
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
          
          // Invalidate cache when real-time changes occur
          invalidateNotifications(user.username);
          
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

  // Handle URL navigation for specific notifications
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const notificationId = urlParams.get('id');
    
    if (notificationId) {
      setTimeout(() => {
        const element = document.getElementById(`notification-${notificationId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);
    }
  }, []);

  // Listen for service worker navigation messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_NOTIFICATION') {
        const notificationId = event.data.notificationId;
        if (notificationId) {
          setTimeout(() => {
            const element = document.getElementById(`notification-${notificationId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
              }, 3000);
            }
          }, 500);
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleReply = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = (data: { subject: string; message: string; }) => {
    if (!selectedNotification) {
      toast.error('Không có thông báo được chọn để trả lời.');
      return;
    }
    replyMutation.mutate({
      notificationId: selectedNotification.id,
      replyText: data.message,
      replyType: 'sender' // Assuming default reply is to sender
    });
  };

  const handleQuickAction = (action: string) => {
    if (!selectedNotification) {
      toast.error('Không có thông báo được chọn để thực hiện hành động nhanh.');
      return;
    }
    quickActionMutation.mutate({
      notificationId: selectedNotification.id,
      action: action
    });
  };

  // Ensure notifications is always an array and calculate unread count
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notificationsArray.filter(n => !n.is_read).length;

  return {
    // Data
    notifications: notificationsArray,
    unreadCount,
    selectedNotification,
    isReplyDialogOpen,
    
    // Loading states
    isLoading,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isReplying: replyMutation.isPending,
    isQuickActioning: quickActionMutation.isPending,
    
    // Actions
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAllNotifications: deleteAllNotificationsMutation.mutate,
    handleReply,
    handleSendReply,
    handleQuickAction,
    setIsReplyDialogOpen,
    setSelectedNotification
  };
}