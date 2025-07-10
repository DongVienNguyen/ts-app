import { Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface AlertConfig {
  enabled: boolean;
  threshold: number;
  type: 'sound' | 'notification' | 'both';
}

interface AlertConfigurationCardProps {
  alertConfig: AlertConfig;
  onConfigChange: (config: AlertConfig) => void;
}

export function AlertConfigurationCard({ alertConfig, onConfigChange }: AlertConfigurationCardProps) {
  const updateConfig = (updates: Partial<AlertConfig>) => {
    onConfigChange({ ...alertConfig, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Cấu hình Cảnh báo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={alertConfig.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
            <span className="text-sm">Bật cảnh báo</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm">Ngưỡng cảnh báo:</span>
            <select
              value={alertConfig.threshold}
              onChange={(e) => updateConfig({ threshold: parseInt(e.target.value) })}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value={3}>3 lần thất bại</option>
              <option value={5}>5 lần thất bại</option>
              <option value={10}>10 lần thất bại</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm">Loại cảnh báo:</span>
            <select
              value={alertConfig.type}
              onChange={(e) => updateConfig({ type: e.target.value as 'sound' | 'notification' | 'both' })}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="sound">Âm thanh</option>
              <option value="notification">Thông báo</option>
              <option value="both">Cả hai</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}