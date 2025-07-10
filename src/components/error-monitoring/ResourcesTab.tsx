import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemMetric } from '@/utils/errorTracking';

interface ResourcesTabProps {
  systemMetrics: SystemMetric[];
}

export function ResourcesTab({ systemMetrics }: ResourcesTabProps) {
  const memoryMetrics = systemMetrics
    .filter(m => m.metric_type === 'memory')
    .slice(0, 5);

  const networkMetrics = systemMetrics
    .filter(m => m.metric_type === 'network')
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Sử dụng Bộ nhớ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memoryMetrics.length > 0 ? (
              memoryMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{metric.metric_name}:</span>
                  <span className="font-medium">
                    {(metric.metric_value / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Không có dữ liệu bộ nhớ</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất Mạng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {networkMetrics.length > 0 ? (
              networkMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{metric.metric_name}:</span>
                  <span className="font-medium">
                    {metric.metric_value} {metric.metric_unit}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Không có dữ liệu mạng</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}