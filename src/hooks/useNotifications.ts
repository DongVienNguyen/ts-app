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

const NOTIFICATIONS_PER_PAGE = 50; // Increased for conversation view

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
    queryKey: ['notifications_conversations', user?.username, debouncedSearchTerm],
    queryFn: async ({ pageParam }) => {
      if (!user) return [];
      
      const from = pageParam * NOTIFICATIONS_PER_PAGE;
      const to = from + NOTIFICATIONS_PER_PAGE - 1;

      let query = supabase
        .from('notifications')
        .select('*')
        .or(`recipient_username.eq.${user.username},related_data->>sender.eq.${user.username}`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,message.ilike.%${debouncedSearchTerm}%,recipient_username.ilike.%${debouncedSearchTerm}%`);
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

  const markAsSeenMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_seen: true, seen_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('is_seen', false) // Only update if not already seen
        .select()
        .single();
      if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
      }
    },
    onError: (error: any) => {
      if (error.code !== 'PGRST116') {
        console.error('Error marking as seen:', error);
      }
    },
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
        title: `Đã đọc: ${notification.title.substring(0, 50)}`,
        message: `${recipient} đã đọc thông báo của bạn.`,
        notification_type: 'read_receipt',
        related_data: { original_notification_id: notification.id }
      });
      if (error) throw error;
    },
    onError: (error: any) => console.error('Error sending read receipt:', error),
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notification: Notification) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      if (error) throw error;
      return notification;
    },
    onSuccess: (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
      toast.success('Đã đánh dấu đã đọc');
      if (notification) sendReadReceiptMutation.mutate(notification);
    },
    onError: (error: any) => toast.error(error.message || 'Không thể đánh dấu đã đọc'),
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
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
      toast.success('Đã gửi phản hồi nhanh');
      if (notification) sendReadReceiptMutation.mutate(notification);
    },
    onError: (error: any) => toast.error(error.message || 'Không thể gửi phản hồi nhanh'),
  });

  useEffect(() => {
    if (!user?.username) return;
    const channel = supabase.channel(`notifications_conversations:${user.username}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `or(recipient_username.eq.${user.username},related_data->>sender.eq.${user.username})` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.username, queryClient]);

  const handleReply = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = (data: { message: string }) => {
    if (!selectedNotification || !user) return;
    const originalSender = (selectedNotification.related_data as any)?.sender || selectedNotification.recipient_username;
    const recipient = originalSender === user.username ? selectedNotification.recipient_username : originalSender;

    const replyData = {
        recipient_username: recipient,
        title: `Re: ${selectedNotification.title}`,
        message: data.message,
        notification_type: 'reply',
        related_data: { 
            original_notification_id: selectedNotification.id, 
            replied_by: user.username, 
            sender: user.username 
        }
    };
    
    supabase.from('notifications').insert(replyData).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
        setIsReplyDialogOpen(false);
        toast.success('Đã gửi phản hồi');
    });
  };

  const handleQuickAction = (notification: Notification, action: string) => {
    quickActionMutation.mutate({ notification, action });
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read && n.recipient_username === user?.username).length, [notifications, user]);

  return {
    notifications, unreadCount, selectedNotification, isReplyDialogOpen,
    isLoading, isFetchingNextPage,
    isReplying: false, // Simplified for now
    isQuickActioning: quickActionMutation.isPending,
    refetch, fetchNextPage, hasNextPage,
    filter, setFilter,
    searchTerm, setSearchTerm,
    markAsRead: markAsReadMutation.mutate,
    markAsSeen: markAsSeenMutation.mutate,
    handleReply, handleSendReply, handleQuickAction,
    setIsReplyDialogOpen,
  };
}