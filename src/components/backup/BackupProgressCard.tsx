import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, Pause, X } from 'lucide-react';

interface BackupProgressCardProps {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number | null;
  onCancel?: () => void;
  onPause?: () => void;
}

const BackupProgressCard: React.FC<BackupProgressCardProps> = ({
  isRunning,
  progress,
  currentStep,
  estimatedTimeRemaining,
  onCancel,
  onPause
}) => {
  const formatTime = (ms: number | null) => {
    if (!ms) return 'Calculating...';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-blue-600';
    if (progress < 70) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (!isRunning) return null;

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
            <div>
              <CardTitle className="text-blue-900">Backup in Progress</CardTitle>
              <CardDescription className="text-blue-700">
                Please wait while we create your system backup
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="text-blue-600 border-blue-300"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 border-red-300"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">
                {currentStep || 'Processing...'}
              </span>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {progress}%
              </Badge>
            </div>
            <div className="relative">
              <Progress 
                value={progress} 
                className="w-full h-3"
              />
              <div 
                className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <Clock className="w-4 h-4" />
              <span>Time remaining: {formatTime(estimatedTimeRemaining)}</span>
            </div>
            <div className="text-right text-blue-600">
              <span className="font-medium">
                {progress < 100 ? 'In Progress' : 'Completing...'}
              </span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { step: 1, label: 'Init', threshold: 10 },
              { step: 2, label: 'Database', threshold: 30 },
              { step: 3, label: 'Config', threshold: 50 },
              { step: 4, label: 'Files', threshold: 80 },
              { step: 5, label: 'Complete', threshold: 100 }
            ].map(({ step, label, threshold }) => (
              <div key={step} className="text-center">
                <div 
                  className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    progress >= threshold 
                      ? 'bg-green-600 text-white' 
                      : progress >= threshold - 20
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
                <div className={`text-xs ${
                  progress >= threshold ? 'text-green-600 font-medium' : 'text-gray-500'
                }`}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Please don't close this page</strong> while backup is in progress. 
              The process will continue in the background.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupProgressCard;