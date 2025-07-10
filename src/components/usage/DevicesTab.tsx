import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DeviceStats {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface DevicesTabProps {
  deviceStats: DeviceStats;
  totalSessions: number;
}

export function DevicesTab({ deviceStats, totalSessions }: DevicesTabProps) {
  const deviceChartData = [
    { name: 'Desktop', value: deviceStats.desktop, color: '#0088FE' },
    { name: 'Mobile', value: deviceStats.mobile, color: '#00C49F' },
    { name: 'Tablet', value: deviceStats.tablet, color: '#FFBB28' }
  ];

  const deviceItems = [
    {
      name: 'Desktop',
      icon: Monitor,
      value: deviceStats.desktop,
      color: 'blue',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Mobile',
      icon: Smartphone,
      value: deviceStats.mobile,
      color: 'green',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Tablet',
      icon: Tablet,
      value: deviceStats.tablet,
      color: 'yellow',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Phân bố Thiết bị</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={deviceChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thống kê Thiết bị</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deviceItems.map((device) => {
              const Icon = device.icon;
              const percentage = totalSessions > 0 ? ((device.value / totalSessions) * 100).toFixed(1) : '0';
              
              return (
                <div key={device.name} className={`flex items-center justify-between p-3 ${device.bgColor} rounded-lg`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 text-${device.color}-600`} />
                    <span className="font-medium">{device.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold text-${device.color}-600`}>
                      {device.value.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}