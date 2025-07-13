import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Bell, RefreshCw, CheckCheck, Trash2, Search, X } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface NotificationHeaderProps {
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  onMarkAllAsRead: () => void;
  onDeleteAll: () => void;
  isMarkingAllAsRead: boolean;
  filter: 'all' | 'unread';
  onFilterChange: (filter: 'all' | 'unread') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCount: number;
  onMarkSelectedAsRead: () => void;
  onDeleteSelected: () => void;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
}

export function NotificationHeader({
  unreadCount,
  totalCount,
  isLoading,
  onRefresh,
  onMarkAllAsRead,
  onDeleteAll,
  isMarkingAllAsRead,
  filter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  selectedCount,
  onMarkSelectedAsRead,
  onDeleteSelected,
  isAllSelected,
  onToggleSelectAll,
}: NotificationHeaderProps) {
  const isSelectionMode = selectedCount > 0;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
            <p className="text-gray-600">
              {totalCount > 0
                ? `${unreadCount > 0 ? `${unreadCount} chưa đọc / ` : ''}${totalCount} tổng số`
                : 'Không có thông báo nào'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Tìm kiếm..."
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
        </div>
      </div>

      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 min-h-[52px]">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all-checkbox"
            checked={isAllSelected}
            onCheckedChange={onToggleSelectAll}
            aria-label="Select all"
          />
          {isSelectionMode ? (
            <>
              <span className="font-medium text-sm text-gray-700">{selectedCount} đã chọn</span>
              <Button variant="ghost" size="sm" onClick={onMarkSelectedAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Đánh dấu đã đọc
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa {selectedCount} thông báo đã chọn?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteSelected} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <label htmlFor="select-all-checkbox" className="font-medium text-sm text-gray-700 cursor-pointer">Chọn tất cả</label>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => {
              if (value) onFilterChange(value as 'all' | 'unread');
            }}
            className="bg-gray-200 p-1 rounded-lg"
          >
            <ToggleGroupItem value="all" aria-label="Tất cả" className="data-[state=on]:bg-white data-[state=on]:text-green-700 px-3">Tất cả</ToggleGroupItem>
            <ToggleGroupItem value="unread" aria-label="Chưa đọc" className="data-[state=on]:bg-white data-[state=on]:text-green-700 px-3">Chưa đọc</ToggleGroupItem>
          </ToggleGroup>
          
          {!isSelectionMode && unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} disabled={isMarkingAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Đọc tất cả
            </Button>
          )}
          
          {!isSelectionMode && totalCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa tất cả
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa tất cả thông báo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteAll} className="bg-red-600 hover:bg-red-700">Xóa tất cả</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}