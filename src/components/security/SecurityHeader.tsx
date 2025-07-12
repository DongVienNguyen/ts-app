import { Shield, Wifi, WifiOff, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface SecurityHeaderProps {
  lastUpdated: Date | null; // Cho phép null
  isConnected: boolean;
  isRealTimeEnabled: boolean;
  isPaused: boolean;
  onRealTimeToggle: (enabled: boolean) => void;
  onPauseToggle: () => void;
  onReset: () => void;
}

export function SecurityHeader({
  lastUpdated,
  isConnected,
  isRealTimeEnabled,
  isPaused,
  onRealTimeToggle,
  onPauseToggle,
  onReset
}: SecurityHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Theo dõi Bảo mật Thời gian Thực</h1>
          <p className="text-gray-600">
            Giám sát hoạt động bảo mật trực tiếp - Cập nhật lần cuối: {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : 'Đang cập nhật...'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={isRealTimeEnabled}
            onCheckedChange={onRealTimeToggle}
          />
          <span className="text-sm">Thời gian thực</span>
        </div>

        <Button
          onClick={onPauseToggle}
          variant="outline"
          size="sm"
          disabled={!isRealTimeEnabled}
        >
          {isPaused ? (
            <Play className="w-4 h-4 mr-2" />
          ) : (
            <Pause className="w-4 h-4 mr-2" />
          )}
          {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Đặt lại
        </Button>
      </div>
    </div>
  );
}