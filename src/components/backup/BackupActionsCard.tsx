import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw, Play, Pause, Settings } from 'lucide-react';

interface BackupActionsCardProps {
  isRunning: boolean;
  progress?: number;
  currentStep?: string;
  onPerformBackup: () => void;
  onRefreshStatus: () => void;
}

const BackupActionsCard: React.FC<BackupActionsCardProps> = ({
  isRunning,
  progress = 0,
  currentStep = '',
  onPerformBackup,
  onRefreshStatus
}) => {
  const handleBackupClick = () => {
    console.log('🎯 BackupActionsCard: Backup button clicked');
    onPerformBackup();
  };

  const handleRefreshClick = () => {
    console.log('🎯 BackupActionsCard: Refresh button clicked');
    onRefreshStatus();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Backup Actions
        </CardTitle>
        <CardDescription>
          Create a complete system backup or refresh status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleBackupClick}
              disabled={isRunning}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Create Full Backup
                </>
              )}
            </Button>
            
            <Button
              onClick={handleRefreshClick}
              variant="outline"
              disabled={isRunning}
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
          </div>

          {/* Progress Bar (if backup is running) */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{currentStep || 'Processing...'}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
            </div>
          )}

          {/* Information Panel */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Backup includes:</strong>
              <ul className="mt-2 space-y-1">
                <li>• All database tables and data</li>
                <li>• System configuration and settings</li>
                <li>• Edge functions metadata</li>
                <li>• User accounts and permissions</li>
                <li>• Notification and reminder data</li>
              </ul>
            </div>
          </div>

          {/* Quick Stats */}
          {!isRunning && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">20+</div>
                <div className="text-xs text-gray-600">Tables</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">ZIP</div>
                <div className="text-xs text-gray-600">Format</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">Auto</div>
                <div className="text-xs text-gray-600">Download</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupActionsCard;