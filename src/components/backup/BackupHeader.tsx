import React from 'react';
import { HardDrive, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const BackupHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <HardDrive className="h-6 w-6 text-white" />
        </div>
        <div className="flex items-center gap-2"> {/* Added flex and gap for alignment */}
          <h1 className="text-3xl font-bold text-gray-900">System Backup</h1>
          <Link to="/" aria-label="Trang chủ">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
      <p className="text-gray-600">Backup and restore your complete system data</p>
    </div>
  );
};

export default BackupHeader;