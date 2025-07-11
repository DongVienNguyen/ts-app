import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Pause, Settings, Database, FileText, Code, Shield } from 'lucide-react';

interface BackupActionsCardProps {
  isRunning: boolean;
  progress?: number;
  currentStep?: string;
  onPerformBackup: (backupType?: string) => void;
  onRefreshStatus: () => void;
}

const BackupActionsCard: React.FC<BackupActionsCardProps> = ({
  isRunning,
  progress = 0,
  currentStep = '',
  onPerformBackup,
  onRefreshStatus
}) => {
  const [selectedBackupType, setSelectedBackupType] = useState<string>('full');

  const backupTypes = [
    {
      value: 'full',
      label: 'Full System Backup',
      description: 'Complete backup including all data, config, and functions',
      icon: <Settings className="h-4 w-4" />,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      value: 'database',
      label: 'Database Only',
      description: 'All database tables exported as CSV files',
      icon: <Database className="h-4 w-4" />,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      value: 'config',
      label: 'Configuration',
      description: 'System settings and configuration files',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      value: 'functions',
      label: 'Edge Functions',
      description: 'Supabase Edge Functions metadata',
      icon: <Code className="h-4 w-4" />,
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      value: 'security',
      label: 'Security Data',
      description: 'Security events, sessions, and error logs',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-red-600 hover:bg-red-700'
    }
  ];

  const selectedType = backupTypes.find(type => type.value === selectedBackupType);

  const handleBackupClick = () => {
    console.log('🎯 BackupActionsCard: Backup button clicked, type:', selectedBackupType);
    onPerformBackup(selectedBackupType);
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
          Create a system backup or refresh status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Backup Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Backup Type</label>
            <Select value={selectedBackupType} onValueChange={setSelectedBackupType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select backup type" />
              </SelectTrigger>
              <SelectContent>
                {backupTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Type Info */}
          {selectedType && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {selectedType.icon}
                <span className="font-medium text-gray-900">{selectedType.label}</span>
                <Badge variant="outline">{selectedType.value}</Badge>
              </div>
              <p className="text-sm text-gray-600">{selectedType.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleBackupClick}
              disabled={isRunning}
              className={`flex-1 text-white ${selectedType?.color || 'bg-green-600 hover:bg-green-700'}`}
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
                  Create {selectedType?.label || 'Backup'}
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
              <strong>Backup Information:</strong>
              <ul className="mt-2 space-y-1">
                {selectedBackupType === 'full' && (
                  <>
                    <li>• All database tables (CSV format)</li>
                    <li>• System configuration and settings</li>
                    <li>• Edge functions metadata</li>
                    <li>• Security events and logs</li>
                  </>
                )}
                {selectedBackupType === 'database' && (
                  <>
                    <li>• All database tables exported as CSV files</li>
                    <li>• Individual CSV file for each table</li>
                    <li>• Metadata with table statistics</li>
                  </>
                )}
                {selectedBackupType === 'config' && (
                  <>
                    <li>• Application settings and preferences</li>
                    <li>• Feature configurations</li>
                    <li>• System parameters</li>
                  </>
                )}
                {selectedBackupType === 'functions' && (
                  <>
                    <li>• Edge functions list and metadata</li>
                    <li>• Function configurations</li>
                    <li>• API endpoints information</li>
                  </>
                )}
                {selectedBackupType === 'security' && (
                  <>
                    <li>• Security events and monitoring data</li>
                    <li>• User sessions and activity logs</li>
                    <li>• System errors and diagnostics</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Quick Stats */}
          {!isRunning && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {selectedBackupType === 'database' ? '20+' : selectedBackupType === 'full' ? 'All' : '1'}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedBackupType === 'database' ? 'Tables' : 'Components'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {selectedBackupType === 'database' ? 'CSV' : 'ZIP'}
                </div>
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