import { Tables } from '@/integrations/supabase/types';

type Notification = Tables<'notifications'>;

export const groupNotificationsByCorrespondent = (
  notifications: Notification[],
  currentUsername: string
): Record<string, Notification[]> => {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach(notification => {
    const sender = (notification.related_data as any)?.sender;
    const recipient = notification.recipient_username;

    let correspondent: string | null = null;
    if (recipient === currentUsername) {
      correspondent = sender || 'Hệ thống';
    } else if (sender === currentUsername) {
      correspondent = recipient;
    }

    if (correspondent) {
      if (!groups[correspondent]) {
        groups[correspondent] = [];
      }
      groups[correspondent].push(notification);
    }
  });

  Object.keys(groups).forEach(correspondent => {
    groups[correspondent].sort((a, b) => 
      new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
    );
  });

  return groups;
};