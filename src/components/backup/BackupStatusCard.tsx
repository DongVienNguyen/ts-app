import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Database } from 'lucide-react';

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
      <CardContent className="space-y-4">
        {backupStatus.isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{backupStatus.currentStep}</span>
              <span>{backupStatus.progress}%</span>
            </div>
            <Progress value={backupStatus.progress} className="w-full" />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-backup">Auto Backup</Label>
            <Switch
              id="auto-backup"
              checked={backupStatus.autoBackupEnabled}
              onCheckedChange={onToggleAutoBackup}
              disabled={backupStatus.isRunning}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Last Backup</p>
            <p className="font-medium">
              {backupStatus.lastBackup 
                ? new Date(backupStatus.lastBackup).toLocaleString()
                : 'Never'
              }
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Next Auto Backup</p>
            <p className="font-medium">
              {backupStatus.autoBackupEnabled ? 'Tomorrow 2:00 AM' : 'Disabled'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupStatusCard;