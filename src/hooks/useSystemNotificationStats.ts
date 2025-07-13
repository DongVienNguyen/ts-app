import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';
import { usePageVisibility } from './usePageVisibility';

export function useSystemNotificationStats() {
  const { user } = useSecureAuth();
  const isVisible = usePageVisibility();

  const { data: unprocessedCount, ...queryInfo } = useQuery({
    queryKey: ['system_notification_stats', user?.username],
    queryFn: async () => {
      if (!user) return 0;

      // Đếm các thông báo gửi cho người dùng hiện tại, không có người gửi cụ thể (tức là từ hệ thống),
      // và chưa được đánh dấu là đã xử lý trong related_data.
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_username', user.username)
        .is('related_data->>sender', null)
        .or(`related_data->>user_action.is.null,related_data->>user_action.neq.processed`);

      if (error) {
        console.error('Lỗi khi lấy thống kê thông báo hệ thống:', error);
        return 0;
      }
      
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: isVisible ? 5000 : false, // Tự động làm mới mỗi 5 giây khi tab hiển thị
    staleTime: 4000,
  });

  return { unprocessedCount: unprocessedCount ?? 0, ...queryInfo };
}