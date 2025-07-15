import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, RefreshCw, Play, Pause, Mail, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ExternalSyncStatusProps {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  syncCount: number;
  isPaused: boolean;
  notifyByEmail: boolean;
  notifyByPush: boolean;
  togglePause: () => void;
  toggleEmailNotification: () => void;
  togglePushNotification: () => void;
  syncData: () => void;
}

export function ExternalSyncStatus({
  isSyncing,
  lastSyncTime,
  error,
  syncCount,
  isPaused,
  notifyByEmail,
  notifyByPush,
  togglePause,
  toggleEmailNotification,
  togglePushNotification,
  syncData
}: ExternalSyncStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Đồng bộ API Ngoài</span>
          {isSyncing ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : isPaused ? (
            <Pause className="h-5 w-5 text-yellow-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
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
          {isPaused ? (
             <span className="font-semibold text-yellow-600">Đã tạm dừng</span>
          ) : error ? (
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
        <Separator />
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label htmlFor="email-notification" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    <span>Gửi mail khi lỗi</span>
                </Label>
                <Switch
                    id="email-notification"
                    checked={notifyByEmail}
                    onCheckedChange={toggleEmailNotification}
                />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="push-notification" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    <span>Gửi push khi lỗi</span>
                </Label>
                <Switch
                    id="push-notification"
                    checked={notifyByPush}
                    onCheckedChange={togglePushNotification}
                />
            </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
            <Button onClick={togglePause} variant="outline" className="w-full">
                {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
            </Button>
            <Button onClick={syncData} variant="secondary" disabled={isSyncing || isPaused}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync ngay
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}