import { useSecureAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { ReplyDialog } from '@/components/notifications/ReplyDialog';
import { EmptyNotifications } from '@/components/notifications/EmptyNotifications';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { groupNotificationsByDate } from '@/utils/dateUtils';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import { Button } from '@/components/ui/button';

export default function Notifications() {
  const { user } = useSecureAuth();
  const {
    notifications,
    unreadCount,
    selectedNotification,
    isReplyDialogOpen,
    isLoading,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isReplying,
    isQuickActioning,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    handleReply,
    handleSendReply,
    handleQuickAction,
    setIsReplyDialogOpen,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    filter,
    setFilter,
  } = useNotifications();

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

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl bg-white min-h-screen">
        <NotificationHeader
          unreadCount={unreadCount}
          totalCount={notifications.length}
          isLoading={isLoading}
          onRefresh={refetch}
          onMarkAllAsRead={markAllAsRead}
          onDeleteAll={deleteAllNotifications}
          isMarkingAllAsRead={isMarkingAllAsRead}
          filter={filter}
          onFilterChange={setFilter}
        />

        {isLoading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotifications).map(([groupTitle, groupItems]) =>
              groupItems.length > 0 && (
                <div key={groupTitle}>
                  <h2 className="text-base font-semibold text-gray-500 mb-3 uppercase tracking-wider">{groupTitle}</h2>
                  <div className="space-y-4">
                    {(groupItems as Notification[]).map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        onReply={handleReply}
                        onQuickAction={handleQuickAction}
                        isMarkingAsRead={isMarkingAsRead}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
            {hasNextPage && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                >
                  {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm thông báo'}
                </Button>
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
      </div>
    </Layout>
  );
}