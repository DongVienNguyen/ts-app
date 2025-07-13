import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSecureAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { ReplyDialog } from '@/components/notifications/ReplyDialog';
import { EmptyNotifications } from '@/components/notifications/EmptyNotifications';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import { Loader2, User } from 'lucide-react';
import { QuickMessageDialog } from '@/components/notifications/QuickMessageDialog';
import { groupNotificationsByCorrespondent } from '@/utils/notificationUtils';
import { Card } from '@/components/ui/card';

export default function Notifications() {
  const { user } = useSecureAuth();
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    selectedNotification,
    isReplyDialogOpen,
    isLoading,
    isReplying,
    isQuickActioning,
    refetch,
    markAsSeen,
    handleReply,
    handleSendReply,
    handleQuickAction,
    setIsReplyDialogOpen,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchTerm,
    setSearchTerm,
  } = useNotifications();

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto p-6 max-w-4xl bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">Vui lòng đăng nhập để xem thông báo</p>
          </div>
        </div>
      </Layout>
    );
  }

  const groupedConversations = groupNotificationsByCorrespondent(notifications, user.username);
  const conversationKeys = Object.keys(groupedConversations).sort((a, b) => {
    const lastMessageA = groupedConversations[a][groupedConversations[a].length - 1];
    const lastMessageB = groupedConversations[b][groupedConversations[b].length - 1];
    return new Date(lastMessageB.created_at!).getTime() - new Date(lastMessageA.created_at!).getTime();
  });

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 max-w-4xl bg-gray-50 min-h-screen">
        <NotificationHeader
          unreadCount={unreadCount}
          totalCount={notifications.length}
          isLoading={isLoading}
          onRefresh={refetch}
          onQuickMessage={() => setIsQuickMessageOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {isLoading && notifications.length === 0 ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyNotifications searchTerm={searchTerm} />
        ) : (
          <div className="space-y-6">
            {conversationKeys.map((correspondent) => (
              <Card key={correspondent} className="p-4 bg-white shadow-md rounded-lg">
                <div className="flex items-center gap-3 mb-4 border-b pb-3">
                  <div className="bg-gray-200 p-2 rounded-full">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{correspondent}</h2>
                </div>
                <div className="space-y-4">
                  {groupedConversations[correspondent].map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsSeen={markAsSeen}
                      onReply={handleReply}
                      onQuickAction={handleQuickAction}
                      isSent={(notification.related_data as any)?.sender === user.username}
                    />
                  ))}
                </div>
              </Card>
            ))}
            
            {hasNextPage && (
              <div ref={ref} className="flex justify-center items-center py-6">
                {isFetchingNextPage && <Loader2 className="h-8 w-8 animate-spin text-gray-500" />}
              </div>
            )}
          </div>
        )}

        {selectedNotification && (
          <ReplyDialog
            notification={selectedNotification}
            isOpen={isReplyDialogOpen}
            onClose={() => setIsReplyDialogOpen(false)}
            onSendReply={handleSendReply}
            isReplying={isReplying}
            isQuickActioning={isQuickActioning}
          />
        )}

        <QuickMessageDialog isOpen={isQuickMessageOpen} onOpenChange={setIsQuickMessageOpen} />
      </div>
    </Layout>
  );
}