import { useSecureAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { ReplyDialog } from '@/components/notifications/ReplyDialog';
import { EmptyNotifications } from '@/components/notifications/EmptyNotifications';
import { LoadingSpinner } from '@/components/notifications/LoadingSpinner';
import { useNotifications } from '@/hooks/useNotifications';

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
    // handleQuickAction, // Removed
    setIsReplyDialogOpen
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
        />

        {isLoading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onReply={handleReply}
                isMarkingAsRead={isMarkingAsRead}
              />
            ))}
          </div>
        )}

        {selectedNotification && ( // Thêm điều kiện này để chỉ render khi có thông báo được chọn
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