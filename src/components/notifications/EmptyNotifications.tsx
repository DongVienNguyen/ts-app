import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export function EmptyNotifications() {
  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Bell className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông báo</h3>
        <p className="text-gray-500 text-center">
          Bạn chưa có thông báo nào. Các thông báo mới sẽ xuất hiện ở đây.
        </p>
      </CardContent>
    </Card>
  );
}