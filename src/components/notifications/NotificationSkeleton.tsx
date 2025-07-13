import { Skeleton } from '@/components/ui/skeleton';

export function NotificationSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg bg-white flex items-start space-x-4">
          <Skeleton className="h-10 w-10 rounded-full mt-1" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}