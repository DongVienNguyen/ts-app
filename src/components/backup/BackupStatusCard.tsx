import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Database, Clock, Calendar } from 'lucide-react';

interface BackupStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastBackup: string | null;
  autoBackupEnabled: boolean;
}

interface BackupStatusCardProps {
  backupStatus: BackupStatus;
  onToggleAutoBackup: (enabled: boolean) => void;
}

const BackupStatusCard: React.FC<BackupStatusCardProps> = ({
  backupStatus,
  onToggleAutoBackup
}) => {
  const formatLastBackup = (lastBackup: string | null) => {
    if (!lastBackup) return 'Never';
    return new Date(lastBackup).toLocaleString('vi-VN');
  };

  const getNextAutoBackup = () => {
    if (!backupStatus.autoBackupEnabled) return 'Disabled';
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);
    
    return tomorrow.toLocaleString('vi-VN');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup Status
        </CardTitle>
        <CardDescription>
          Current backup status and configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Auto Backup Toggle */}
          <div className="space-y-2">
            <Label htmlFor="auto-backup" className="text-sm font-medium">
              Auto Backup
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-backup"
                checked={backupStatus.autoBackupEnabled}
                onCheckedChange={onToggleAutoBackup}
              />
              <span className="text-sm text-gray-600">
                {backupStatus.autoBackupEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Last Backup */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last Backup
            </Label>
            <div className="text-lg font-semibold text-gray-900">
              {formatLastBackup(backupStatus.lastBackup)}
            </div>
          </div>

          {/* Next Auto Backup */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next Auto Backup
            </Label>
            <div className="text-lg font-semibold text-gray-900">
              {getNextAutoBackup()}
            </div>
          </div>
        </div>

        {/* Progress Bar (if backup is running) */}
        {backupStatus.isRunning && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{backupStatus.currentStep}</span>
              <span>{backupStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${backupStatus.progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupStatusCard;