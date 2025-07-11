import React from 'react';
import { Badge } from '@/components/ui/badge';
import { HardDrive } from 'lucide-react';

const BackupHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-responsive-2xl font-bold text-gray-900">System Backup</h1>
        <p className="text-responsive-sm text-gray-600 mt-1">
          Backup and restore your complete system data
        </p>
      </div>
      <Badge variant="outline" className="flex items-center gap-2">
        <HardDrive className="h-4 w-4" />
        Backup Center
      </Badge>
    </div>
  );
};

export default BackupHeader;