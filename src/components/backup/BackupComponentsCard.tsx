import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Code, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface BackupItem {
  id: string;
  name: string;
  description: string;
  size: string;
  lastBackup: string;
  status: 'success' | 'error' | 'pending';
}

interface BackupComponentsCardProps {
  backupItems: BackupItem[];
}

const BackupComponentsCard: React.FC<BackupComponentsCardProps> = ({
  backupItems
}) => {
  const getStatusIcon = (status: BackupItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card>
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
          {backupItems.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.size}</p>
                  <p className="text-xs text-gray-500">{item.lastBackup}</p>
                </div>
              </div>
              {index < backupItems.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupComponentsCard;