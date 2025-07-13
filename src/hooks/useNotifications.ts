import { useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

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

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,message.ilike.%${debouncedSearchTerm}%`);
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

  const notifications = useMemo(() => data?.pages.flat() ?? [], [data]);

  const createMutation = <TVariables = void>(
    mutationFn: (variables: TVariables) => Promise<any>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: () => void;
    }
  ) => {
    return useMutation<any, Error, TVariables>({
      mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        if (options?.successMessage) toast.success(options.successMessage);
        options?.onSuccess?.();
      },
      onError: (error: any) => {
        const errorMessage = options?.errorMessage || 'Đã xảy ra lỗi';
        console.error(errorMessage, error);
        toast.error(error.message || errorMessage);
      },
    });
  };

  const markAsReadMutation = createMutation<string>(
    async (notificationId) => await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId),
    { successMessage: 'Đã đánh dấu đã đọc' }
  );

  const markAllAsReadMutation = createMutation(
    async () => await supabase.from('notifications').update({ is_read: true }).eq('recipient_username', user!.username).eq('is_read', false),
    { successMessage: 'Đã đánh dấu tất cả đã đọc' }
  );

  const deleteNotificationMutation = createMutation<string>(
    async (notificationId) => await supabase.from('notifications').delete().eq('id', notificationId),
    { successMessage: 'Đã xóa thông báo' }
  );

  const deleteAllNotificationsMutation = createMutation(
    async () => await supabase.from('notifications').delete().eq('recipient_username', user!.username),
    { successMessage: 'Đã xóa tất cả thông báo' }
  );

  const markSelectedAsReadMutation = createMutation<string[]>(
    async (ids) => await supabase.from('notifications').update({ is_read: true }).in('id', ids),
    { successMessage: 'Đã đánh dấu các mục đã chọn là đã đọc', onSuccess: () => setSelectedIds({}) }
  );

  const deleteSelectedMutation = createMutation<string[]>(
    async (ids) => await supabase.from('notifications').delete().in('id', ids),
    { successMessage: 'Đã xóa các thông báo đã chọn', onSuccess: () => setSelectedIds({}) }
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
        (payload) => {
          console.log('Real-time notification change detected, refetching...', payload);
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
    setSelectedNotification(notification);
    quickActionMutation.mutate({ action });
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
      allVisibleIds.forEach(id => {
        newSelectedIds[id] = true;
      });
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