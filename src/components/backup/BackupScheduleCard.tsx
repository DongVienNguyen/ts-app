import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Settings, Bell } from 'lucide-react';

interface BackupScheduleCardProps {
  autoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  lastAutoBackup?: string | null;
}

const BackupScheduleCard: React.FC<BackupScheduleCardProps> = ({
  autoBackupEnabled,
  onToggleAutoBackup,
  lastAutoBackup
}) => {
  const [scheduleTime, setScheduleTime] = useState('02:00');
  const [scheduleFrequency, setScheduleFrequency] = useState('daily');
  const [backupType, setBackupType] = useState('full');

  const getNextBackupTime = () => {
    if (!autoBackupEnabled) return 'Disabled';
    
    const now = new Date();
    const nextBackup = new Date();
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    
    nextBackup.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }
    
    return nextBackup.toLocaleString('vi-VN');
  };

  const handleSaveSchedule = () => {
    // Save schedule settings to localStorage
    localStorage.setItem('backupScheduleTime', scheduleTime);
    localStorage.setItem('backupScheduleFrequency', scheduleFrequency);
    localStorage.setItem('backupScheduleType', backupType);
    
    console.log('📅 Backup schedule saved:', {
      time: scheduleTime,
      frequency: scheduleFrequency,
      type: backupType
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Backup Schedule
        </CardTitle>
        <CardDescription>
          Configure automatic backup schedule and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Backup Toggle */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Automatic Backup</div>
              <div className="text-sm text-gray-500">
                Enable scheduled automatic backups
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoBackupEnabled}
              onCheckedChange={onToggleAutoBackup}
            />
            <Badge variant={autoBackupEnabled ? "default" : "secondary"}>
              {autoBackupEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>

        {/* Schedule Settings */}
        {autoBackupEnabled && (
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900">Schedule Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Time Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time</label>
                <Select value={scheduleTime} onValueChange={setScheduleTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01:00">01:00 AM</SelectItem>
                    <SelectItem value="02:00">02:00 AM</SelectItem>
                    <SelectItem value="03:00">03:00 AM</SelectItem>
                    <SelectItem value="04:00">04:00 AM</SelectItem>
                    <SelectItem value="05:00">05:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Frequency Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Frequency</label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Backup Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Select value={backupType} onValueChange={setBackupType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full System</SelectItem>
                    <SelectItem value="database">Database Only</SelectItem>
                    <SelectItem value="config">Configuration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSaveSchedule} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Save Schedule Settings
            </Button>
          </div>
        )}

        {/* Schedule Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Next Backup</span>
            </div>
            <div className="text-sm text-gray-600">
              {getNextBackupTime()}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Last Auto Backup</span>
            </div>
            <div className="text-sm text-gray-600">
              {lastAutoBackup 
                ? new Date(lastAutoBackup).toLocaleString('vi-VN')
                : 'Never'
              }
            </div>
          </div>
        </div>

        {/* Schedule Tips */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Schedule Tips:</strong>
            <ul className="mt-2 space-y-1">
              <li>• Backups are scheduled during low-traffic hours (1-5 AM)</li>
              <li>• Full system backups are recommended for complete protection</li>
              <li>• Database-only backups are faster but don't include configuration</li>
              <li>• Weekly or monthly schedules help manage storage space</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupScheduleCard;