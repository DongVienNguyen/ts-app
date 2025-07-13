import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Notification = Tables<'notifications'>;

interface NotificationRelatedData {
  sender?: string;
  recipients?: string[];
  [key: string]: any;
}

const NOTIFICATIONS_PER_PAGE = 15;

export function useNotifications() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', user?.username, filter],
    queryFn: async ({ pageParam }) => {
      if (!user) return [];
      
      const from = pageParam * NOTIFICATIONS_PER_PAGE;
      const to = from + NOTIFICATIONS_PER_PAGE - 1;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_username', user.username)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < NOTIFICATIONS_PER_PAGE) return undefined;
      return allPages.length;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const notifications = data?.pages.flat() ?? [];

  const createMutation = <TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<any>,
    successMessage: string,
    errorMessage: string
  ) => {
    return useMutation<any, Error, TVariables>({
      mutationFn,
      onSuccess: () => {
        refetch();
        toast.success(successMessage);
      },
      onError: (error: any) => {
        console.error(errorMessage, error);
        toast.error(error.message || errorMessage);
      },
    });
  };

  const markAsReadMutation = createMutation<string>(
    async (notificationId: string) => {
      const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) throw error;
      return data;
    },
    'Đã đánh dấu đã đọc',
    'Lỗi khi đánh dấu đã đọc'
  );

  const markAllAsReadMutation = createMutation(
    async () => {
      const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('recipient_username', user!.username).eq('is_read', false);
      if (error) throw error;
      return data;
    },
    'Đã đánh dấu tất cả đã đọc',
    'Lỗi khi đánh dấu tất cả'
  );

  const deleteNotificationMutation = createMutation<string>(
    async (notificationId: string) => {
      const { data, error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) throw error;
      return data;
    },
    'Đã xóa thông báo',
    'Lỗi khi xóa thông báo'
  );

  const deleteAllNotificationsMutation = createMutation(
    async () => {
      const { data, error } = await supabase.from('notifications').delete().eq('recipient_username', user!.username);
      if (error) throw error;
      return data;
    },
    'Đã xóa tất cả thông báo',
    'Lỗi khi xóa tất cả thông báo'
  );

  const replyMutation = useMutation({
    mutationFn: async ({ replyText }: { replyText: string }) => {
      if (!selectedNotification) throw new Error("No notification selected");
      const relatedData = selectedNotification.related_data as NotificationRelatedData | null;
      const originalSender = relatedData?.sender || 'admin';
      
      return supabase.from('notifications').insert({
        recipient_username: originalSender,
        title: `Phản hồi: ${selectedNotification.title}`,
        message: replyText,
        notification_type: 'reply',
        related_data: { original_notification_id: selectedNotification.id, replied_by: user?.username }
      } as TablesInsert<'notifications'>);
    },
    onSuccess: () => {
      refetch();
      setIsReplyDialogOpen(false);
      toast.success('Đã gửi phản hồi');
    },
    onError: (error: any) => {
      console.error('Error sending reply:', error);
      toast.error(error.message || 'Không thể gửi phản hồi');
    }
  });

  const quickActionMutation = useMutation({
    mutationFn: async ({ action }: { action: string }) => {
      if (!selectedNotification) throw new Error("No notification selected");
      const relatedData = selectedNotification.related_data as NotificationRelatedData | null;
      const originalSender = relatedData?.sender || 'admin';
      const actionMessages: { [key: string]: string } = { 'acknowledged': '👍 Đã biết.' };

      return supabase.from('notifications').insert({
        recipient_username: originalSender,
        title: `Phản hồi nhanh: ${selectedNotification.title}`,
        message: actionMessages[action] || action,
        notification_type: 'quick_reply',
        related_data: { original_notification_id: selectedNotification.id, replied_by: user?.username, action_type: action }
      } as TablesInsert<'notifications'>);
    },
    onSuccess: () => {
      refetch();
      toast.success('Đã gửi phản hồi nhanh');
    },
    onError: (error: any) => {
      console.error('Error sending quick action:', error);
      toast.error(error.message || 'Không thể gửi phản hồi nhanh');
    }
  });

  useEffect(() => {
    if (!user?.username) return;
    const channel = supabase.channel(`notifications:${user.username}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_username=eq.${user.username}` },
        () => {
          console.log('Real-time notification change detected, refetching...');
          refetch();
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.username, refetch]);

  const handleReply = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = (data: { message: string }) => {
    replyMutation.mutate({ replyText: data.message });
  };

  const handleQuickAction = (notification: Notification, action: string) => {
    setSelectedNotification(notification);
    quickActionMutation.mutate({ action });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications, unreadCount, selectedNotification, isReplyDialogOpen,
    isLoading, isFetchingNextPage,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isReplying: replyMutation.isPending,
    isQuickActioning: quickActionMutation.isPending,
    refetch, fetchNextPage, hasNextPage,
    filter, setFilter,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAllNotifications: deleteAllNotificationsMutation.mutate,
    handleReply, handleSendReply, handleQuickAction,
    setIsReplyDialogOpen,
  };
}