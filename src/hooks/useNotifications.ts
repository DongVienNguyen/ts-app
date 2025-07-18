import { useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export type Notification = Tables<'notifications'>;

const NOTIFICATIONS_PER_PAGE = 50;

export function useNotifications() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedConversations, setSelectedConversations] = useState<Record<string, boolean>>({});

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
        .not('hidden_for', 'cs', `{${user.username}}`)
        .or(`recipient_username.eq.${user.username},related_data->>sender.eq.${user.username}`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,message.ilike.%${debouncedSearchTerm}%,recipient_username.ilike.%${debouncedSearchTerm}%,related_data->>sender.ilike.%${debouncedSearchTerm}%`);
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
    staleTime: 10 * 1000,
  });

  const notifications = useMemo(() => data?.pages.flat() ?? [], [data]);

  const markAsSeenMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_seen: true, seen_at: new Date().toISOString(), is_read: true })
        .eq('id', notificationId)
        .or('is_seen.is.false,is_read.is.false');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ message, correspondent }: { message: string; correspondent: string }) => {
      if (!user) throw new Error("User not authenticated");

      const replyData: TablesInsert<'notifications'> = {
        recipient_username: correspondent,
        title: `Tin nhắn từ ${user.username}`,
        message: message,
        notification_type: 'reply',
        related_data: { 
          sender: user.username 
        }
      };
      
      const { error } = await supabase.from('notifications').insert(replyData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
    },
    onError: (error: any) => toast.error(error.message || 'Không thể gửi trả lời'),
  });

  const hideConversationMutation = useMutation({
    mutationFn: async (correspondent: string) => {
      const { error } = await supabase.rpc('hide_conversation', { p_correspondent_username: correspondent });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa cuộc trò chuyện.');
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
    },
    onError: (error: any) => toast.error(error.message || 'Không thể xóa cuộc trò chuyện'),
  });

  const deleteConversationsMutation = useMutation({
    mutationFn: async (correspondents: string[]) => {
      const promises = correspondents.map(c => supabase.rpc('hide_conversation', { p_correspondent_username: c }));
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result.error) throw result.error;
      });
    },
    onSuccess: () => {
      toast.success('Đã xóa các cuộc trò chuyện đã chọn.');
      setSelectedConversations({});
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
    },
    onError: (error: any) => toast.error(error.message || 'Không thể xóa các cuộc trò chuyện.'),
  });

  useEffect(() => {
    if (!user?.username || !isVisible) return;

    const interval = setInterval(() => {
      refetch();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [user?.username, isVisible, refetch]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read && n.recipient_username === user?.username).length, [notifications, user]);

  return {
    notifications, unreadCount,
    isLoading, isFetchingNextPage,
    isReplying: sendReplyMutation.isPending,
    isDeleting: deleteConversationsMutation.isPending,
    refetch, fetchNextPage, hasNextPage,
    searchTerm, setSearchTerm,
    markAsSeen: markAsSeenMutation.mutate,
    sendReply: sendReplyMutation.mutate,
    hideConversation: hideConversationMutation.mutate,
    selectedConversations, setSelectedConversations,
    deleteSelectedConversations: deleteConversationsMutation.mutate,
  };
}