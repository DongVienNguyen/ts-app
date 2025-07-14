import { Card, CardContent } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

interface EmptyNotificationsProps {
  searchTerm?: string;
}

export function EmptyNotifications({ searchTerm }: EmptyNotificationsProps) {
  return (
    <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-lg">
      <Inbox className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {searchTerm ? 'Không tìm thấy kết quả' : 'Không có thông báo nào'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm
          ? 'Hãy thử một từ khóa tìm kiếm khác.'
          : 'Tất cả thông báo của bạn sẽ xuất hiện ở đây.'}
      </p>
    </div>
  );
}