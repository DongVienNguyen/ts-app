import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCircle } from 'lucide-react';
import { SecurityEvent } from '@/utils/realTimeSecurityUtils';

interface ActiveUsersCardProps {
  events: SecurityEvent[];
}

export function ActiveUsersCard({ events }: ActiveUsersCardProps) {
  // Lấy danh sách username duy nhất từ các sự kiện gần đây, lọc bỏ các giá trị null/undefined
  const activeUsers = Array.from(new Set(events.map(e => e.username).filter(Boolean)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Người dùng Hoạt động</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeUsers.length > 0 ? (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {activeUsers.slice(0, 10).map((user) => ( // Hiển thị tối đa 10 người dùng
              <li key={user as string} className="flex items-center space-x-2 text-sm">
                <UserCircle className="w-4 h-4 text-gray-500" />
                <span>{user}</span>
              </li>
            ))}
            {activeUsers.length > 10 && (
                <li className="text-xs text-gray-500 pt-1">
                    ... và {activeUsers.length - 10} người khác.
                </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Không có người dùng nào hoạt động gần đây.
          </p>
        )}
      </CardContent>
    </Card>
  );
}