import React from 'react';
import { HardDrive } from 'lucide-react';

const BackupHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <HardDrive className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Backup</h1>
          <p className="text-gray-600">Backup and restore your complete system data</p>
        </div>
      </div>
    </div>
  );
};

export default BackupHeader;