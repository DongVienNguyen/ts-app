import { useEffect, useState, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSecureAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { NotificationHeader } from '@/components/notifications/NotificationHeader';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { EmptyNotifications } from '@/components/notifications/EmptyNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import { Loader2, User, RefreshCw, Trash2, MessageSquarePlus } from 'lucide-react';
import { QuickMessageDialog } from '@/components/notifications/QuickMessageDialog';
import { groupNotificationsByCorrespondent } from '@/utils/notificationUtils';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { ConversationReply } from '@/components/notifications/ConversationReply';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Notifications() {
  const { user } = useSecureAuth();
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState('');
  const [visibleMessages, setVisibleMessages] = useState<Record<string, number>>({});
  const location = useLocation();
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    isLoading,
    isReplying,
    isDeleting,
    refetch,
    markAsSeen,
    sendReply,
    hideConversation,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchTerm,
    setSearchTerm,
    selectedConversations,
    setSelectedConversations,
    deleteSelectedConversations,
  } = useNotifications();

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  const groupedConversations = useMemo(() => groupNotificationsByCorrespondent(notifications, user?.username || ''), [notifications, user]);

  const handleAccordionChange = (correspondent: string) => {
    const newValue = activeAccordionItem === correspondent ? '' : correspondent;
    setActiveAccordionItem(newValue);

    if (newValue && groupedConversations[newValue] && user) {
      const unseenMessages = groupedConversations[newValue].filter(
        n => !n.is_seen && n.recipient_username === user.username
      );
      unseenMessages.forEach(msg => {
        markAsSeen(msg.id);
      });
    }
  };

  const handleShowMore = (correspondent: string) => {
    setVisibleMessages(prev => ({
        ...prev,
        [correspondent]: (prev[correspondent] || 4) + 10
    }));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversation = params.get('conversation');
    if (conversation) {
      handleAccordionChange(conversation);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const conversationKeys = useMemo(() => Object.keys(groupedConversations).sort((a, b) => {
    const lastMessageA = groupedConversations[a][groupedConversations[a].length - 1];
    const lastMessageB = groupedConversations[b][groupedConversations[b].length - 1];
    return new Date(lastMessageB.created_at!).getTime() - new Date(lastMessageA.created_at!).getTime();
  }), [groupedConversations]);

  const handleToggleSelectAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {};
    if (checked) {
      conversationKeys.forEach(key => {
        newSelection[key] = true;
      });
    }
    setSelectedConversations(newSelection);
  };

  const selectedCount = Object.values(selectedConversations).filter(Boolean).length;
  const isAllSelected = selectedCount > 0 && selectedCount === conversationKeys.length;

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto p-6 max-w-4xl bg-white">
          <div className="text-center py-8"><p className="text-gray-600">Vui lòng đăng nhập để xem thông báo</p></div>
        </div>
      </Layout>
    );
  }

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
          selectedCount={selectedCount}
          onDeleteSelected={() => deleteSelectedConversations(Object.keys(selectedConversations).filter(k => selectedConversations[k]))}
          isAllSelected={isAllSelected}
          onToggleSelectAll={handleToggleSelectAll}
          isDeleting={isDeleting}
        />

        {isLoading && notifications.length === 0 ? (
          <NotificationSkeleton />
        ) : conversationKeys.length === 0 ? (
          <EmptyNotifications searchTerm={searchTerm} />
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2" value={activeAccordionItem} onValueChange={handleAccordionChange}>
            {conversationKeys.map((correspondent) => {
              const conversation = groupedConversations[correspondent];
              const unreadInConv = conversation.filter(n => !n.is_read && n.recipient_username === user.username).length;
              const lastMessage = conversation[conversation.length - 1];
              const isLastMessageSentByMe = (lastMessage.related_data as any)?.sender === user.username;
              const messagesToShow = visibleMessages[correspondent] || 4;
              const displayedMessages = conversation.slice(-messagesToShow);

              return (
                <AccordionItem key={correspondent} value={correspondent} className="bg-white rounded-lg shadow-sm border data-[state=open]:border-green-500 overflow-hidden">
                  <div
                    className="flex items-start px-4 py-3 hover:bg-gray-50 rounded-t-lg cursor-pointer w-full"
                    onClick={() => handleAccordionChange(correspondent)}
                  >
                    <Checkbox
                      checked={selectedConversations[correspondent] || false}
                      onCheckedChange={(checked) => {
                        setSelectedConversations(prev => ({ ...prev, [correspondent]: !!checked }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Chọn cuộc trò chuyện với ${correspondent}`}
                      className="mr-4 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 p-2 rounded-full flex-shrink-0"><User className="h-5 w-5 text-gray-600" /></div>
                        <h2 className="text-lg font-semibold text-gray-800 truncate">{correspondent}</h2>
                        {unreadInConv > 0 && (
                          <Badge variant="destructive" className="bg-green-500 hover:bg-green-600 flex-shrink-0">{unreadInConv}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 truncate pr-2">
                        {isLastMessageSentByMe ? <span className="font-medium">Bạn: </span> : ''}{lastMessage.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 self-start" onClick={(e) => e.stopPropagation()}>
                      <span className="h-8 w-8 flex items-center justify-center rounded-md cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => refetch()} role="button" tabIndex={0} aria-label="Làm mới"><RefreshCw className="h-4 w-4" /></span>
                      <AlertDialog onOpenChange={(open) => { if (open) { event?.stopPropagation(); } }}>
                        <AlertDialogTrigger asChild>
                          <span className="h-8 w-8 flex items-center justify-center rounded-md cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors" role="button" tabIndex={0} aria-label="Xóa"><Trash2 className="h-4 w-4" /></span>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle><AlertDialogDescription>Hành động này sẽ ẩn cuộc trò chuyện với "{correspondent}" khỏi danh sách của bạn. Bạn sẽ không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => hideConversation(correspondent)} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent className="p-4 border-t bg-gray-50">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {conversation.length > messagesToShow && (
                        <div className="text-center my-2">
                          <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); handleShowMore(correspondent); }}>
                            Tải thêm tin nhắn cũ
                          </Button>
                        </div>
                      )}
                      {displayedMessages.map((notification) => (
                        <NotificationCard key={notification.id} notification={notification} onMarkAsSeen={markAsSeen} isSent={(notification.related_data as any)?.sender === user.username} />
                      ))}
                    </div>
                    <ConversationReply onSendReply={(data) => sendReply({ message: data.message, correspondent })} isReplying={isReplying} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
        
        {hasNextPage && (<div ref={ref} className="flex justify-center items-center py-6">{isFetchingNextPage && <Loader2 className="h-8 w-8 animate-spin text-gray-500" />}</div>)}
        <QuickMessageDialog isOpen={isQuickMessageOpen} onOpenChange={setIsQuickMessageOpen} />
      </div>
    </Layout>
  );
}