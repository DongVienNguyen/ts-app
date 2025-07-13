import { useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

export type Notification = Tables<'notifications'>;
export type FilterType = 'all' | 'unread_all' | 'unread_asset' | 'unread_crc';

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
  const [filter, setFilter] = useState<FilterType>('unread_all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', user?.username, filter, debouncedSearchTerm],
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

      if (filter.startsWith('unread')) {
        query = query.eq('is_read', false);
      }
      if (filter === 'unread_asset') {
        query = query.eq('notification_type', 'asset_reminder');
      }
      if (filter === 'unread_crc') {
        query = query.eq('notification_type', 'crc_reminder');
      }

      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,message.ilike.%${debouncedSearchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages) => {
      if (lastPage.length < NOTIFICATIONS_PER_PAGE) return undefined;
      return (data?.pages.length || 0);
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const notifications = useMemo(() => data?.pages.flat() ?? [], [data]);

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
    onError: (error: any) => {
      console.error('Error sending read receipt:', error);
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notification: Notification) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      if (error) throw error;
      return notification;
    },
    onSuccess: (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu đã đọc');
      if (notification) sendReadReceiptMutation.mutate(notification);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể đánh dấu đã đọc');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => await supabase.from('notifications').update({ is_read: true }).eq('recipient_username', user!.username).eq('is_read', false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu tất cả đã đọc');
    },
    onError: (error: any) => toast.error(error.message || 'Lỗi khi đánh dấu tất cả đã đọc'),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => await supabase.from('notifications').delete().eq('id', notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã xóa thông báo');
    },
    onError: (error: any) => toast.error(error.message || 'Lỗi khi xóa thông báo'),
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => await supabase.from('notifications').delete().eq('recipient_username', user!.username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã xóa tất cả thông báo');
    },
    onError: (error: any) => toast.error(error.message || 'Lỗi khi xóa tất cả thông báo'),
  });

  const markSelectedAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => await supabase.from('notifications').update({ is_read: true }).in('id', ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đánh dấu các mục đã chọn là đã đọc');
      setSelectedIds({});
    },
    onError: (error: any) => toast.error(error.message || 'Lỗi khi thực hiện hành động'),
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids: string[]) => await supabase.from('notifications').delete().in('id', ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã xóa các thông báo đã chọn');
      setSelectedIds({});
    },
    onError: (error: any) => toast.error(error.message || 'Lỗi khi xóa các mục đã chọn'),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ replyText }: { replyText: string }) => {
      if (!selectedNotification || !user) throw new Error("No notification selected or user not authenticated");
      const relatedData = selectedNotification.related_data as NotificationRelatedData | null;
      const originalSender = relatedData?.sender || 'admin';
      
      return supabase.from('notifications').insert({
        recipient_username: originalSender,
        title: `Phản hồi: ${selectedNotification.title}`,
        message: replyText,
        notification_type: 'reply',
        related_data: { original_notification_id: selectedNotification.id, replied_by: user.username, sender: user.username }
      } as TablesInsert<'notifications'>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsReplyDialogOpen(false);
      toast.success('Đã gửi phản hồi');
    },
    onError: (error: any) => toast.error(error.message || 'Không thể gửi phản hồi'),
  });

  const quickActionMutation = useMutation({
    mutationFn: async ({ notification, action }: { notification: Notification; action: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);

      const relatedData = notification.related_data as NotificationRelatedData | null;
      const originalSender = relatedData?.sender || 'admin';
      const actionMessages: { [key: string]: string } = { 
        'acknowledged': '👍 Đã biết.',
        'processed': '✅ Đã xử lý.'
      };

      const { error } = await supabase.from('notifications').insert({
        recipient_username: originalSender,
        title: `Phản hồi nhanh: ${notification.title}`,
        message: actionMessages[action] || action,
        notification_type: 'quick_reply',
        related_data: { original_notification_id: notification.id, replied_by: user.username, action_type: action, sender: user.username }
      } as TablesInsert<'notifications'>);

      if (error) throw error;
      return notification;
    },
    onSuccess: (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã gửi phản hồi nhanh');
      if (notification) sendReadReceiptMutation.mutate(notification);
    },
    onError: (error: any) => toast.error(error.message || 'Không thể gửi phản hồi nhanh'),
  });

  useEffect(() => {
    if (!user?.username) return;
    const channel = supabase.channel(`notifications:${user.username}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_username=eq.${user.username}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.username, queryClient]);

  const handleReply = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = (data: { message: string }) => {
    replyMutation.mutate({ replyText: data.message });
  };

  const handleQuickAction = (notification: Notification, action: string) => {
    quickActionMutation.mutate({ notification, action });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    const allVisibleIds = notifications.map(n => n.id);
    const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds[id]);
    
    if (allVisibleSelected) {
      setSelectedIds({});
    } else {
      const newSelectedIds = { ...selectedIds };
      allVisibleIds.forEach(id => { newSelectedIds[id] = true; });
      setSelectedIds(newSelectedIds);
    }
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);
  const allVisibleSelected = useMemo(() => {
    const visibleIds = notifications.map(n => n.id);
    return visibleIds.length > 0 && visibleIds.every(id => selectedIds[id]);
  }, [notifications, selectedIds]);

  return {
    notifications, unreadCount, selectedNotification, isReplyDialogOpen,
    isLoading, isFetchingNextPage,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isReplying: replyMutation.isPending,
    isQuickActioning: quickActionMutation.isPending,
    refetch, fetchNextPage, hasNextPage,
    filter, setFilter,
    searchTerm, setSearchTerm,
    selectedIds, selectedCount, allVisibleSelected,
    toggleSelection, toggleSelectAll,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAllNotifications: deleteAllNotificationsMutation.mutate,
    markSelectedAsRead: () => {
      const idsToMark = Object.keys(selectedIds).filter(id => selectedIds[id]);
      if (idsToMark.length > 0) markSelectedAsReadMutation.mutate(idsToMark);
    },
    deleteSelected: () => {
      const idsToDelete = Object.keys(selectedIds).filter(id => selectedIds[id]);
      if (idsToDelete.length > 0) deleteSelectedMutation.mutate(idsToDelete);
    },
    handleReply, handleSendReply, handleQuickAction,
    setIsReplyDialogOpen,
  };
}