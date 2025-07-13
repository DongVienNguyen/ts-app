import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Activity } from '@/hooks/useRealtimeActivity';

const ActivityIcon = ({ activity }: { activity: Activity }) => {
  if (activity.activity_type === 'error') {
    const severity = (activity as any).severity;
    if (severity === 'critical' || severity === 'high') {
      return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>;
    }
    return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
  }
  if (activity.activity_type === 'security') {
    const eventType = (activity as any).event_type;
    if (['FAILED_LOGIN', 'ACCOUNT_LOCKED'].includes(eventType)) {
       return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
    }
    return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
  }
  return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
};

const ActivityMessage = ({ activity }: { activity: Activity }) => {
  if (activity.activity_type === 'error') {
    return `Lỗi hệ thống: ${(activity as any).error_message}`;
  }
  if (activity.activity_type === 'security') {
    const eventType = (activity as any).event_type;
    if (eventType === 'HEALTH_CHECK') {
      return `Kiểm tra sức khỏe hệ thống: API`;
    }
    return `Sự kiện bảo mật: ${eventType}`;
  }
  return "Hoạt động không xác định";
};

export const RealtimeActivityFeed = ({ activities, isLoading }: { activities: Activity[], isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-3">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <ActivityIcon activity={activity} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <ActivityMessage activity={activity} />
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.created_at!), { addSuffix: true, locale: vi })}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>Không có hoạt động gần đây.</p>
        </div>
      )}
    </div>
  );
};