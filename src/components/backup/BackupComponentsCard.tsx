import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Code, Settings, FileText } from 'lucide-react';

interface BackupItem {
  id: string;
  name: string;
  description: string;
  size: string;
  lastBackup: string;
  status: 'success' | 'error' | 'pending' | 'running';
  recordCount?: number;
}

interface BackupComponentsCardProps {
  backupItems: BackupItem[];
}

const BackupComponentsCard: React.FC<BackupComponentsCardProps> = ({
  backupItems
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'functions':
        return <Code className="h-5 w-5" />;
      case 'source':
        return <FileText className="h-5 w-5" />;
      case 'config':
        return <Settings className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 animate-pulse">Running</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Backup Components
        </CardTitle>
        <CardDescription>
          Individual system components included in backup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {backupItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-gray-600">
                  {getIcon(item.id)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                  {item.recordCount && (
                    <div className="text-xs text-gray-400">{item.recordCount} records</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{item.size}</div>
                  <div className="text-xs text-gray-500">
                    Last: {item.lastBackup === 'Never' ? 'Never' : new Date(item.lastBackup).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupComponentsCard;