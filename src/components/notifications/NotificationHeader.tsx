import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Bell, RefreshCw, CheckCheck, Trash2 } from 'lucide-react';

interface NotificationHeaderProps {
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  onMarkAllAsRead: () => void;
  onDeleteAll: () => void;
  isMarkingAllAsRead: boolean;
}

export function NotificationHeader({
  unreadCount,
  totalCount,
  isLoading,
  onRefresh,
  onMarkAllAsRead,
  onDeleteAll,
  isMarkingAllAsRead
}: NotificationHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <Bell className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAllAsRead}
            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
        
        {totalCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tất cả
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900">Xác nhận xóa tất cả thông báo</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Bạn có chắc chắn muốn xóa tất cả thông báo? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAll}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Xóa tất cả
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}