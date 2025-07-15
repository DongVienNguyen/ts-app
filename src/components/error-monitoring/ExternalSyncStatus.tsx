import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ExternalSyncStatusProps {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  syncCount: number;
}

export function ExternalSyncStatus({ isSyncing, lastSyncTime, error, syncCount }: ExternalSyncStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Đồng bộ API Ngoài</span>
          {isSyncing ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : (
            <RefreshCw className="h-5 w-5 text-gray-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi Đồng bộ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trạng thái:</span>
          {error ? (
            <span className="font-semibold text-red-600">Có lỗi</span>
          ) : (
            <span className="font-semibold text-green-600">Đang hoạt động</span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Lần cuối cập nhật:</span>
          <span className="font-semibold">
            {lastSyncTime ? formatDistanceToNow(lastSyncTime, { addSuffix: true, locale: vi }) : 'Đang chờ...'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Số lần đồng bộ:</span>
          <span className="font-semibold">{syncCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}