import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSecureAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { ReplyDialog } from '@/components/notifications/ReplyDialog';
import { EmptyNotifications } from '@/components/notifications/EmptyNotifications';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { groupNotificationsByDate } from '@/utils/dateUtils';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import { Loader2 } from 'lucide-react';
import { QuickMessageDialog } from '@/components/notifications/QuickMessageDialog';

export default function Notifications() {
  const { user } = useSecureAuth();
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false);
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
    markAsSeen,
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
    searchTerm,
    setSearchTerm,
    selectedIds,
    selectedCount,
    allVisibleSelected,
    toggleSelection,
    toggleSelectAll,
    markSelectedAsRead,
    deleteSelected,
    deleteNotification,
    markAllAsRead,
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
          onQuickMessage={() => setIsQuickMessageOpen(true)}
          isMarkingAllAsRead={isMarkingAllAsRead}
          filter={filter}
          onFilterChange={setFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCount={selectedCount}
          onMarkSelectedAsRead={markSelectedAsRead}
          onDeleteSelected={deleteSelected}
          isAllSelected={allVisibleSelected}
          onToggleSelectAll={toggleSelectAll}
        />

        {isLoading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyNotifications searchTerm={searchTerm} />
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
                        onMarkAsSeen={markAsSeen}
                        onDelete={deleteNotification}
                        onReply={handleReply}
                        onQuickAction={handleQuickAction}
                        isMarkingAsRead={isMarkingAsRead}
                        isSelected={!!selectedIds[notification.id]}
                        onToggleSelect={toggleSelection}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
            
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