import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  filename?: string;
  size?: number;
  duration: number;
  success: boolean;
  error?: string;
}

interface BackupHistoryCardProps {
  backupHistory: BackupRecord[];
  onRefresh: () => void;
}

const BackupHistoryCard: React.FC<BackupHistoryCardProps> = ({
  backupHistory,
  onRefresh
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusBadge = (record: BackupRecord) => {
    if (record.success) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'automatic' ? 'secondary' : 'outline'}>
        {type === 'automatic' ? 'Auto' : 'Manual'}
      </Badge>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <div>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                Recent backup operations and their status
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {backupHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No backup history</p>
            <p className="text-sm">Create your first backup to see history here</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {backupHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-gray-600">
                      {record.success ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {record.filename || 'Backup'}
                        </span>
                        {getTypeBadge(record.type)}
                        {getStatusBadge(record)}
                      </div>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      {record.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {record.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    {record.size && (
                      <div className="text-sm font-medium text-gray-900">
                        {formatFileSize(record.size)}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {formatDuration(record.duration)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Summary Stats */}
        {backupHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-lg font-semibold text-gray-900">
                  {backupHistory.length}
                </div>
                <div className="text-xs text-gray-600">Total Backups</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-green-600">
                  {backupHistory.filter(r => r.success).length}
                </div>
                <div className="text-xs text-gray-600">Successful</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-red-600">
                  {backupHistory.filter(r => !r.success).length}
                </div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupHistoryCard;