import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Clock, Settings } from 'lucide-react';

interface BackupActionsCardProps {
  isRunning: boolean;
  onPerformBackup: () => void;
  onRefreshStatus: () => void;
}

const BackupActionsCard: React.FC<BackupActionsCardProps> = ({
  isRunning,
  onPerformBackup,
  onRefreshStatus
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Backup Actions
        </CardTitle>
        <CardDescription>
          Manual backup operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onPerformBackup}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isRunning ? 'Creating Backup...' : 'Create Full Backup'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onRefreshStatus}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupActionsCard;