import { Button } from '@/components/ui/button';
import { Bell, RefreshCw, Search, MessageSquarePlus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface NotificationHeaderProps {
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  onQuickMessage: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  isAllSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  isDeleting: boolean;
}

export function NotificationHeader({
  unreadCount,
  isLoading,
  onRefresh,
  onQuickMessage,
  searchTerm,
  onSearchChange,
  selectedCount,
  onDeleteSelected,
  isAllSelected,
  onToggleSelectAll,
  isDeleting,
}: NotificationHeaderProps) {

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hộp thư</h1>
            <p className="text-gray-600">
              {unreadCount > 0
                ? `${unreadCount} tin nhắn chưa đọc`
                : 'Không có tin nhắn mới'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Tìm cuộc hội thoại..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="default"
            onClick={onQuickMessage}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Tin nhắn mới
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={onToggleSelectAll}
            aria-label="Chọn tất cả"
          />
          <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
            {selectedCount > 0 ? `${selectedCount} đã chọn` : "Chọn tất cả"}
          </label>
        </div>
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Đang xóa...' : `Xóa (${selectedCount})`}
          </Button>
        )}
      </div>
    </div>
  );
}